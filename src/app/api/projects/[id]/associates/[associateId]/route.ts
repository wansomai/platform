// app/api/projects/[id]/associates/[associateId]/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { checkProjectAccess } from "@/lib/auth/authorization";
import {
  createApiResponse,
  createNotFoundResponse,
  createForbiddenResponse,
} from "@/lib/api/response";

// DELETE /api/projects/[id]/associates/[associateId] - Remove associate from project
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; associateId: string }> }
) => {
  const { id: projectId, associateId } = await params;

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return createForbiddenResponse('Access denied');
  }

  // Only project admins may remove associates
  const projectMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  if (!projectMember || projectMember.role !== 'admin') {
    return createForbiddenResponse('Only project admins can remove associates');
  }

  const association = await prisma.projectAssociate.findUnique({
    where: { associateId_projectId: { associateId, projectId } },
  });

  if (!association) {
    return createNotFoundResponse('Associate assignment');
  }

  await prisma.projectAssociate.delete({
    where: { associateId_projectId: { associateId, projectId } },
  });

  return createApiResponse({ removed: true }, 'Associate removed from project');
}));
