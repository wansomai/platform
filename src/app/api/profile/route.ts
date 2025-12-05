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

  // Auto-fix: Set activeOrganizationId if it's null (for legacy users)
  if (!user.activeOrganizationId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganizationId: user.organizationId }
    });
  }

  // Auto-fix: Set ownerId for the user's primary organization if it's null (for legacy organizations)
  if (user.organization && !user.organization.ownerId) {
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { ownerId: user.id }
    });
  }

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

  // Ensure activeOrganization is always present in response (fallback to organization if null)
  const activeOrganizationData = user.activeOrganization || user.organization;

  return NextResponse.json({
    user: {
      ...user,
      role: effectiveRole,
      activeOrganization: activeOrganizationData
    }
  });
}));

// Update user profile
export const PUT = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const body = await request.json();
  const { name, organizationName } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'Name is required and must be a valid string' },
      { status: 400 }
    );
  }

  // Validate organization name if provided
  if (organizationName !== undefined && (typeof organizationName !== 'string' || organizationName.trim().length === 0)) {
    return NextResponse.json(
      { error: 'Organization name must be a valid string' },
      { status: 400 }
    );
  }

  // Update user's full name
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

  // Update organization name if provided and user is the owner
  if (organizationName !== undefined) {
    const activeOrgId = updatedUser.activeOrganizationId || updatedUser.organizationId;

    // Check if user is the owner of the active organization
    const isOwner = activeOrgId === updatedUser.organizationId;

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only organization owners can update the organization name' },
        { status: 403 }
      );
    }

    // Update the organization name
    await prisma.organization.update({
      where: { id: activeOrgId },
      data: {
        name: organizationName.trim()
      }
    });

    // Re-fetch user data with updated organization
    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
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

    if (refreshedUser) {
      // Get the active organization ID
      const activeOrgId = refreshedUser.activeOrganizationId || refreshedUser.organizationId;

      // Determine the user's role in the active organization
      let effectiveRole: string;

      // If the active organization is the user's primary organization, they are the owner
      if (activeOrgId === refreshedUser.organizationId) {
        effectiveRole = 'owner';
      } else {
        // Otherwise, get the role from UserOrganization for organizations they've been invited to
        const userOrganization = await prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: refreshedUser.id,
              organizationId: activeOrgId
            }
          },
          select: {
            role: true
          }
        });

        // Use the role from UserOrganization if it exists, otherwise fall back to User.role
        effectiveRole = userOrganization?.role || refreshedUser.role;
      }

      // Ensure activeOrganization is always present in response (fallback to organization if null)
      const activeOrganizationData = refreshedUser.activeOrganization || refreshedUser.organization;

      return NextResponse.json({
        success: true,
        data: {
          ...refreshedUser,
          role: effectiveRole,
          organization: activeOrganizationData,
          activeOrganization: activeOrganizationData
        }
      });
    }
  }

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

  // Ensure activeOrganization is always present in response (fallback to organization if null)
  const activeOrganizationData = updatedUser.activeOrganization || updatedUser.organization;

  return NextResponse.json({
    success: true,
    data: {
      ...updatedUser,
      role: effectiveRole,
      organization: activeOrganizationData,
      activeOrganization: activeOrganizationData
    }
  });
}));
