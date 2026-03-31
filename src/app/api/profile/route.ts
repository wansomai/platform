import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { getEffectiveRole, getActiveOrgId } from "@/lib/auth/auth-utils";

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
      emailVerified: true,
      authProvider: true,
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

  // Get the active organization ID
  const activeOrgId = getActiveOrgId(user.activeOrganizationId, user.organizationId);

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

  // Determine the user's effective role in the active organization
  const effectiveRole = await getEffectiveRole(
    user.id,
    user.organizationId,
    user.activeOrganizationId,
    user.role
  );

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
      // Determine the user's effective role in the active organization
      const effectiveRole = await getEffectiveRole(
        refreshedUser.id,
        refreshedUser.organizationId,
        refreshedUser.activeOrganizationId,
        refreshedUser.role
      );

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

  // Determine the user's effective role in the active organization
  const effectiveRole = await getEffectiveRole(
    updatedUser.id,
    updatedUser.organizationId,
    updatedUser.activeOrganizationId,
    updatedUser.role
  );

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
