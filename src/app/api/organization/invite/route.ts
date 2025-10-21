import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth/authorization";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { sendInvitationEmail } from "@/lib/email-service";
import crypto from "crypto";
import {
  hasOrganizationPermission,
  canInviteMembers,
  canAssignRole
} from "@/lib/auth/permissions";
import { OrganizationPermission } from "@/lib/constants/permissions";
import { OrganizationRole } from "@/lib/constants/roles";

const prisma = new PrismaClient();

// Create an invitation
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { email, role = 'member' } = await request.json();

  

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
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

  // Check if current user has permission to invite members
  const hasPermission = await hasOrganizationPermission(
    userId,
    organizationId,
    OrganizationPermission.INVITE_MEMBERS
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions to invite members' },
      { status: 403 }
    );
  }

  // Validate that user can assign the requested role
  const { canAssign, reason: roleReason } = await canAssignRole(
    userId,
    role,
    organizationId
  );

  if (!canAssign) {
    return NextResponse.json(
      { error: roleReason || 'Cannot assign this role' },
      { status: 403 }
    );
  }

  // Check if user is already a member
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

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }
  }

  // Check if there's already a pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      organizationId: organizationId,
      status: 'pending',
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingInvitation) {
    return NextResponse.json(
      { error: 'An invitation has already been sent to this email' },
      { status: 400 }
    );
  }

  // Create invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  // We need a project ID for the invitation - let's get the first project or create a default one
  const firstProject = await prisma.project.findFirst({
    where: {
      organizationId: organizationId
    }
  });

  let projectId = firstProject?.id;

  if (!projectId) {
    // Create a default project if none exists
    const defaultProject = await prisma.project.create({
      data: {
        title: 'Default Workspace',
        description: 'Default workspace for the organization',
        organizationId: organizationId,
        visibility: 'organization' // Organization-wide visibility by default
      }
    });
    projectId = defaultProject.id;
  }

  // Get organization and inviter details for email
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true }
  });

  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true }
  });

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
      status: 'pending'
    }
  });

  // Send invitation email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wansom.ai';
  const inviteUrl = `${baseUrl}/accept-invitation?token=${token}`;

  try {
    await sendInvitationEmail({
      email,
      inviterName: inviter?.fullName || inviter?.email || 'A team member',
      organizationName: organization?.name || 'the organization',
      role,
      inviteUrl
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Don't fail the invitation creation if email fails
  }

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt.toISOString()
    }
  });
}));