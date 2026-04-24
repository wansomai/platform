// app/api/associates/[id]/route.ts
// Allow up to 120 s — GET and PUT both call processKBDocuments which makes
// multiple Gemini API calls (summary + rules per document).
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { processKBDocuments } from "@/services/kbSummaryService";
import { loadKBDocumentsWithSummaries } from "@/services/kbSummaryService";
import { syncAssociateKBDocumentPermissions } from "@/lib/auth/associateSharing";
import { z } from "zod";

const updateAssociateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  instructions: z.string().min(10).optional(),
  description: z.string().max(2000).optional(),
  practiceAreas: z.array(z.string()).min(1).optional(),
  knowledgeBase: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  tools: z.array(z.string()).optional(),
  steps: z.array(z.object({
    id: z.string().optional(),
    description: z.string(),
    stepOrder: z.number()
  })).optional()
});

async function checkAssociateAccess(associateId: string, userId: string) {
  // Associates are user-level — the creator (and any user the associate has
  // been explicitly shared with) can always access it, regardless of which
  // organization the user is currently switched into. The associate's own
  // organizationId is the authoritative org for KB / permission operations.
  const associate = await prisma.aIAssociate.findFirst({
    where: {
      id: associateId,
      OR: [
        { createdById: userId },
        { sharedWith: { some: { userId } } }
      ]
    }
  });

  if (!associate) {
    return { authorized: false, associate: null, organizationId: null, isOwner: false };
  }

  return {
    authorized: true,
    associate,
    organizationId: associate.organizationId,
    isOwner: associate.createdById === userId,
  };
}

// GET /api/associates/[id] - Get associate details
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const { authorized, associate } = await checkAssociateAccess(id, userId);

    if (!authorized || !associate) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    const fullAssociate = await prisma.aIAssociate.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        tools: true,
        projects: {
          include: {
            project: { select: { id: true, title: true } }
          }
        },
        createdBy: { select: { fullName: true, email: true } }
      }
    });

    const kbIds = fullAssociate?.knowledgeBase ?? [];

    // Ensure KB status is up-to-date when opening edit screen:
    // - backfills missing summaries
    // - validates extracted text availability
    const kbResult = kbIds.length > 0
      ? await processKBDocuments(kbIds)
      : null;

    const kbStatusById = new Map(
      (kbResult?.processed ?? []).map((doc) => [doc.documentId, doc])
    );

    const knowledgeBaseDocuments = kbIds.length
      ? await loadKBDocumentsWithSummaries(kbIds)
      : [];

    return NextResponse.json({
      status: 200,
      data: {
        associate: {
          ...fullAssociate,
          knowledgeBaseDocuments: knowledgeBaseDocuments.map((doc) => {
            const status = kbStatusById.get(doc.id);
            return {
              id: doc.id,
              title: doc.title,
              fileType: doc.fileType,
              contentLength: doc.contentLength,
              summaryGenerated: status?.summaryGenerated ?? !!doc.summary,
              rulesGenerated: status?.rulesGenerated ?? !!doc.groundedRules,
              textExtracted: status?.textExtracted ?? !!doc.content,
              summaryPreview: doc.summary ? doc.summary.slice(0, 300) : null,
              rulesPreview: doc.groundedRules ? doc.groundedRules.slice(0, 500) : null,
              rulesFull: doc.groundedRules ?? null,
            };
          }),
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching associate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associate' },
      { status: 500 }
    );
  }
}));

