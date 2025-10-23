/**
 * Centralized Permission Definitions
 * Defines all organization and workspace permissions with role mappings
 */

import { OrganizationRole } from './roles';

// Organization-level permissions
export const OrganizationPermission = {
  // Member management
  INVITE_MEMBERS: 'invite_members',
  REMOVE_MEMBERS: 'remove_members',
  CHANGE_MEMBER_ROLES: 'change_member_roles',
  VIEW_MEMBERS: 'view_members',

  // Organization management
  UPDATE_SETTINGS: 'update_settings',
  DELETE_ORGANIZATION: 'delete_organization',
  TRANSFER_OWNERSHIP: 'transfer_ownership',

  // Billing & subscription
  VIEW_BILLING: 'view_billing',
  MANAGE_SUBSCRIPTION: 'manage_subscription',
  UPGRADE_ACCOUNT: 'upgrade_account',

  // Workspace management
  CREATE_WORKSPACE: 'create_workspace',
  DELETE_WORKSPACE: 'delete_workspace',
  MANAGE_WORKSPACE_ACCESS: 'manage_workspace_access',

  // Invitation management
  CANCEL_INVITATIONS: 'cancel_invitations',

  // Document management
  UPLOAD_DOCUMENTS: 'upload_documents',
  DELETE_DOCUMENTS: 'delete_documents',
} as const;

export type OrganizationPermissionType = typeof OrganizationPermission[keyof typeof OrganizationPermission];

// Workspace-level permissions
export const WorkspacePermission = {
  VIEW_WORKSPACE: 'view_workspace',
  EDIT_WORKSPACE: 'edit_workspace',
  DELETE_WORKSPACE: 'delete_workspace',
  MANAGE_MEMBERS: 'manage_members',
  CREATE_CONVERSATIONS: 'create_conversations',
  DELETE_CONVERSATIONS: 'delete_conversations',
  UPLOAD_DOCUMENTS: 'upload_documents',
  DELETE_DOCUMENTS: 'delete_documents',
} as const;

export type WorkspacePermissionType = typeof WorkspacePermission[keyof typeof WorkspacePermission];

/**
 * Role-to-Permission mapping for organization roles
 * Owner has all permissions, Admin has most, Member has limited
 */
export const OrganizationRolePermissions: Record<string, OrganizationPermissionType[]> = {
  [OrganizationRole.OWNER]: [
    // All permissions
    OrganizationPermission.INVITE_MEMBERS,
    OrganizationPermission.REMOVE_MEMBERS,
    OrganizationPermission.CHANGE_MEMBER_ROLES,
    OrganizationPermission.VIEW_MEMBERS,
    OrganizationPermission.UPDATE_SETTINGS,
    OrganizationPermission.DELETE_ORGANIZATION,
    OrganizationPermission.TRANSFER_OWNERSHIP,
    OrganizationPermission.VIEW_BILLING,
    OrganizationPermission.MANAGE_SUBSCRIPTION,
    OrganizationPermission.UPGRADE_ACCOUNT,
    OrganizationPermission.CREATE_WORKSPACE,
    OrganizationPermission.DELETE_WORKSPACE,
    OrganizationPermission.MANAGE_WORKSPACE_ACCESS,
    OrganizationPermission.CANCEL_INVITATIONS,
    OrganizationPermission.UPLOAD_DOCUMENTS,
    OrganizationPermission.DELETE_DOCUMENTS,
  ],

  [OrganizationRole.ADMIN]: [
    // Admin permissions (no billing, no delete org, no transfer ownership)
    OrganizationPermission.INVITE_MEMBERS,
    OrganizationPermission.REMOVE_MEMBERS,
    OrganizationPermission.CHANGE_MEMBER_ROLES,
    OrganizationPermission.VIEW_MEMBERS,
    OrganizationPermission.UPDATE_SETTINGS,
    OrganizationPermission.CREATE_WORKSPACE,
    OrganizationPermission.DELETE_WORKSPACE,
    OrganizationPermission.MANAGE_WORKSPACE_ACCESS,
    OrganizationPermission.CANCEL_INVITATIONS,
    OrganizationPermission.UPLOAD_DOCUMENTS,
    OrganizationPermission.DELETE_DOCUMENTS,
  ],

  [OrganizationRole.MEMBER]: [
    // Member permissions (limited)
    OrganizationPermission.CREATE_WORKSPACE,
    OrganizationPermission.UPLOAD_DOCUMENTS,
  ],
};

/**
 * Check if a role has a specific organization permission
 */
export function roleHasPermission(
  role: string,
  permission: OrganizationPermissionType
): boolean {
  const rolePermissions = OrganizationRolePermissions[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: string): OrganizationPermissionType[] {
  return OrganizationRolePermissions[role] || [];
}
