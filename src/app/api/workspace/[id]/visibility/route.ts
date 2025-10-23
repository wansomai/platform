import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { canChangeWorkspaceVisibility } from "@/lib/auth/workspace-permissions";
import { WorkspaceVisibility, isValidWorkspaceVisibility } from "@/lib/constants/roles";

const prisma = new PrismaClient();

/**
 * GET /api/workspace/[id]/visibility
 * Get workspace visibility settings
 */
export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        visibility: true,
        organizationId: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this workspace
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId
        }
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // Check if user can change visibility
    const canChange = await canChangeWorkspaceVisibility(userId, projectId);

    return NextResponse.json({
      workspace: {
        id: project.id,
        title: project.title,
        visibility: project.visibility,
        memberCount: project._count.members
      },
      canChangeVisibility: canChange,
      visibilityOptions: [
        {
          value: WorkspaceVisibility.ORGANIZATION,
          label: 'Organization',
          description: 'All organization members can access this workspace'
        },
        {
          value: WorkspaceVisibility.RESTRICTED,
          label: 'Restricted',
          description: 'Only specific members can access this workspace'
        }
      ]
    });
  })
);

/**
 * PATCH /api/workspace/[id]/visibility
 * Update workspace visibility
 */
export const PATCH = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string, { params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;
    const { visibility } = await request.json();

    if (!visibility) {
      return NextResponse.json(
        { error: 'Visibility is required' },
        { status: 400 }
      );
    }

    // Validate visibility value
    if (!isValidWorkspaceVisibility(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be organization or restricted' },
        { status: 400 }
      );
    }

    // Check if user can change visibility
    const canChange = await canChangeWorkspaceVisibility(userId, projectId);

    if (!canChange) {
      return NextResponse.json(
        { error: 'Only organization admins/owners can change workspace visibility' },
        { status: 403 }
      );
    }

    // Update visibility
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { visibility },
      select: {
        id: true,
        title: true,
        visibility: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Workspace visibility updated to ${visibility}`,
      workspace: {
        id: updatedProject.id,
        title: updatedProject.title,
        visibility: updatedProject.visibility,
        memberCount: updatedProject._count.members
      }
    });
  })
);
