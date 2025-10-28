/**
 * Authorization and Permission Utilities
 * Provides reusable functions for checking user permissions and managing access control
 */

import { PrismaClient } from '@/prisma/client';
import { OrganizationRole, RoleHierarchy, AccountType } from '@/lib/constants/roles';
import { OrganizationPermission, roleHasPermission, type OrganizationPermissionType } from '@/lib/constants/permissions';

const prisma = new PrismaClient();
/**
 * Check if a user has a specific permission in an organization
 * @param userId - User ID to check
 * @param organizationId - Organization ID to check in
 * @param permission - Permission to check for
 * @returns Promise<boolean> - True if user has permission
 */
export async function hasOrganizationPermission(
  userId: string,
  organizationId: string,
  permission: OrganizationPermissionType
): Promise<boolean> {
  // First, check if the user is the owner of the organization (primary org)
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  // If user is the owner of their primary organization, they have all permissions
  if (organization?.ownerId === userId) {
    return roleHasPermission(OrganizationRole.OWNER, permission);
  }

  // Otherwise, check UserOrganization table (for invited organizations)
  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { role: true },
  });

  if (!userOrg) return false;

  return roleHasPermission(userOrg.role, permission);
}

/**
 * Check if user can perform action on target user based on role hierarchy
 * Owners > Admins > Members
 * @param actorUserId - User performing the action
 * @param targetUserId - User being acted upon
 * @param organizationId - Organization context
 * @returns Promise with result and optional reason
 */
export async function canManageUser(
  actorUserId: string,
  targetUserId: string,
  organizationId: string
): Promise<{ canManage: boolean; reason?: string }> {
  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true, accountType: true },
  });

  if (!organization) {
    return { canManage: false, reason: 'Organization not found' };
  }

  // Cannot manage yourself
  if (actorUserId === targetUserId) {
    return { canManage: false, reason: 'Cannot manage your own role or membership' };
  }

  // Cannot manage organization owner
  if (organization.ownerId === targetUserId) {
    return { canManage: false, reason: 'Cannot manage organization owner' };
  }

  // Get both user roles using the helper function that handles primary org ownership
  const [actorRoleStr, targetRoleStr] = await Promise.all([
    getUserOrganizationRole(actorUserId, organizationId),
    getUserOrganizationRole(targetUserId, organizationId),
  ]);

  if (!actorRoleStr || !targetRoleStr) {
    return { canManage: false, reason: 'User not found in organization' };
  }

  const actorRole = { role: actorRoleStr };
  const targetRole = { role: targetRoleStr };

  // Check role hierarchy - actor must have higher role than target
  const actorLevel = RoleHierarchy[actorRole.role as keyof typeof RoleHierarchy] || 0;
  const targetLevel = RoleHierarchy[targetRole.role as keyof typeof RoleHierarchy] || 0;

  if (actorLevel <= targetLevel) {
    return {
      canManage: false,
      reason: 'Insufficient permissions. You can only manage users with lower roles than yours.'
    };
  }

  return { canManage: true };
}

/**
 * Check if organization can invite members (enterprise account check)
 * @param organizationId - Organization to check
 * @returns Promise with result and optional reason
 */
export async function canInviteMembers(
  organizationId: string
): Promise<{ canInvite: boolean; reason?: string }> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { accountType: true },
  });

  if (!organization) {
    return { canInvite: false, reason: 'Organization not found' };
  }

  if (organization.accountType === AccountType.PERSONAL) {
    return {
      canInvite: false,
      reason: 'Personal accounts cannot invite members. Please upgrade to Enterprise to enable team collaboration.',
    };
  }

  return { canInvite: true };
}

/**
 * Get user's role in an organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Promise<string | null> - Role or null if not a member
 */
export async function getUserOrganizationRole(
  userId: string,
  organizationId: string
): Promise<string | null> {
  // First, check if the user is the owner of the organization (primary org)
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  // If user is the owner of their primary organization
  if (organization?.ownerId === userId) {
    return OrganizationRole.OWNER;
  }

  // Otherwise, check UserOrganization table (for invited organizations)
  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { role: true },
  });

  return userOrg?.role || null;
}

/**
 * Check if user is organization owner
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Promise<boolean> - True if user is owner
 */
export async function isOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  return organization?.ownerId === userId;
}

