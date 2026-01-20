import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { isOrganizationOwner } from "@/lib/auth/permissions";
import { OrganizationRole } from "@/lib/constants/roles";

/**
 * POST /api/organization/transfer-ownership
 * Transfer organization ownership to another member
 * Only the current owner can perform this action
 * The new owner must already be a member of the organization
 */
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { newOwnerId } = await request.json();

  if (!newOwnerId) {
    return NextResponse.json(
      { error: 'New owner ID is required' },
      { status: 400 }
    );
  }

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

  // Check if current user is the owner
  const isOwner = await isOrganizationOwner(userId, organizationId);

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Only the organization owner can transfer ownership' },
      { status: 403 }
    );
  }

  // Cannot transfer to yourself
  if (newOwnerId === userId) {
    return NextResponse.json(
      { error: 'You are already the owner' },
      { status: 400 }
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

  // Cannot transfer ownership of personal org
  if (organization.accountType === 'personal') {
    return NextResponse.json(
      { error: 'Cannot transfer ownership of personal organization' },
      { status: 400 }
    );
  }

  // Verify new owner exists and is a member
  const newOwnerMembership = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: newOwnerId,
        organizationId: organizationId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    }
  });

  if (!newOwnerMembership) {
    return NextResponse.json(
      { error: 'New owner must be an existing member of the organization' },
      { status: 400 }
    );
  }

  // Use a transaction to transfer ownership atomically
  const result = await prisma.$transaction(async (tx) => {
    // Update organization owner
    const updatedOrganization = await tx.organization.update({
      where: { id: organizationId },
      data: {
        ownerId: newOwnerId
      },
      select: {
        id: true,
        name: true,
        accountType: true,
        ownerId: true
      }
    });

    // Update new owner's role to OWNER in UserOrganization
    await tx.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: newOwnerId,
          organizationId: organizationId
        }
      },
      data: {
        role: OrganizationRole.OWNER
      }
    });

    // Downgrade previous owner to ADMIN
    await tx.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId
        }
      },
      data: {
        role: OrganizationRole.ADMIN
      }
    });

    return {
      organization: updatedOrganization,
      newOwner: newOwnerMembership.user,
      previousOwnerId: userId
    };
  });

  return NextResponse.json({
    success: true,
    message: `Ownership of ${organization.name} successfully transferred to ${result.newOwner.fullName || result.newOwner.email}`,
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      accountType: result.organization.accountType,
      ownerId: result.organization.ownerId
    },
    newOwner: {
      id: result.newOwner.id,
      email: result.newOwner.email,
      fullName: result.newOwner.fullName
    },
    previousOwnerRole: OrganizationRole.ADMIN
  });
}));
