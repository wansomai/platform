// POST /api/associates/start-premade-session
// Finds or creates a premade associate for the user's org, creates a new project,
// and returns the projectId so the client can navigate directly to the chat.
//
// Only creates new records — never modifies existing data.
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createBadRequestResponse } from '@/lib/api/response';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { canCreateProject, canUseAssociates } from '@/lib/subscription';
import { premadeAssociates } from '@/lib/constants/premadeAssociates';

export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const body = await request.json();
    const { premadeId } = body as { premadeId: string };

    if (!premadeId) {
      return createBadRequestResponse('premadeId is required');
    }

    // Find the matching premade template
    const template = premadeAssociates.find(a => a.id === premadeId);
    if (!template) {
      return createBadRequestResponse(`Unknown premade associate: ${premadeId}`);
    }

    const orgId = await getActiveOrganizationId(userId);
    if (!orgId) {
      return createBadRequestResponse('User has no active organization');
    }

    // Subscription checks
    const [projectCheck, associateCheck] = await Promise.all([
      canCreateProject(orgId),
      canUseAssociates(orgId),
    ]);

    if (!projectCheck.allowed) {
      return new Response(
        JSON.stringify({ error: projectCheck.reason, requiresUpgrade: true }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!associateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: associateCheck.reason, requiresUpgrade: true }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-use an existing active associate with this name in the org,
      // or create one fresh from the premade template.
      let associate = await tx.aIAssociate.findFirst({
        where: { organizationId: orgId, name: template.name, isActive: true },
        select: { id: true },
      });

      if (!associate) {
        associate = await tx.aIAssociate.create({
          data: {
            name: template.name,
            description: template.description,
            instructions: template.instructions,
            practiceAreas: template.practiceAreas as any,
            knowledgeBase: [],
            organizationId: orgId,
            createdById: userId,
            tools: template.defaultTools.length > 0
              ? {
                  createMany: {
                    data: template.defaultTools.map((toolId: string) => ({ toolId })),
                    skipDuplicates: true,
                  },
                }
              : undefined,
          },
          select: { id: true },
        });
      }

      // Create the new project
      const project = await tx.project.create({
        data: {
          title: 'Case Preparation',
          description: 'AI-assisted case preparation session',
          status: 'active',
          visibility: 'restricted',
          organizationId: orgId,
          members: { create: { userId, role: 'admin' } },
        },
        select: { id: true },
      });

      // Assign the associate to the project
      await tx.projectAssociate.create({
        data: { projectId: project.id, associateId: associate.id },
      });

      // Create the conversation already bound to the associate
      await tx.conversation.create({
        data: {
          title: 'Case Preparation',
          projectId: project.id,
          aiAssociateId: associate.id,
          isPinned: false,
        },
      });

      return { projectId: project.id };
    });

    return createApiResponse(result, 'Session started');
  })
);
