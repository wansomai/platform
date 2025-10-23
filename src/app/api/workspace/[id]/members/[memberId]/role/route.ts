import { NextRequest, NextResponse } from "next/server";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import {
  canManageWorkspaceMembers,
  updateWorkspaceMemberRole
} from "@/lib/auth/workspace-permissions";
import { isValidWorkspaceRole } from "@/lib/constants/roles";

/**
 * PATCH /api/workspace/[id]/members/[memberId]/role
 * Update a workspace member's role
 */
export const PATCH = withErrorHandler(
  withAuth(
    async (
      request: NextRequest,
      userId: string,
      { params }: { params: Promise<{ id: string; memberId: string }> }
    ) => {
      const { id: projectId, memberId } = await params;
      const { role } = await request.json();

      if (!role) {
        return NextResponse.json(
          { error: 'Role is required' },
          { status: 400 }
        );
      }

      // Validate role
      if (!isValidWorkspaceRole(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin or member' },
          { status: 400 }
        );
      }

      // Check if user can manage workspace members
      const { canManage, reason } = await canManageWorkspaceMembers(userId, projectId);

      if (!canManage) {
        return NextResponse.json(
          { error: reason || 'Insufficient permissions to manage workspace members' },
          { status: 403 }
        );
      }

      // Cannot change your own role
      if (memberId === userId) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400 }
        );
      }

      // Update member role
      const result = await updateWorkspaceMemberRole(memberId, projectId, role);

      if (!result.success) {
        return NextResponse.json(
          { error: result.reason || 'Failed to update member role' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Member role updated to ${role}`,
        data: {
          memberId,
          projectId,
          role
        }
      });
    }
  )
);
