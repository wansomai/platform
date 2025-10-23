/**
 * Workspace-Level Permission Utilities
 * Manages access control for workspaces (projects) based on visibility settings
 */

import { PrismaClient } from "@/prisma/client";
import { WorkspaceVisibility } from '@/lib/constants/roles';
import { isAdminOrOwner } from './permissions';

const prisma = new PrismaClient();
/**
 * Check if user can access a workspace based on visibility settings
 * @param userId - User ID to check
 * @param projectId - Workspace/Project ID
 * @returns Promise<boolean> - True if user can access
 * 
 */
export async function canAccessWorkspace(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      visibility: true
    }
  });

  if (!project) return false;

  // Check if user is in the organization
  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId
      }
    }
  });

  if (!userOrg) return false;

  // If workspace is organization-wide, all org members can access
  if (project.visibility === WorkspaceVisibility.ORGANIZATION) {
    return true;
  }

  // If workspace is restricted, check if user is a workspace member
  if (project.visibility === WorkspaceVisibility.RESTRICTED) {
    const workspaceMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    return !!workspaceMember;
  }

  return false;
}

/**
 * Check if user can manage workspace members
 * Organization admins/owners or workspace admins can manage members
 * @param userId - User performing the action
 * @param projectId - Workspace/Project ID
 * @returns Promise with result and optional reason
 */
export async function canManageWorkspaceMembers(
  userId: string,
  projectId: string
): Promise<{ canManage: boolean; reason?: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      visibility: true
    }
  });

  if (!project) {
    return { canManage: false, reason: 'Workspace not found' };
  }

  // Check if user is organization admin or owner
  const isOrgAdmin = await isAdminOrOwner(userId, project.organizationId);
  if (isOrgAdmin) {
    return { canManage: true };
  }

  // Check if user is workspace admin
  const workspaceMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    },
    select: { role: true }
  });

  if (workspaceMember?.role === 'admin') {
    return { canManage: true };
  }

  return {
    canManage: false,
    reason: 'Only organization admins/owners or workspace admins can manage members'
  };
}

/**
 * Check if user can change workspace visibility
 * Only organization admins/owners can change visibility
 * @param userId - User performing the action
 * @param projectId - Workspace/Project ID
 * @returns Promise<boolean>
 */
export async function canChangeWorkspaceVisibility(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (!project) return false;

  return await isAdminOrOwner(userId, project.organizationId);
}

/**
 * Get all workspaces accessible to a user
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns Promise with list of accessible workspaces
 */
export async function getAccessibleWorkspaces(
  userId: string,
  organizationId: string
) {
  // Check if user is in organization
  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId
      }
    }
  });

  if (!userOrg) {
    return [];
  }

  // Get all organization workspaces
  const orgWorkspaces = await prisma.project.findMany({
    where: {
      organizationId,
      visibility: WorkspaceVisibility.ORGANIZATION
    },
    include: {
      _count: {
        select: {
          members: true,
          conversations: true,
          documents: true
        }
      }
    }
  });

  // Get restricted workspaces where user is a member
  const restrictedWorkspaces = await prisma.project.findMany({
    where: {
      organizationId,
      visibility: WorkspaceVisibility.RESTRICTED,
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      _count: {
        select: {
          members: true,
          conversations: true,
          documents: true
        }
      }
    }
  });

  return [...orgWorkspaces, ...restrictedWorkspaces];
}

/**
 * Get workspace members with their roles
 * @param projectId - Workspace/Project ID
 * @returns Promise with list of workspace members
 */
export async function getWorkspaceMembers(projectId: string) {
  return await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

/**
 * Add member to workspace
 * @param userId - User to add
 * @param projectId - Workspace/Project ID
 * @param role - Role to assign (admin or member)
 * @returns Promise with result
 */
export async function addWorkspaceMember(
  userId: string,
  projectId: string,
  role: string = 'member'
): Promise<{ success: boolean; reason?: string }> {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!user) {
    return { success: false, reason: 'User not found' };
  }

  // Check if project exists and get organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (!project) {
    return { success: false, reason: 'Workspace not found' };
  }

  // Check if user is in the same organization
  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId
      }
    }
  });

  if (!userOrg) {
    return {
      success: false,
      reason: 'User is not a member of the workspace organization'
    };
  }

  // Check if already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (existingMember) {
    return { success: false, reason: 'User is already a workspace member' };
  }

  // Add member
  await prisma.projectMember.create({
    data: {
      userId,
      projectId,
      role
    }
  });

  return { success: true };
}

/**
 * Remove member from workspace
 * @param userId - User to remove
 * @param projectId - Workspace/Project ID
 * @returns Promise with result
 */
export async function removeWorkspaceMember(
  userId: string,
  projectId: string
): Promise<{ success: boolean; reason?: string }> {
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!member) {
    return { success: false, reason: 'User is not a workspace member' };
  }

  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  return { success: true };
}

/**
 * Update workspace member role
 * @param userId - User whose role to update
 * @param projectId - Workspace/Project ID
 * @param newRole - New role (admin or member)
 * @returns Promise with result
 */
export async function updateWorkspaceMemberRole(
  userId: string,
  projectId: string,
  newRole: string
): Promise<{ success: boolean; reason?: string }> {
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!member) {
    return { success: false, reason: 'User is not a workspace member' };
  }

  if (member.role === newRole) {
    return { success: false, reason: 'User already has this role' };
  }

  await prisma.projectMember.update({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    },
    data: { role: newRole }
  });

  return { success: true };
}
