import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  withErrorHandler,
  withOrganizationAccess,
  OrganizationContext,
  OrganizationPermission,
} from '@/lib/api/middleware';
import {
  createApiResponse,
  createBadRequestResponse,
  createForbiddenResponse,
} from '@/lib/api/response';
import { sendInvitationEmail } from '@/lib/email-service';
import { generateInvitationToken } from '@/lib/utils/token-utils';
import { canInviteMembers, canAssignRole } from '@/lib/auth/permissions';
import { isValidOrganizationRole } from '@/lib/constants/roles';

// Create an invitation
export const POST = withErrorHandler(
  withOrganizationAccess(
    OrganizationPermission.INVITE_MEMBERS,
    async (request: NextRequest, context: OrganizationContext) => {
      const { userId, organizationId } = context;
      const { email, role = 'member' } = await request.json();

      if (!email) {
        return createBadRequestResponse('Email is required');
      }

      // Validate role format
      if (!isValidOrganizationRole(role)) {
        return createBadRequestResponse('Invalid role. Must be owner, admin, or member');
      }

      // Check if organization can invite members (enterprise check)
      const { canInvite, reason: accountTypeReason } = await canInviteMembers(organizationId);
      if (!canInvite) {
        return createForbiddenResponse(accountTypeReason || 'Cannot invite members');
      }

      // Validate that user can assign the requested role
      const { canAssign, reason: roleReason } = await canAssignRole(
        userId,
        role,
        organizationId
      );

      if (!canAssign) {
        return createForbiddenResponse(roleReason || 'Cannot assign this role');
      }

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        const existingMembership = await prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: organizationId,
            },
          },
        });

        if (existingMembership) {
          return createBadRequestResponse('User is already a member of this organization');
        }
      }

      // Check if there's already a pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email,
          organizationId: organizationId,
          status: 'pending',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInvitation) {
        return createBadRequestResponse('An invitation has already been sent to this email');
      }

      // Generate invitation token
      const { token, expiresAt } = generateInvitationToken(7);

      // Get or create a project for the invitation
      const firstProject = await prisma.project.findFirst({
        where: {
          organizationId: organizationId,
        },
      });

      let projectId = firstProject?.id;

      if (!projectId) {
        // Create a default project if none exists
        const defaultProject = await prisma.project.create({
          data: {
            title: 'Default Workspace',
            description: 'Default workspace for the organization',
            organizationId: organizationId,
            visibility: 'organization',
          },
        });
        projectId = defaultProject.id;
      }

      // Get organization and inviter details for email
      const [organization, inviter] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true, email: true },
        }),
      ]);

      // Create the invitation
      const invitation = await prisma.invitation.create({
        data: {
          email,
          role,
          token,
          expiresAt,
          organizationId: organizationId,
          projectId,
          invitedById: userId,
          status: 'pending',
        },
      });

      // Send invitation email
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wansom.ai';
      const inviteUrl = `${baseUrl}/accept-invitation?token=${token}`;

      try {
        await sendInvitationEmail({
          email,
          inviterName: inviter?.fullName || inviter?.email || 'A team member',
          organizationName: organization?.name || 'the organization',
          role,
          inviteUrl,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      return createApiResponse(
        {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            createdAt: invitation.createdAt.toISOString(),
          },
        },
        'Invitation sent successfully'
      );
    }
  )
);
