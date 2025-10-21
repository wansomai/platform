import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { hasOrganizationPermission, isOrganizationOwner } from "@/lib/auth/permissions";
import { OrganizationPermission } from "@/lib/constants/permissions";
import { AccountType } from "@/lib/constants/roles";

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

  // Upgrade to enterprise
  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      accountType: AccountType.ENTERPRISE
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

  return NextResponse.json({
    success: true,
    message: `Successfully upgraded ${organization.name} to Enterprise`,
    organization: {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      accountType: updatedOrganization.accountType,
      ownerId: updatedOrganization.ownerId,
      memberCount: updatedOrganization._count.members,
      projectCount: updatedOrganization._count.projects
    }
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
