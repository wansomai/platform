// app/api/conversations/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { extractTextFromFile } from '@/lib/documentParser';
import { blobStorageService } from '@/lib/storage';

// Maximum duration for document processing
export const maxDuration = 60;

/**
 * Robustly extracts content from a document and stores it
 * @param documentId Document ID to extract
 * @returns Promise resolving to true on success, false on failure
 */
async function extractDocumentContent(documentId: string): Promise<boolean> {
  try {
    // Check if document content already exists
    const existingContent = await prisma.documentContent.findUnique({
      where: { documentId }
    });
    
    if (existingContent) {
      return true; // Content already exists
    }
    
    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      console.error(`Document ${documentId} not found for extraction`);
      return false;
    }
    
    // Download file from storage
    const fileBuffer = await blobStorageService.downloadFile(document.file_url);
    
    // Determine the MIME type
    let mimeType = 'application/octet-stream';
    
    if (document.metadata) {
      try {
        const metadata = JSON.parse(document.metadata.toString());
        mimeType = metadata.mimeType || mimeType;
      } catch (error) {
        console.warn(`Could not parse metadata for document ${documentId}:`, error);
      }
    }
    
    // If no mime type in metadata, infer from file extension
    if (mimeType === 'application/octet-stream') {
      const fileExt = document.file_type.toLowerCase();
      switch (fileExt) {
        case 'pdf': mimeType = 'application/pdf'; break;
        case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        case 'doc': mimeType = 'application/msword'; break;
        case 'xlsx': mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        case 'xls': mimeType = 'application/vnd.ms-excel'; break;
        case 'csv': mimeType = 'text/csv'; break;
        case 'txt': mimeType = 'text/plain'; break;
        case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
        case 'png': mimeType = 'image/png'; break;
      }
    }
    
    // Extract text content from file
    const extractedText = await extractTextFromFile(fileBuffer, mimeType);
    
    // Store the extracted content
    await prisma.documentContent.create({
      data: {
        documentId,
        content: extractedText
      }
    });
    
    // Update document extraction status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content_extracted: {
          Bool: true,
          Valid: true
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error extracting content for document ${documentId}:`, error);
    return false;
  }
}

// Get documents attached to a conversation
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
    
    // Get attached documents with extraction status
    const conversationDocuments = await prisma.conversationDocument.findMany({
      where: { conversation_id: conversationId },
      include: {
        document: true // Ensure the document relation is included
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
      createdBy: cd.document.created_by || 'Unknown',
      createdAt: cd.document.created_at.toISOString(),
      addedAt: cd.added_at.toISOString(),
      contentExtracted: Boolean(cd.document.content_extracted), // True if content extraction status is valid and true
      processingStatus: cd.document.content_extracted ? 'complete' : (
        cd.document.content_extracted && 
        typeof cd.document.content_extracted === 'object' && 
        'Bool' in cd.document.content_extracted && 
        (cd.document.content_extracted as any).Bool ? 'processing' : 'pending'
      )
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
    
    // Start content extraction process in the background
    // Extract content for all newly attached documents
    const extractionPromises = documentIds.map(async (docId) => {
      try {
        // First check if content already exists
        const documentContent = await prisma.documentContent.findUnique({
          where: { documentId: docId }
        });
        
        if (!documentContent) {
          // Only extract if content doesn't exist
          // Update the document status to indicate processing
          await prisma.document.update({
            where: { id: docId },
            data: {
              content_extracted: {
                Bool: false,
                Valid: true
              }
            }
          });
          
          // Schedule extraction (don't wait for it to complete)
          extractDocumentContent(docId).catch(err => {
            console.error(`Background extraction failed for document ${docId}:`, err);
          });
          
          return false; // Content not yet available
        }
        
        return true; // Content already available
      } catch (error) {
        console.error(`Error checking content for document ${docId}:`, error);
        return false;
      }
    });
    
    // Check current content status but don't wait for extraction to complete
    const contentStatus = await Promise.all(extractionPromises);
    const availableCount = contentStatus.filter(Boolean).length;
    const processingCount = documentIds.length - availableCount;
    
    return NextResponse.json({
      status: 200,
      message: 'Documents attached to conversation successfully',
      data: { 
        attached: documentIds.length,
        content_available: availableCount,
        content_processing: processingCount
      }
    });
  } catch (error) {
    console.error('Error attaching documents to conversation:', error);
    return NextResponse.json(
      { message: 'Failed to attach documents to conversation', error: true },
      { status: 500 }
    );
  }
}