// app/api/associates/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";
import { processKBDocuments } from "@/services/kbSummaryService";
import { z } from "zod";

// Validation schema for creating associates
const createAssociateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  description: z.string().max(2000, "Description too long").optional(),
  practiceAreas: z.array(z.string()).min(1, "At least one practice area is required"),
  knowledgeBase: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  steps: z.array(z.object({
    description: z.string(),
    stepOrder: z.number()
  })).optional()
});

// GET /api/associates - List all associates for user's organization
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string
) => {
  try {
    const currentOrgId = await getActiveOrganizationId(userId);

    if (!currentOrgId) {
      return NextResponse.json(
        { error: 'User not in organization' },
        { status: 403 }
      );
    }

    const associates = await prisma.aIAssociate.findMany({
      where: { organizationId: currentOrgId },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        createdBy: { select: { fullName: true, email: true } },
        _count: { select: { projects: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      status: 200,
      data: { associates }
    });
  } catch (error: any) {
    console.error('Error fetching associates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associates' },
      { status: 500 }
    );
  }
}));

// POST /api/associates - Create new associate
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string
) => {
  try {
    const body = await request.json();
    const validatedData = createAssociateSchema.parse(body);

    const currentOrgId = await getActiveOrganizationId(userId);

    if (!currentOrgId) {
      return NextResponse.json(
        { error: 'User not in organization' },
        { status: 403 }
      );
    }

    // Validate document IDs exist and belong to organization
    const kbIds = validatedData.knowledgeBase ?? [];
    if (kbIds.length > 0) {
      const documentsCount = await prisma.document.count({
        where: {
          id: { in: kbIds },
          organization_id: currentOrgId
        }
      });

      if (documentsCount !== kbIds.length) {
        return NextResponse.json(
          { error: 'Some documents not found or unauthorized' },
          { status: 400 }
        );
      }
    }

    // Process KB documents: validate extraction + generate summaries
    const kbResult = kbIds.length > 0
      ? await processKBDocuments(kbIds)
      : null;

    const associate = await prisma.aIAssociate.create({
      data: {
        name: validatedData.name,
        instructions: validatedData.instructions,
        description: validatedData.description,
        practiceAreas: validatedData.practiceAreas as any,
        knowledgeBase: kbIds,
        organizationId: currentOrgId,
        createdById: userId,
        steps: validatedData.steps ? {
          createMany: { data: validatedData.steps }
        } : undefined,
        tools: validatedData.tools && validatedData.tools.length > 0 ? {
          createMany: {
            data: validatedData.tools.map(toolId => ({ toolId })),
            skipDuplicates: true,
          }
        } : undefined,
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        tools: true,
      }
    });

    return NextResponse.json({
      status: 201,
      message: 'Associate created successfully',
      data: {
        associate,
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
    console.error('Error creating associate:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create associate' },
      { status: 500 }
    );
  }
}));
