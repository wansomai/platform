// app/api/projects/[id]/associates/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createCreatedResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createForbiddenResponse,
} from '@/lib/api/response';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { canUseAssociates } from '@/lib/subscription';
import { z } from 'zod';

const assignAssociateSchema = z.object({
  associateId: z.string(),
});

// GET /api/projects/[id]/associates - Get all associates for project
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          include: {
            steps: { orderBy: { stepOrder: 'asc' } },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const associates = projectAssociates
      .map((pa) => pa.associate)
      .filter((a) => a !== null);

    return createApiResponse({ associates });
  })
);

// POST /api/projects/[id]/associates - Assign associate to project
export const POST = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId, userId } = context;

    const body = await request.json();
    const { associateId } = assignAssociateSchema.parse(body);

    // Only project admins may assign associates
    const projectMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true },
    });
    if (!projectMember || projectMember.role !== 'admin') {
      return createForbiddenResponse('Only project admins can assign associates');
    }

    // Get user's active organization
    const currentOrgId = await getActiveOrganizationId(userId);

    if (!currentOrgId) {
      return createForbiddenResponse('User not in organization');
    }

    // Verify associate exists and user has access to it
    const associate = await prisma.aIAssociate.findFirst({
      where: {
        id: associateId,
        organizationId: currentOrgId,
      },
    });

    if (!associate) {
      return createNotFoundResponse('Associate');
    }

    // Check if user has premium access before allowing assignment
    const associateCheck = await canUseAssociates(currentOrgId);
    if (!associateCheck.allowed) {
      return createForbiddenResponse(associateCheck.reason);
    }

    // Check if already assigned
    const existing = await prisma.projectAssociate.findUnique({
      where: {
        associateId_projectId: { associateId, projectId },
      },
    });

    if (existing) {
      return createBadRequestResponse('Associate already assigned to project');
    }

    await prisma.projectAssociate.create({
      data: { associateId, projectId },
    });

    return createCreatedResponse(
      { associateId, projectId },
      'Associate assigned to project'
    );
  })
);
