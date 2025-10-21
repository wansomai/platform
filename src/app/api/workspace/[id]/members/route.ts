import { NextRequest, NextResponse } from "next/server";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import {
  canAccessWorkspace,
  canManageWorkspaceMembers,
  getWorkspaceMembers,
  addWorkspaceMember,
  removeWorkspaceMember
} from "@/lib/auth/workspace-permissions";

/**
 * GET /api/workspace/[id]/members
 * Get all members of a workspace
 */
export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;

    // Check if user can access this workspace
    const hasAccess = await canAccessWorkspace(userId, projectId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // Get workspace members
    const members = await getWorkspaceMembers(projectId);

    const formattedMembers = members.map(member => ({
      id: member.user.id,
      email: member.user.email,
      name: member.user.fullName || member.user.email,
      role: member.role,
      joinedAt: member.createdAt.toISOString()
    }));

    return NextResponse.json({
      members: formattedMembers,
      count: formattedMembers.length
    });
  })
);

/**
 * POST /api/workspace/[id]/members
 * Add a member to a workspace
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;
    const { memberId, role = 'member' } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'member') {
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

    // Add member to workspace
    const result = await addWorkspaceMember(memberId, projectId, role);

    if (!result.success) {
      return NextResponse.json(
        { error: result.reason || 'Failed to add workspace member' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member added to workspace successfully'
    });
  })
);

/**
 * DELETE /api/workspace/[id]/members
 * Remove a member from a workspace
 */
export const DELETE = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
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

    // Cannot remove yourself
    if (memberId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the workspace' },
        { status: 400 }
      );
    }

    // Remove member from workspace
    const result = await removeWorkspaceMember(memberId, projectId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.reason || 'Failed to remove workspace member' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed from workspace successfully'
    });
  })
);