/**
 * Check if user can change a role to a specific target role
 * Rules:
 * - Only owners can assign owner role (via transfer ownership)
 * - Admins can assign member or admin roles
 * - Cannot elevate target above your own role
 * @param actorUserId - User performing role change
 * @param targetRole - New role being assigned
 * @param organizationId - Organization context
 * @returns Promise with result and optional reason
 */
export async function canAssignRole(
  actorUserId: string,
  targetRole: string,
  organizationId: string
): Promise<{ canAssign: boolean; reason?: string }> {
  // Validate that targetRole is a valid organization role
  const validRoles = Object.values(OrganizationRole);
  if (!validRoles.includes(targetRole as any)) {
    return {
      canAssign: false,
      reason: `Invalid role: ${targetRole}. Must be one of: ${validRoles.join(', ')}`,
    };
  }

  // Prevent assigning owner role (must use transfer ownership instead)
  if (targetRole === OrganizationRole.OWNER) {
    return {
      canAssign: false,
      reason: 'Cannot assign owner role directly. Use transfer ownership instead.',
    };
  }

  // Get actor's role using the helper function that handles primary org ownership
  const actorRoleStr = await getUserOrganizationRole(actorUserId, organizationId);

  if (!actorRoleStr) {
    return { canAssign: false, reason: 'You are not a member of this organization' };
  }

  // Check if actor has permission to change roles
  const hasPermission = roleHasPermission(
    actorRoleStr,
    OrganizationPermission.CHANGE_MEMBER_ROLES
  );

  if (!hasPermission) {
    return { canAssign: false, reason: 'You do not have permission to change member roles' };
  }

  // Ensure actor cannot assign roles equal to or higher than their own
  const actorLevel = RoleHierarchy[actorRoleStr as keyof typeof RoleHierarchy] || 0;
  const targetLevel = RoleHierarchy[targetRole as keyof typeof RoleHierarchy];

  if (targetLevel >= actorLevel) {
    return {
      canAssign: false,
      reason: 'You cannot assign a role equal to or higher than your own',
    };
  }

  return { canAssign: true };
}

/**
 * Check if user can remove a member from their personal organization
 * Personal org owners cannot be removed from their own organization
 * @param userId - User to be removed
 * @param organizationId - Organization ID
 * @returns Promise<boolean> - True if removal is allowed
 */
export async function canRemoveFromPersonalOrg(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true, accountType: true },
  });

  if (!organization) return false;

  // If it's a personal organization and the user is the owner, they cannot be removed
  if (
    organization.accountType === AccountType.PERSONAL &&
    organization.ownerId === userId
  ) {
    return false;
  }

  return true;
}

/**
 * Get organization with account type and owner info
 * @param organizationId - Organization ID
 * @returns Promise with organization details or null
 */
export async function getOrganizationDetails(organizationId: string) {
  return await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      accountType: true,
      ownerId: true,
      owner: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
      subscription: {
        select: {
          planName: true,
          status: true,
        },
      },
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });
}

/**
 * Check if user has any admin-level permissions in organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Promise<boolean> - True if user is admin or owner
 */
export async function isAdminOrOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const userRole = await getUserOrganizationRole(userId, organizationId);

  if (!userRole) return false;

  return userRole === OrganizationRole.ADMIN || userRole === OrganizationRole.OWNER;
}

/**
 * Validate if a role change is safe and allowed
 * @param userId - User whose role is being changed
 * @param currentRole - Current role
 * @param newRole - Proposed new role
 * @param organizationId - Organization context
 * @returns Object with validation result
 */
export async function validateRoleChange(
  userId: string,
  currentRole: string,
  newRole: string,
  organizationId: string
): Promise<{ isValid: boolean; reason?: string }> {
  // Cannot change owner role
  const isOwner = await isOrganizationOwner(userId, organizationId);
  if (isOwner) {
    return {
      isValid: false,
      reason: 'Cannot change owner role. Transfer ownership first if needed.',
    };
  }

  // Role must be different
  if (currentRole === newRole) {
    return {
      isValid: false,
      reason: 'New role must be different from current role',
    };
  }

  // Validate new role is valid
  if (!Object.values(OrganizationRole).includes(newRole as any)) {
    return {
      isValid: false,
      reason: 'Invalid role specified',
    };
  }

  return { isValid: true };
}
