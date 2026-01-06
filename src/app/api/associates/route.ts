// app/api/associates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for creating associates
const createAssociateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  description: z.string().max(500, "Description too long").optional(),
  practiceAreas: z.array(z.string()).min(1, "At least one practice area is required"),
  knowledgeBase: z.array(z.string()).optional(),
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
    if (validatedData.knowledgeBase && validatedData.knowledgeBase.length > 0) {
      const documentsCount = await prisma.document.count({
        where: {
          id: { in: validatedData.knowledgeBase },
          organization_id: currentOrgId
        }
      });

      if (documentsCount !== validatedData.knowledgeBase.length) {
        return NextResponse.json(
          { error: 'Some documents not found or unauthorized' },
          { status: 400 }
        );
      }
    }

    const associate = await prisma.aIAssociate.create({
      data: {
        name: validatedData.name,
        instructions: validatedData.instructions,
        description: validatedData.description,
        practiceAreas: validatedData.practiceAreas as any,
        knowledgeBase: validatedData.knowledgeBase || [],
        organizationId: currentOrgId,
        createdById: userId,
        steps: validatedData.steps ? {
          createMany: { data: validatedData.steps }
        } : undefined
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } }
      }
    });

    return NextResponse.json({
      status: 201,
      message: 'Associate created successfully',
      data: { associate }
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