// PUT /api/associates/[id] - Update associate
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAssociateSchema.parse(body);

    const { authorized, associate, organizationId, isOwner } = await checkAssociateAccess(id, userId);

    if (!authorized || !associate || !organizationId) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the associate owner can modify this associate' },
        { status: 403 }
      );
    }

    // Enforce per-user name uniqueness when name is being changed
    if (validatedData.name) {
      const nameConflict = await prisma.aIAssociate.findFirst({
        where: {
          name: { equals: validatedData.name, mode: 'insensitive' },
          createdById: userId,
          NOT: { id },
        },
        select: { id: true },
      });
      if (nameConflict) {
        return NextResponse.json(
          { error: 'You already have an associate with this name. Please choose a different name.' },
          { status: 409 }
        );
      }
    }

    // Validate documents if knowledgeBase is being updated
    const kbIds = validatedData.knowledgeBase ?? [];
    let kbResult = null;
    if (kbIds.length > 0) {
      const documentsCount = await prisma.document.count({
        where: {
          id: { in: kbIds },
          organization_id: organizationId
        }
      });

      if (documentsCount !== kbIds.length) {
        return NextResponse.json(
          { error: 'Some documents not found' },
          { status: 400 }
        );
      }

      // Process KB documents: validate extraction + generate summaries
      kbResult = await processKBDocuments(kbIds);
    }

    // Handle steps update if provided
    let stepsUpdate = {};
    if (validatedData.steps) {
      await prisma.associateStep.deleteMany({ where: { associateId: id } });
      stepsUpdate = {
        steps: {
          createMany: {
            data: validatedData.steps.map(s => ({
              description: s.description,
              stepOrder: s.stepOrder
            }))
          }
        }
      };
    }

    // Handle tools update if provided — delete all then re-insert
    if (validatedData.tools !== undefined) {
      await prisma.associateTool.deleteMany({ where: { associateId: id } });
      if (validatedData.tools.length > 0) {
        await prisma.associateTool.createMany({
          data: validatedData.tools.map(toolId => ({ associateId: id, toolId })),
          skipDuplicates: true,
        });
      }
    }

    const updatedAssociate = await prisma.aIAssociate.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.instructions && { instructions: validatedData.instructions }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.practiceAreas && { practiceAreas: validatedData.practiceAreas as any }),
        ...(validatedData.knowledgeBase && { knowledgeBase: validatedData.knowledgeBase }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...stepsUpdate
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        tools: true,
      }
    });

    // If the knowledge base changed, propagate document permissions to any user
    // the associate is already shared with. New KB docs must be readable by them;
    // docs removed from the KB must have their cascade-granted access revoked.
    if (validatedData.knowledgeBase) {
      const [shares, previousKBDocs] = await Promise.all([
        prisma.aIAssociateShare.findMany({
          where: { associateId: id },
          select: { userId: true }
        }),
        Promise.resolve(associate.knowledgeBase || [])
      ]);

      const sharedUserIds = shares.map((s: any) => s.userId);

      if (sharedUserIds.length > 0) {
        const nextKB = new Set(validatedData.knowledgeBase);
        const prevKB = new Set(previousKBDocs);
        const addedDocs = [...nextKB].filter((d) => !prevKB.has(d));
        const removedDocs = [...prevKB].filter((d) => !nextKB.has(d));

        await syncAssociateKBDocumentPermissions({
          ownerId: userId,
          organizationId,
          addedDocIds: addedDocs,
          removedDocIds: removedDocs,
          sharedUserIds,
        });
      }
    }

    return NextResponse.json({
      status: 200,
      message: 'Associate updated successfully',
      data: {
        associate: updatedAssociate,
        ...(kbResult && {
          knowledgeBaseStatus: {
            documents: kbResult.processed,
            allExtracted: kbResult.allExtracted,
            allSummarized: kbResult.allSummarized,
          }
        }),
      }
    });
  } catch (error: any) {
    console.error('Error updating associate:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update associate' },
      { status: 500 }
    );
  }
}));

// DELETE /api/associates/[id] - Delete associate
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const forceDelete = request.nextUrl.searchParams.get('force') === 'true';
    const { authorized, isOwner } = await checkAssociateAccess(id, userId);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the associate owner can delete this associate' },
        { status: 403 }
      );
    }

    const [projectLinks, conversationCount] = await Promise.all([
      prisma.projectAssociate.findMany({
        where: { associateId: id },
        select: {
          project: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.conversation.count({
        where: { aiAssociateId: id }
      })
    ]);

    const projects = projectLinks.map(link => link.project);
    const projectCount = projects.length;

    const totalUsage = projectCount + conversationCount;

    if (totalUsage > 0 && !forceDelete) {
      const errors = [];
      if (projectCount > 0) {
        errors.push(`${projectCount} project(s)`);
      }
      if (conversationCount > 0) {
        errors.push(`${conversationCount} conversation(s)`);
      }

      return NextResponse.json(
        {
          error: `Cannot delete: Associate is assigned to ${errors.join(' and ')}.`,
          code: 'ASSOCIATE_IN_USE',
          details: {
            projectCount,
            conversationCount,
            projects
          }
        },
        { status: 409 }
      );
    }

    if (forceDelete) {
      await prisma.$transaction([
        prisma.projectAssociate.deleteMany({ where: { associateId: id } }),
        prisma.conversation.updateMany({
          where: { aiAssociateId: id },
          data: { aiAssociateId: null }
        }),
        prisma.aIAssociate.delete({ where: { id } })
      ]);
    } else {
      await prisma.aIAssociate.delete({ where: { id } });
    }

    return NextResponse.json({
      status: 200,
      message: forceDelete
        ? 'Associate hard-deleted successfully. Project bindings and conversation association were removed.'
        : 'Associate deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting associate:', error);
    return NextResponse.json(
      { error: 'Failed to delete associate' },
      { status: 500 }
    );
  }
}));
