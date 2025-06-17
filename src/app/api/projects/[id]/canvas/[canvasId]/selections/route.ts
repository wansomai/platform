import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';

const prisma = new PrismaClient();

// Validation schemas
const createSelectionSchema = z.object({
  selectionText: z.string().min(1, 'Selection text is required'),
  selectionRange: z.object({
    start: z.number().min(0),
    end: z.number().min(0),
    offset: z.number().min(0).optional()
  }),
  actionType: z.enum(['improve', 'explain', 'cite', 'expand', 'rewrite']),
  userInstructions: z.string().optional()
});


//Get all selections for a canvas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string }> }
) {
  try {
    const { id: projectId, canvasId } = await params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { status: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { status: 403, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify canvas exists and belongs to project
    const canvas = await prisma.canvasState.findFirst({
      where: { id: canvasId, projectId }
    });

    if (!canvas) {
      return NextResponse.json(
        { status: 404, message: 'Canvas not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const actionType = url.searchParams.get('actionType');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build where clause
    const where: any = { canvasId };
    if (status) where.status = status;
    if (actionType) where.actionType = actionType;

    // Fetch selections
    const selections = await prisma.canvasSelection.findMany({
      where,
      include: {
        createdByUser: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      status: 200,
      message: 'Selections retrieved successfully',
      data: selections.map(selection => ({
        id: selection.id,
        canvasId: selection.canvasId,
        selectionText: selection.selectionText,
        selectionRange: selection.selectionRange,
        actionType: selection.actionType,
        userInstructions: selection.userInstructions,
        aiSuggestions: selection.aiSuggestions,
        status: selection.status,
        confidence: selection.confidence,
        processingTime: selection.processingTime,
        createdBy: selection.createdByUser,
        createdAt: selection.createdAt,
        updatedAt: selection.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching canvas selections:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


//Create new selection for AI processing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string }> }
) {
  try {
    const { id: projectId, canvasId } = await params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { status: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { status: 403, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify canvas exists and belongs to project
    const canvas = await prisma.canvasState.findFirst({
      where: { id: canvasId, projectId }
    });

    if (!canvas) {
      return NextResponse.json(
        { status: 404, message: 'Canvas not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = createSelectionSchema.parse(body);

    // Create selection
    const selection = await prisma.canvasSelection.create({
      data: {
        canvasId,
        selectionText: validatedData.selectionText,
        selectionRange: validatedData.selectionRange,
        actionType: validatedData.actionType,
        userInstructions: validatedData.userInstructions,
        status: 'pending',
        createdBy: userId
      },
      include: {
        createdByUser: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Return selection data immediately
    const responseData = {
      id: selection.id,
      canvasId: selection.canvasId,
      selectionText: selection.selectionText,
      selectionRange: selection.selectionRange,
      actionType: selection.actionType,
      userInstructions: selection.userInstructions,
      aiSuggestions: selection.aiSuggestions,
      status: selection.status,
      confidence: selection.confidence,
      processingTime: selection.processingTime,
      createdBy: selection.createdByUser,
      createdAt: selection.createdAt,
      updatedAt: selection.updatedAt
    };

    return NextResponse.json({
      status: 201,
      message: 'Selection created successfully',
      data: responseData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: 400, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating canvas selection:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


