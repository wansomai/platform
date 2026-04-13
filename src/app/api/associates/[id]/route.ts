// app/api/associates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";
import { z } from "zod";

const updateAssociateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
  const currentOrgId = await getActiveOrganizationId(userId);

  if (!currentOrgId) {
    return { authorized: false, associate: null, organizationId: null };
  }

  const associate = await prisma.aIAssociate.findFirst({
    where: {
      id: associateId,
      organizationId: currentOrgId
    }
  });

  if (!associate) {
    return { authorized: false, associate: null, organizationId: currentOrgId };
  }

  return { authorized: true, associate, organizationId: currentOrgId };
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

    return NextResponse.json({
      status: 200,
      data: { associate: fullAssociate }
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

    const { authorized, associate, organizationId } = await checkAssociateAccess(id, userId);

    if (!authorized || !associate || !organizationId) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    // Validate documents if knowledgeBase is being updated
    if (validatedData.knowledgeBase && validatedData.knowledgeBase.length > 0) {
      const documentsCount = await prisma.document.count({
        where: {
          id: { in: validatedData.knowledgeBase },
          organization_id: organizationId
        }
      });

      if (documentsCount !== validatedData.knowledgeBase.length) {
        return NextResponse.json(
          { error: 'Some documents not found' },
          { status: 400 }
        );
      }
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

    return NextResponse.json({
      status: 200,
      message: 'Associate updated successfully',
      data: { associate: updatedAssociate }
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
    const { authorized } = await checkAssociateAccess(id, userId);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    // Check if associate is assigned to any active projects
    const projectCount = await prisma.projectAssociate.count({
      where: { associateId: id }
    });

    // Check if associate is linked to any conversations
    const conversationCount = await prisma.conversation.count({
      where: { aiAssociateId: id }
    });

    const totalUsage = projectCount + conversationCount;

    if (totalUsage > 0) {
      const errors = [];
      if (projectCount > 0) {
        errors.push(`${projectCount} project(s)`);
      }
      if (conversationCount > 0) {
        errors.push(`${conversationCount} conversation(s)`);
      }

      return NextResponse.json(
        { error: `Cannot delete: Associate is assigned to ${errors.join(' and ')}. Remove the associate from these first.` },
        { status: 400 }
      );
    }

    await prisma.aIAssociate.delete({ where: { id } });

    return NextResponse.json({
      status: 200,
      message: 'Associate deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting associate:', error);
    return NextResponse.json(
      { error: 'Failed to delete associate' },
      { status: 500 }
    );
  }
}));
