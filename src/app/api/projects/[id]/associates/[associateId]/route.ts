// app/api/projects/[id]/associates/[associateId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { checkProjectAccess } from "@/lib/auth/authorization";

// DELETE /api/projects/[id]/associates/[associateId] - Remove associate from project
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; associateId: string }> }
) => {
  try {
    const { id: projectId, associateId } = await params;

    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if association exists
    const association = await prisma.projectAssociate.findUnique({
      where: {
        associateId_projectId: { associateId, projectId }
      }
    });

    if (!association) {
      return NextResponse.json(
        { error: 'Associate not assigned to this project' },
        { status: 404 }
      );
    }

    await prisma.projectAssociate.delete({
      where: {
        associateId_projectId: { associateId, projectId }
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Associate removed from project'
    });
  } catch (error: any) {
    console.error('Error removing associate from project:', error);
    return NextResponse.json(
      { error: 'Failed to remove associate' },
      { status: 500 }
    );
  }
}));
