// src/lib/api/org-helpers.ts
import { AppError } from '@/types/error';
import prisma from '@/lib/prisma';

/**
 * Get user's organization ID
 * Throws AppError if user or organization not found
 *
 * @param userId - The user ID to lookup
 * @returns The organization ID
 * @throws {AppError} If user or organization not found
 *
 * @example
 * const orgId = await getUserOrganizationId(userId);
 */
export async function getUserOrganizationId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!user?.organizationId) {
    throw new AppError('User organization not found', 'ORG_NOT_FOUND', 404);
  }

  return user.organizationId;
}

/**
 * Get user with organization details
 *
 * @param userId - The user ID to lookup
 * @returns User with organization or null
 */
export async function getUserWithOrganization(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          accountType: true,
          ownerId: true
        }
      }
    }
  });

  if (!user?.organizationId) {
    throw new AppError('User organization not found', 'ORG_NOT_FOUND', 404);
  }

  return user;
}

/**
 * Get active organization ID (supports multi-org switching)
 *
 * @param userId - The user ID to lookup
 * @returns The active organization ID
 */
export async function getActiveOrganizationId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeOrganizationId: true,
      organizationId: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Return active org if set, otherwise fall back to primary org
  const orgId = user.activeOrganizationId || user.organizationId;

  if (!orgId) {
    throw new AppError('User organization not found', 'ORG_NOT_FOUND', 404);
  }

  return orgId;
}
