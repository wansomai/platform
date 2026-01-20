import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { checkProjectAccess } from "@/lib/auth/authorization";
import { sendProjectInvitationEmail } from "@/lib/email-service";
import { canInviteMembers } from "@/lib/auth/permissions";
import { isValidWorkspaceRole } from "@/lib/constants/roles";
import crypto from "crypto";

/**
 * POST /api/projects/[id]/invite
 * Invite a member to a specific project
 * Note: The user must first be invited to the organization if they're not already a member
 */
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;
  const { email, role = 'member' } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Validate workspace role
  if (!isValidWorkspaceRole(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be admin or member' },
      { status: 400 }
    );
  }

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have access to this project' },
      { status: 403 }
    );
  }

  // Get current user's organization
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      fullName: true,
      email: true
    }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  const organizationId = currentUser.organizationId;

  // Check if organization can invite members (enterprise check)
  const { canInvite, reason: accountTypeReason } = await canInviteMembers(organizationId);
  if (!canInvite) {
    return NextResponse.json(
      {
        error: accountTypeReason || 'Cannot invite members',
        requiresUpgrade: true
      },
      { status: 403 }
    );
  }

  // Get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      organizationId: true,
      organization: {
        select: { name: true }
      }
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Verify project belongs to user's organization
  if (project.organizationId !== organizationId) {
    return NextResponse.json(
      { error: 'Project does not belong to your organization' },
      { status: 403 }
    );
  }

  // Check if invitee is already a member of the organization
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const existingMembership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: organizationId
        }
      }
    });

    // If they're already an org member, just add them to the project
    if (existingMembership) {
      const existingProjectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: existingUser.id,
            projectId: projectId
          }
        }
      });

      if (existingProjectMember) {
        return NextResponse.json(
          { error: 'User is already a member of this project' },
          { status: 400 }
        );
      }

      // Add directly to project
      await prisma.projectMember.create({
        data: {
          userId: existingUser.id,
          projectId: projectId,
          role: role
        }
      });

      return NextResponse.json({
        success: true,
        message: 'User added to project successfully',
        type: 'direct_add'
      });
    }
  }

  // Check if there's already a pending invitation for this project
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      projectId: projectId,
      organizationId: organizationId,
      status: 'pending',
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingInvitation) {
    return NextResponse.json(
      { error: 'An invitation to this project has already been sent to this email' },
      { status: 400 }
    );
  }

  // Create invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  // Create the invitation
  const invitation = await prisma.invitation.create({
    data: {
      email,
      role, // Workspace role (admin/member)
      token,
      expiresAt,
      organizationId: organizationId,
      projectId: projectId,
      invitedById: userId,
      status: 'pending'
    }
  });

  // Send project invitation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wansom.ai';
  const inviteUrl = `${baseUrl}/accept-invitation?token=${token}`;

  try {
    await sendProjectInvitationEmail({
      email,
      inviterName: currentUser.fullName || currentUser.email || 'A team member',
      projectName: project.title,
      organizationName: project.organization.name,
      role,
      inviteUrl
    });
  } catch (emailError) {
    console.error('Failed to send project invitation email:', emailError);
    // Don't fail the invitation creation if email fails
  }

  return NextResponse.json({
    success: true,
    message: 'Project invitation sent successfully',
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      projectId: invitation.projectId,
      createdAt: invitation.createdAt.toISOString()
    }
  });
}));
