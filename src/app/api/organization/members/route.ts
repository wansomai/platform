import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  withErrorHandler,
  withOrganizationAccess,
  OrganizationContext,
  withAuth,
} from '@/lib/api/middleware';
import {
  createApiResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createForbiddenResponse,
} from '@/lib/api/response';
import {
  hasOrganizationPermission,
  canManageUser,
  canRemoveFromPersonalOrg,
  getOrganizationDetails,
} from '@/lib/auth/permissions';
import { OrganizationPermission } from '@/lib/constants/permissions';
import { sendMemberRemovedEmail } from '@/lib/email-service';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

// Get organization members
export const GET = withErrorHandler(
  withOrganizationAccess(
    OrganizationPermission.VIEW_MEMBERS,
    async (request: NextRequest, context: OrganizationContext) => {
      const { organizationId } = context;

      // Get organization details including owner info
      const orgDetails = await getOrganizationDetails(organizationId);

      const members = await prisma.userOrganization.findMany({
        where: {
          organizationId: organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      const formattedMembers = members.map((member: any) => ({
        id: member.user.id,
        name: member.user.fullName || member.user.email,
        email: member.user.email,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        isOwner: member.user.id === orgDetails?.ownerId,
      }));

      return NextResponse.json({
        members: formattedMembers,
        organization: {
          id: orgDetails?.id,
          name: orgDetails?.name,
          accountType: orgDetails?.accountType,
          ownerId: orgDetails?.ownerId,
        },
      });
    }
  )
);

// Remove a member from organization
// Note: This handler has complex permission logic that requires manual checks
export const DELETE = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const { memberId } = await request.json();

    if (!memberId) {
      return createBadRequestResponse('Member ID is required');
    }

    // Get user's active organization
    const organizationId = await getActiveOrganizationId(userId);

    if (!organizationId) {
      return createNotFoundResponse('User organization');
    }

    // Check if current user has permission to remove members
    const hasPermission = await hasOrganizationPermission(
      userId,
      organizationId,
      OrganizationPermission.REMOVE_MEMBERS
    );

    if (!hasPermission) {
      return createForbiddenResponse('Insufficient permissions to remove members');
    }

    // Check if current user can manage the target user (role hierarchy check)
    const { canManage, reason } = await canManageUser(userId, memberId, organizationId);

    if (!canManage) {
      return createForbiddenResponse(reason || 'Cannot manage this user');
    }

    // Check if member exists in this organization
    const memberOrganization = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId: organizationId,
        },
      },
    });

    if (!memberOrganization) {
      return createNotFoundResponse('Member in this organization');
    }

    // Check if this is a personal organization and prevent owner removal
    const canRemove = await canRemoveFromPersonalOrg(memberId, organizationId);

    if (!canRemove) {
      return createBadRequestResponse(
        'Cannot remove the owner from their personal organization'
      );
    }

    // Get the user being removed to handle active organization switching
    const memberUser = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        organizationId: true,
        activeOrganizationId: true,
        email: true,
        fullName: true,
      },
    });

    if (!memberUser) {
      return createNotFoundResponse('User');
    }

    // Get organization and current user details for email notification
    const [organization, currentUserDetails] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      }),
    ]);

    // Remove the user from the organization
    await prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId: organizationId,
        },
      },
    });

    // If this was the user's active organization, switch them back to their personal organization
    if (memberUser.activeOrganizationId === organizationId) {
      await prisma.user.update({
        where: { id: memberId },
        data: {
          activeOrganizationId: memberUser.organizationId, // Fall back to personal org
        },
      });
    }

    // Send notification email (non-blocking)
    if (organization && memberUser.email) {
      try {
        await sendMemberRemovedEmail({
          memberEmail: memberUser.email,
          memberName: memberUser.fullName || memberUser.email,
          organizationName: organization.name,
          removedByName:
            currentUserDetails?.fullName ||
            currentUserDetails?.email ||
            'An administrator',
        });
      } catch (emailError) {
        console.error('Failed to send member removal notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return createApiResponse(
      { removed: true },
      'Member removed from organization. They have been switched back to their personal organization.'
    );
  })
);
