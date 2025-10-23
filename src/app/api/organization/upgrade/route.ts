import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { hasOrganizationPermission, isOrganizationOwner } from "@/lib/auth/permissions";
import { OrganizationPermission } from "@/lib/constants/permissions";
import { AccountType } from "@/lib/constants/roles";
import { sendUpgradeApprovalEmail } from "@/lib/email-service";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * POST /api/organization/upgrade
 * Upgrade a personal organization to enterprise
 * Only the organization owner can perform this action
 */
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // Get current user's organization
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

  // Check if user has permission to upgrade (owner only)
  const hasPermission = await hasOrganizationPermission(
    userId,
    organizationId,
    OrganizationPermission.UPGRADE_ACCOUNT
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Only organization owners can upgrade accounts' },
      { status: 403 }
    );
  }

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      accountType: true,
      ownerId: true
    }
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  // Check if already enterprise
  if (organization.accountType === AccountType.ENTERPRISE) {
    return NextResponse.json(
      {
        error: 'Organization is already an enterprise account',
        organization: {
          id: organization.id,
          name: organization.name,
          accountType: organization.accountType
        }
      },
      { status: 400 }
    );
  }

  // Get requester details
  const requester = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      fullName: true
    }
  });

  if (!requester) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Generate approval token
  const approvalToken = crypto.randomBytes(32).toString('hex');

  // Update organization with upgrade request
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      upgradeRequestToken: approvalToken,
      upgradeRequestedAt: new Date()
    }
  });

  // Send approval email to admin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wansom.ai';
  const approvalUrl = `${baseUrl}/api/organization/upgrade/approve?token=${approvalToken}`;
  const adminEmail = process.env.ADMIN_EMAIL || 'law@wansom.ai';

  try {
    await sendUpgradeApprovalEmail({
      adminEmail,
      organizationName: organization.name,
      requesterName: requester.fullName || requester.email,
      requesterEmail: requester.email,
      approvalUrl
    });
  } catch (emailError) {
    console.error('Failed to send upgrade approval email:', emailError);
    // Don't fail the request if email fails
  }

  return NextResponse.json({
    success: true,
    message: 'Upgrade request submitted successfully. An admin will review your request shortly.',
    status: 'pending'
  });
}));

/**
 * GET /api/organization/upgrade
 * Check if organization can be upgraded and get upgrade information
 */
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // Get current user's organization
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

  // Check if user is owner
  const isOwner = await isOrganizationOwner(userId, organizationId);

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      accountType: true,
      ownerId: true,
      _count: {
        select: {
          members: true,
          projects: true
        }
      }
    }
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  const canUpgrade = isOwner && organization.accountType === AccountType.PERSONAL;

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      accountType: organization.accountType,
      memberCount: organization._count.members,
      projectCount: organization._count.projects
    },
    canUpgrade,
    isOwner,
    upgradeInfo: {
      currentPlan: organization.accountType,
      targetPlan: AccountType.ENTERPRISE,
      features: {
        personal: [
          'Single user workspace',
          'Limited projects',
          'Basic features'
        ],
        enterprise: [
          'Team collaboration',
          'Invite unlimited members',
          'Role-based access control',
          'Workspace-level permissions',
          'Advanced features',
          'Priority support'
        ]
      }
    }
  });
}));

/**
 * DELETE /api/organization/upgrade
 * Downgrade an enterprise organization to personal
 * Only the organization owner can perform this action
 * WARNING: This will remove all members except the owner
 */
export const DELETE = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  // Get current user's organization
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

  // Check if user is the owner (only owners can downgrade)
  const isOwner = await isOrganizationOwner(userId, organizationId);

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Only organization owners can downgrade accounts' },
      { status: 403 }
    );
  }

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      accountType: true,
      ownerId: true,
      _count: {
        select: {
          members: true,
          projects: true,
          invitations: true
        }
      }
    }
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  // Check if already personal
  if (organization.accountType === AccountType.PERSONAL) {
    return NextResponse.json(
      {
        error: 'Organization is already a personal account',
        organization: {
          id: organization.id,
          name: organization.name,
          accountType: organization.accountType
        }
      },
      { status: 400 }
    );
  }

  // Warn about member removal
  const nonOwnerMemberCount = organization._count.members - 1; // Exclude owner

  // Use a transaction to downgrade and remove members
  const result = await prisma.$transaction(async (tx) => {
    // Remove all non-owner members
    await tx.userOrganization.deleteMany({
      where: {
        organizationId: organizationId,
        userId: {
          not: userId // Keep owner
        }
      }
    });

    // Cancel all pending invitations
    await tx.invitation.updateMany({
      where: {
        organizationId: organizationId,
        status: 'pending'
      },
      data: {
        status: 'cancelled'
      }
    });

    // Downgrade to personal
    const updatedOrganization = await tx.organization.update({
      where: { id: organizationId },
      data: {
        accountType: AccountType.PERSONAL
      },
      select: {
        id: true,
        name: true,
        accountType: true,
        ownerId: true,
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    });

    return {
      organization: updatedOrganization,
      removedMembers: nonOwnerMemberCount,
      cancelledInvitations: organization._count.invitations
    };
  });

  return NextResponse.json({
    success: true,
    message: `Successfully downgraded ${organization.name} to Personal account`,
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      accountType: result.organization.accountType,
      ownerId: result.organization.ownerId,
      memberCount: result.organization._count.members,
      projectCount: result.organization._count.projects
    },
    removedMembers: result.removedMembers,
    cancelledInvitations: result.cancelledInvitations,
    warning: 'All team members have been removed and pending invitations cancelled'
  });
}));
