import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

const prisma = new PrismaClient();

// Get user profile
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationId: true,
      activeOrganizationId: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          accountType: true,
          ownerId: true,
          upgradeRequestedAt: true
        }
      },
      activeOrganization: {
        select: {
          id: true,
          name: true,
          accountType: true,
          ownerId: true,
          upgradeRequestedAt: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get the active organization ID (use activeOrganizationId if set, otherwise fall back to organizationId)
  const activeOrgId = user.activeOrganizationId || user.organizationId;

  // Determine the user's role in the active organization
  let effectiveRole: string;

  // If the active organization is the user's primary organization, they are the owner
  if (activeOrgId === user.organizationId) {
    effectiveRole = 'owner';
  } else {
    // Otherwise, get the role from UserOrganization for organizations they've been invited to
    const userOrganization = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: activeOrgId
        }
      },
      select: {
        role: true
      }
    });

    // Use the role from UserOrganization if it exists, otherwise fall back to User.role
    effectiveRole = userOrganization?.role || user.role;
  }

  return NextResponse.json({
    user: {
      ...user,
      role: effectiveRole
    }
  });
}));

// Update user profile
export const PUT = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Name is required and must be a valid string' },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: name.trim()
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationId: true,
      activeOrganizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          accountType: true,
          ownerId: true,
          upgradeRequestedAt: true
        }
      },
      activeOrganization: {
        select: {
          id: true,
          name: true,
          accountType: true,
          ownerId: true,
          upgradeRequestedAt: true
        }
      }
    }
  });

  // Get the active organization ID
  const activeOrgId = updatedUser.activeOrganizationId || updatedUser.organizationId;

  // Determine the user's role in the active organization
  let effectiveRole: string;

  // If the active organization is the user's primary organization, they are the owner
  if (activeOrgId === updatedUser.organizationId) {
    effectiveRole = 'owner';
  } else {
    // Otherwise, get the role from UserOrganization for organizations they've been invited to
    const userOrganization = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: updatedUser.id,
          organizationId: activeOrgId
        }
      },
      select: {
        role: true
      }
    });

    // Use the role from UserOrganization if it exists, otherwise fall back to User.role
    effectiveRole = userOrganization?.role || updatedUser.role;
  }

  return NextResponse.json({
    success: true,
    user: {
      ...updatedUser,
      role: effectiveRole
    }
  });
}));
