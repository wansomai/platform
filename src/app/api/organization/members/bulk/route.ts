import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import {
  hasOrganizationPermission,
  canManageUser,
  canAssignRole,
  canRemoveFromPersonalOrg
} from "@/lib/auth/permissions";
import { OrganizationPermission } from "@/lib/constants/permissions";
import { isValidOrganizationRole } from "@/lib/constants/roles";
import { sendRoleChangeEmail, sendMemberRemovedEmail } from "@/lib/email-service";

const prisma = new PrismaClient();

/**
 * POST /api/organization/members/bulk
 * Perform bulk operations on members: remove or change roles
 */
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { action, memberIds, newRole } = await request.json();

  // Validate request
  if (!action || !Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json(
      { error: 'Action and memberIds array are required' },
      { status: 400 }
    );
  }

  if (action !== 'remove' && action !== 'changeRole') {
    return NextResponse.json(
      { error: 'Action must be either "remove" or "changeRole"' },
      { status: 400 }
    );
  }

  if (action === 'changeRole') {
    if (!newRole || !isValidOrganizationRole(newRole)) {
      return NextResponse.json(
        { error: 'Valid role is required for changeRole action' },
        { status: 400 }
      );
    }
  }

  // Get current user's organization
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, fullName: true, email: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  const organizationId = currentUser.organizationId;

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true }
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  // Check permissions based on action
  if (action === 'remove') {
    const hasPermission = await hasOrganizationPermission(
      userId,
      organizationId,
      OrganizationPermission.REMOVE_MEMBERS
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      );
    }
  } else if (action === 'changeRole') {
    const hasPermission = await hasOrganizationPermission(
      userId,
      organizationId,
      OrganizationPermission.CHANGE_MEMBER_ROLES
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change member roles' },
        { status: 403 }
      );
    }

    // Validate that user can assign the requested role
    const { canAssign, reason } = await canAssignRole(userId, newRole, organizationId);
    if (!canAssign) {
      return NextResponse.json(
        { error: reason || 'Cannot assign this role' },
        { status: 403 }
      );
    }
  }

  const results = {
    successful: [] as string[],
    failed: [] as { memberId: string; reason: string }[]
  };

  // ✅ OPTIMIZATION: Batch fetch all member data to avoid N+1 queries
  const [memberOrganizations, memberDetails] = await Promise.all([
    prisma.userOrganization.findMany({
      where: {
        userId: { in: memberIds },
        organizationId: organizationId
      },
      select: {
        userId: true,
        role: true
      }
    }),
    prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        organizationId: true,
        activeOrganizationId: true,
        email: true,
        fullName: true
      }
    })
  ]);

  type MemberDetails = {
    id: string;
    organizationId: string;
    activeOrganizationId: string | null;
    email: string;
    fullName: string | null;
  };

  type MemberOrg = {
    userId: string;
    role: string;
  };

  // Create lookup maps for O(1) access
  const memberOrgMap = new Map<string, MemberOrg>(memberOrganizations.map((mo: MemberOrg) => [mo.userId, mo]));
  const memberDetailsMap = new Map<string, MemberDetails>(memberDetails.map((m: MemberDetails) => [m.id, m]));

  // Process each member
  for (const memberId of memberIds) {
    try {
      // Check if current user can manage the target user
      const { canManage, reason } = await canManageUser(userId, memberId, organizationId);

      if (!canManage) {
        results.failed.push({ memberId, reason: reason || 'Cannot manage this user' });
        continue;
      }

      // Check if member exists in organization (using map lookup)
      const memberOrganization = memberOrgMap.get(memberId);

      if (!memberOrganization) {
        results.failed.push({ memberId, reason: 'Member not found in organization' });
        continue;
      }

      // Get member details (using map lookup)
      const member = memberDetailsMap.get(memberId);

      if (!member) {
        results.failed.push({ memberId, reason: 'User not found' });
        continue;
      }

      if (action === 'remove') {
        // Check if can remove from personal org
        const canRemove = await canRemoveFromPersonalOrg(memberId, organizationId);
        if (!canRemove) {
          results.failed.push({ memberId, reason: 'Cannot remove owner from personal organization' });
          continue;
        }

        // Remove the member
        await prisma.userOrganization.delete({
          where: {
            userId_organizationId: {
              userId: memberId,
              organizationId: organizationId
            }
          }
        });

        // If this was the user's active organization, switch them back
        if (member.activeOrganizationId && member.activeOrganizationId === organizationId) {
          await prisma.user.update({
            where: { id: memberId },
            data: {
              activeOrganizationId: member.organizationId
            }
          });
        }

        // Send notification email (non-blocking)
        if (member.email) {
          sendMemberRemovedEmail({
            memberEmail: member.email,
            memberName: member.fullName || member.email,
            organizationName: organization.name,
            removedByName: currentUser.fullName || currentUser.email || 'An administrator'
          }).catch(err => console.error('Failed to send removal email:', err));
        }

        results.successful.push(memberId);
      } else if (action === 'changeRole') {
        // Update the role
        await prisma.userOrganization.update({
          where: {
            userId_organizationId: {
              userId: memberId,
              organizationId: organizationId
            }
          },
          data: {
            role: newRole
          }
        });

        // Send notification email (non-blocking)
        if (member.email) {
          sendRoleChangeEmail({
            memberEmail: member.email,
            memberName: member.fullName || member.email,
            organizationName: organization.name,
            oldRole: memberOrganization.role,
            newRole: newRole,
            changedByName: currentUser.fullName || currentUser.email || 'An administrator'
          }).catch(err => console.error('Failed to send role change email:', err));
        }

        results.successful.push(memberId);
      }
    } catch (error) {
      console.error(`Error processing member ${memberId}:`, error);
      results.failed.push({ memberId, reason: 'Internal error processing request' });
    }
  }

  const totalProcessed = results.successful.length + results.failed.length;
  const message = action === 'remove'
    ? `Bulk remove completed: ${results.successful.length}/${totalProcessed} members removed successfully`
    : `Bulk role change completed: ${results.successful.length}/${totalProcessed} members updated successfully`;

  return NextResponse.json({
    success: true,
    message,
    results: {
      successful: results.successful,
      failed: results.failed,
      successCount: results.successful.length,
      failedCount: results.failed.length
    }
  });
}));
