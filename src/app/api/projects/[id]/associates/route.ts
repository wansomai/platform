// app/api/projects/[id]/associates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { checkProjectAccess } from "@/lib/auth/authorization";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";
import { canUseAssociates } from "@/lib/subscription";
import { z } from "zod";

const prisma = new PrismaClient();

const assignAssociateSchema = z.object({
  associateId: z.string()
});

// GET /api/projects/[id]/associates - Get all associates for project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: projectId } = await params;

    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          include: {
            steps: { orderBy: { stepOrder: 'asc' } }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    const associates = projectAssociates
      .map(pa => pa.associate)
      .filter(a => a !== null);

    return NextResponse.json({
      status: 200,
      data: { associates }
    });
  } catch (error: any) {
    console.error('Error fetching project associates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project associates' },
      { status: 500 }
    );
  }
}));

// POST /api/projects/[id]/associates - Assign associate to project
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { associateId } = assignAssociateSchema.parse(body);

    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify associate exists and user has access to it
    const currentOrgId = await getActiveOrganizationId(userId);

    if (!currentOrgId) {
      return NextResponse.json(
        { error: 'User not in organization' },
        { status: 403 }
      );
    }

    const associate = await prisma.aIAssociate.findFirst({
      where: {
        id: associateId,
        organizationId: currentOrgId
      }
    });

    if (!associate) {
      return NextResponse.json(
        { error: 'Associate not found' },
        { status: 404 }
      );
    }

    // Check if user has premium access before allowing assignment
    const associateCheck = await canUseAssociates(currentOrgId);
    if (!associateCheck.allowed) {
      return NextResponse.json(
        {
          error: associateCheck.reason,
          requiresUpgrade: true
        },
        { status: 403 }
      );
    }

    // Check if already assigned
    const existing = await prisma.projectAssociate.findUnique({
      where: {
        associateId_projectId: { associateId, projectId }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Associate already assigned to project' },
        { status: 400 }
      );
    }

    await prisma.projectAssociate.create({
      data: { associateId, projectId }
    });

    return NextResponse.json({
      status: 201,
      message: 'Associate assigned to project'
    });
  } catch (error: any) {
    console.error('Error assigning associate to project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to assign associate' },
      { status: 500 }
    );
  }
}));
