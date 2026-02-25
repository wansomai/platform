import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { isOrganizationOwner } from "@/lib/auth/permissions";
import { AccountType } from "@/lib/constants/roles";

/**
 * POST /api/organization/upgrade
 * Redirects callers to the Paystack self-serve checkout flow.
 * The admin-approval flow has been replaced by instant Paystack seat billing.
 */
export const POST = withErrorHandler(withAuth(async (_request: NextRequest, _userId: string) => {
  return NextResponse.json(
    {
      error: 'Please use the payment checkout to upgrade to the Teams plan.',
      redirectTo: '/payment/teams',
    },
    { status: 400 }
  );
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
      upgradeRequestToken: true,
      upgradeRequestedAt: true,
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

  const hasPendingRequest = !!(organization.upgradeRequestToken && organization.upgradeRequestedAt);
  const canUpgrade = isOwner && organization.accountType === AccountType.PERSONAL && !hasPendingRequest;

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
    hasPendingRequest,
    upgradeRequestedAt: organization.upgradeRequestedAt,
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
