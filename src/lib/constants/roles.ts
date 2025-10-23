/**
 * Centralized Role and Account Type Constants
 * Following SaaS industry best practices (Slack, GitHub, Notion)
 */

// Organization role hierarchy
export const OrganizationRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type OrganizationRoleType = typeof OrganizationRole[keyof typeof OrganizationRole];

// Role hierarchy levels for comparison (higher number = more permissions)
export const RoleHierarchy: Record<OrganizationRoleType, number> = {
  [OrganizationRole.OWNER]: 3,
  [OrganizationRole.ADMIN]: 2,
  [OrganizationRole.MEMBER]: 1,
};

// Workspace/Project role types
export const WorkspaceRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type WorkspaceRoleType = typeof WorkspaceRole[keyof typeof WorkspaceRole];

// Account types
export const AccountType = {
  PERSONAL: 'personal',
  ENTERPRISE: 'enterprise',
} as const;

export type AccountTypeType = typeof AccountType[keyof typeof AccountType];

// Workspace visibility options
export const WorkspaceVisibility = {
  ORGANIZATION: 'organization', // All org members can access
  RESTRICTED: 'restricted',     // Only specific members can access
} as const;

export type WorkspaceVisibilityType = typeof WorkspaceVisibility[keyof typeof WorkspaceVisibility];

/**
 * Helper to check if a role has higher or equal hierarchy level
 */
export function hasHigherOrEqualRole(
  actorRole: OrganizationRoleType,
  targetRole: OrganizationRoleType
): boolean {
  return RoleHierarchy[actorRole] >= RoleHierarchy[targetRole];
}

/**
 * Helper to check if a role has strictly higher hierarchy level
 */
export function hasHigherRole(
  actorRole: OrganizationRoleType,
  targetRole: OrganizationRoleType
): boolean {
  return RoleHierarchy[actorRole] > RoleHierarchy[targetRole];
}

/**
 * Validate if a string is a valid organization role
 */
export function isValidOrganizationRole(role: string): role is OrganizationRoleType {
  return Object.values(OrganizationRole).includes(role as OrganizationRoleType);
}

/**
 * Validate if a string is a valid workspace role
 */
export function isValidWorkspaceRole(role: string): role is WorkspaceRoleType {
  return Object.values(WorkspaceRole).includes(role as WorkspaceRoleType);
}

/**
 * Validate if a string is a valid account type
 */
export function isValidAccountType(type: string): type is AccountTypeType {
  return Object.values(AccountType).includes(type as AccountTypeType);
}

/**
 * Validate if a string is a valid workspace visibility setting
 */
export function isValidWorkspaceVisibility(visibility: string): visibility is WorkspaceVisibilityType {
  return Object.values(WorkspaceVisibility).includes(visibility as WorkspaceVisibilityType);
}
