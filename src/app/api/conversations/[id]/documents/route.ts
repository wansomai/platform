// app/api/conversations/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// Get documents attached to a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify conversation access (either in user's project or organization)
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
    
    // Get attached documents
    const conversationDocuments = await prisma.conversationDocument.findMany({
      where: { conversation_id: conversationId },
      include: {
        document: {
          include: {
            createdByUser: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });
    
    // Format response
    const documents = conversationDocuments.map(cd => ({
      id: cd.document.id,
      title: cd.document.title,
      description: cd.document.description || '',
      fileUrl: cd.document.file_url,
      fileType: cd.document.file_type,
      fileSize: cd.document.file_size,
      createdBy: cd.document.createdByUser?.fullName || 'Unknown',
      createdAt: cd.document.created_at.toISOString(),
      addedAt: cd.added_at.toISOString()
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    console.error('Error fetching conversation documents:', error);
    return NextResponse.json(
      { message: 'Failed to fetch conversation documents', error: true },
      { status: 500 }
    );
  }
}

// Add documents to a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get document IDs from request body
    const { documentIds } = await request.json();
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { message: 'Document IDs array is required', error: true }, 
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
    
    // Verify documents belong to user's organization
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        organization_id: user?.organizationId
      }
    });
    
    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { message: 'One or more documents not found or not accessible', error: true }, 
        { status: 400 }
      );
    }
    
    // Create conversation-document associations
    const createOperations = documentIds.map(docId => ({
      conversation_id: conversationId,
      document_id: docId,
      added_by: userId
    }));
    
    // Add documents to conversation (ignore if already attached)
    await prisma.$transaction(
      createOperations.map(data => 
        prisma.conversationDocument.upsert({
          where: {
            conversation_id_document_id: {
              conversation_id: data.conversation_id,
              document_id: data.document_id
            }
          },
          update: {}, // No updates if exists
          create: data
        })
      )
    );
    
    return NextResponse.json({
      status: 200,
      message: 'Documents attached to conversation successfully',
      data: { attached: documentIds.length }
    });
  } catch (error) {
    console.error('Error attaching documents to conversation:', error);
    return NextResponse.json(
      { message: 'Failed to attach documents to conversation', error: true },
      { status: 500 }
    );
  }
}