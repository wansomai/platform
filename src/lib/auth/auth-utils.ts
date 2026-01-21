// src/lib/auth/auth-utils.ts
// Shared authentication utilities to reduce code repetition across API routes

import prisma from '@/lib/prisma';

/**
 * User type for token generation
 */
export interface UserForToken {
  id: string;
  email: string;
  fullName: string;
  name: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
}

/**
 * User data type for API responses (excludes sensitive data)
 */
export interface UserResponseData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

/**
 * Prepare user object for token generation
 * Standardizes the user data structure for JWT tokens
 */
export function prepareUserForToken(user: {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
}): UserForToken {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || '',
    name: user.fullName || '',
    role: user.role,
    organizationId: user.organizationId,
    organization: {
      id: user.organization.id,
      name: user.organization.name,
    },
  };
}

/**
 * Prepare user data for API response (excludes sensitive data)
 */
export function prepareUserResponse(user: {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}): UserResponseData {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || '',
    role: user.role,
    organization: {
      id: user.organization.id,
      name: user.organization.name,
    },
  };
}

/**
 * Generate Set-Cookie header for auth tokens
 * Uses secure defaults: HttpOnly, SameSite=Strict, Secure in production
 */
export function generateAuthCookieHeader(
  accessToken: string,
  refreshToken: string
): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';

  // Access token: 1 hour expiry
  const accessCookie = `auth-token=${accessToken}; Path=/; HttpOnly; Max-Age=3600; SameSite=Strict${secureFlag}`;

  // Refresh token: 7 days expiry
  const refreshCookie = `refresh-token=${refreshToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Strict${secureFlag}`;

  return `${accessCookie}, ${refreshCookie}`;
}

/**
 * Determine the user's effective role in an organization
 * Handles the multi-organization role resolution logic
 *
 * @param userId - The user's ID
 * @param primaryOrganizationId - The user's primary (owned) organization ID
 * @param activeOrganizationId - The currently active organization ID (may differ from primary)
 * @param fallbackRole - The user's default role (from User model)
 * @returns The effective role for the user in the active organization
 */
export async function getEffectiveRole(
  userId: string,
  primaryOrganizationId: string,
  activeOrganizationId: string | null,
  fallbackRole: string
): Promise<string> {
  const activeOrgId = activeOrganizationId || primaryOrganizationId;

  // If the active organization is the user's primary organization, they are the owner
  if (activeOrgId === primaryOrganizationId) {
    return 'owner';
  }

  // Otherwise, get the role from UserOrganization for organizations they've been invited to
  const userOrganization = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: activeOrgId,
      },
    },
    select: {
      role: true,
    },
  });

  // Use the role from UserOrganization if it exists, otherwise fall back to User.role
  return userOrganization?.role || fallbackRole;
}

/**
 * Get the user's active organization ID
 * Falls back to primary organization if no active organization is set
 */
export function getActiveOrgId(
  activeOrganizationId: string | null,
  primaryOrganizationId: string
): string {
  return activeOrganizationId || primaryOrganizationId;
}
