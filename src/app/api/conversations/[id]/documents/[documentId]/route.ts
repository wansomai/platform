// app/api/conversations/[id]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// Remove a document from a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) {
  try {
    const { id: conversationId, documentId } = (await params);
    
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
    
    // Check if the document is attached to the conversation
    const conversationDocument = await prisma.conversationDocument.findUnique({
      where: {
        conversation_id_document_id: {
          conversation_id: conversationId,
          document_id: documentId
        }
      }
    });
    
    if (!conversationDocument) {
      return NextResponse.json(
        { message: 'Document not attached to conversation', error: true }, 
        { status: 404 }
      );
    }
    
    // Remove document from conversation
    await prisma.conversationDocument.delete({
      where: {
        conversation_id_document_id: {
          conversation_id: conversationId,
          document_id: documentId
        }
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document removed from conversation successfully'
    });
  } catch (error) {
    console.error('Error removing document from conversation:', error);
    return NextResponse.json(
      { message: 'Failed to remove document from conversation', error: true },
      { status: 500 }
    );
  }
}