// app/api/conversations/[id]/instructions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// Get instructions for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const conversationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: {
            organizationId: true,
            members: {
              where: { userId }
            },
            knowledgeBase: true
          }
        }
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    // Check if user has access
    const hasAccess = conversation.project.members.length > 0 || 
                     (conversation.project.organizationId === user?.organizationId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this conversation', error: true }, 
        { status: 403 }
      );
    }
    
    // Check if there are instructions stored with the conversation
    const conversationMeta = await prisma.conversationMeta.findUnique({
      where: { conversationId }
    });
    
    // If conversation has specific instructions, return those
    if (conversationMeta?.instructions) {
      return NextResponse.json({
        status: 200,
        message: 'Conversation instructions retrieved successfully',
        data: {
          instructions: conversationMeta.instructions
        }
      });
    }
    
    // Otherwise, fall back to project-level instructions if they exist
    const projectInstructions = conversation.project.knowledgeBase?.instructions || '';
    
    return NextResponse.json({
      status: 200,
      message: 'Project-level instructions retrieved successfully',
      data: {
        instructions: projectInstructions
      }
    });
  } catch (error) {
    console.error('Error fetching conversation instructions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch conversation instructions', error: true },
      { status: 500 }
    );
  }
}

// Update instructions for a conversation
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
   
    const { id } = await context.params
    const conversationId = id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get instructions from request body
    const { instructions } = await request.json();
    
    if (typeof instructions !== 'string') {
      return NextResponse.json(
        { message: 'Instructions must be a string', error: true }, 
        { status: 400 }
      );
    }
    
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: {
            organizationId: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    // Check if user has access
    const hasAccess = conversation.project.members.length > 0 || 
                     (conversation.project.organizationId === user?.organizationId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this conversation', error: true }, 
        { status: 403 }
      );
    }
    
    // Upsert conversation meta
    await prisma.conversationMeta.upsert({
      where: { conversationId },
      update: { instructions },
      create: {
        conversationId,
        instructions
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Instructions updated successfully',
      data: { instructions }
    });
  } catch (error) {
    console.error('Error updating conversation instructions:', error);
    return NextResponse.json(
      { message: 'Failed to update conversation instructions', error: true },
      { status: 500 }
    );
  }
}