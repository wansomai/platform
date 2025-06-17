import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

const prisma = new PrismaClient();

const updateSelectionSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'applied', 'rejected']).optional(),
  aiSuggestions: z.array(z.object({
    suggestedText: z.string()
  })).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string; selectionId: string }> }
) {
  try {
    const { id: projectId, canvasId, selectionId } = await params;
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

    // Fetch selection with related data
    const selection = await prisma.canvasSelection.findFirst({
      where: {
        id: selectionId,
        canvasId,
        canvas: { projectId }
      },
      include: {
        createdByUser: {
          select: { id: true, fullName: true, email: true }
        },
        canvas: {
          select: { id: true, title: true, projectId: true }
        }
      }
    });

    if (!selection) {
      return NextResponse.json(
        { status: 404, message: 'Selection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: 'Selection retrieved successfully',
      data: {
        id: selection.id,
        canvasId: selection.canvasId,
        canvas: selection.canvas,
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
      }
    });

  } catch (error) {
    console.error('Error fetching canvas selection:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
//Update selection (usually to apply AI suggestion)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string; selectionId: string }> }
) {
  try {
    const { id: projectId, canvasId, selectionId } = await params;
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

    // Validate request body
    const body = await request.json();
    const validatedData = updateSelectionSchema.parse(body);

    // Check if selection exists
    const existingSelection = await prisma.canvasSelection.findFirst({
      where: {
        id: selectionId,
        canvasId,
        canvas: { projectId }
      }
    });

    if (!existingSelection) {
      return NextResponse.json(
        { status: 404, message: 'Selection not found' },
        { status: 404 }
      );
    }

    // Update selection
    const updatedSelection = await prisma.canvasSelection.update({
      where: { id: selectionId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        createdByUser: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // If status is 'applied', update canvas content if suggestion is available
    if (validatedData.status === 'applied' && updatedSelection.aiSuggestions) {
      const suggestions = Array.isArray(updatedSelection.aiSuggestions) 
        ? updatedSelection.aiSuggestions 
        : [];
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0] as { suggestedText: string } ?? null; // Apply first suggestion
        
        // Get current canvas content
        const canvas = await prisma.canvasState.findUnique({
          where: { id: canvasId }
        });

        if (canvas && suggestion && suggestion.suggestedText) {
          // Replace selected text with suggestion in canvas content
          const updatedContent = canvas.content.replace(
            updatedSelection.selectionText,
            suggestion.suggestedText
          );

          // Update canvas with new content and increment version
          await prisma.canvasState.update({
            where: { id: canvasId },
            data: {
              content: updatedContent,
              version: { increment: 1 },
              updatedAt: new Date()
            }
          });

          // Create version record
          await prisma.canvasVersion.create({
            data: {
              canvasId,
              version: canvas.version + 1,
              content: updatedContent,
              changes: {
                type: 'ai_suggestion_applied',
                selectionId: updatedSelection.id,
                actionType: updatedSelection.actionType,
                timestamp: new Date().toISOString()
              },
              summary: `Applied AI suggestion: ${updatedSelection.actionType}`,
              createdBy: userId
            }
          });
        }
      }
    }

    return NextResponse.json({
      status: 200,
      message: 'Selection updated successfully',
      data: {
        id: updatedSelection.id,
        canvasId: updatedSelection.canvasId,
        selectionText: updatedSelection.selectionText,
        selectionRange: updatedSelection.selectionRange,
        actionType: updatedSelection.actionType,
        userInstructions: updatedSelection.userInstructions,
        aiSuggestions: updatedSelection.aiSuggestions,
        status: updatedSelection.status,
        confidence: updatedSelection.confidence,
        processingTime: updatedSelection.processingTime,
        createdBy: updatedSelection.createdByUser,
        createdAt: updatedSelection.createdAt,
        updatedAt: updatedSelection.updatedAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: 400, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating canvas selection:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/canvas/[canvasId]/selections/[selectionId] - Delete selection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string; selectionId: string }> }
) {
  try {
    const { id: projectId, canvasId, selectionId } = await params;
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

    // Check if selection exists
    const selection = await prisma.canvasSelection.findFirst({
      where: {
        id: selectionId,
        canvasId,
        canvas: { projectId }
      }
    });

    if (!selection) {
      return NextResponse.json(
        { status: 404, message: 'Selection not found' },
        { status: 404 }
      );
    }

    // Delete selection
    await prisma.canvasSelection.delete({
      where: { id: selectionId }
    });

    return NextResponse.json({
      status: 200,
      message: 'Selection deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting canvas selection:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

