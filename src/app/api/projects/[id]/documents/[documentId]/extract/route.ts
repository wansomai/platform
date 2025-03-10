// src/app/api/projects/[id]/documents/[documentId]/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';

const prisma = new PrismaClient();

// Set a longer timeout for text extraction operations
export const maxDuration = 60;

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
  
  if (!projectMember) {
    // Check if user belongs to the organization that owns the project
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return false;
    }
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project || project.organizationId !== user.organizationId) {
      return false;
    }
  }
  
  return true;
}

// POST handler - Extract content from a document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, documentId: string } }
) {
  try {
    const projectId = params.id;
    const documentId = params.documentId;
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
        },
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }
    
    // Check if document exists
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        project_id: projectId
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Document not found' 
        },
        { status: 404 }
      );
    }
    
    // Check if content already extracted
    if (document.content_extracted) {
      // Check if content exists
      const existingContent = await prisma.documentContent.findUnique({
        where: { documentId }
      });
      
      if (existingContent) {
        return NextResponse.json({
          status: 200,
          message: 'Document content already extracted',
          data: {
            id: document.id,
            content_extracted: true,
            content_length: existingContent.content.length
          }
        });
      }
    }
    
    // Get file path from URL
    const filePath = document.file_url.split('/').pop();
    if (!filePath) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Invalid file URL' 
        },
        { status: 400 }
      );
    }
    
    // Download file from storage
    const fileBuffer = await blobStorageService.downloadFile(document.file_url);
    
    // Get mime type from document metadata
    let mimeType = 'application/octet-stream';
    if (document.metadata) {
      try {
        const metadata = JSON.parse(document.metadata.toString());
        mimeType = metadata.mimeType || mimeType;
      } catch (parseError) {
        console.error('Error parsing document metadata:', parseError);
      }
    } else {
      // Infer mime type from file extension
      const fileExt = document.file_type.toLowerCase();
      switch (fileExt) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'xls':
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'csv':
          mimeType = 'text/csv';
          break;
        case 'txt':
          mimeType = 'text/plain';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
      }
    }
    
    // Extract text from file
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(fileBuffer, mimeType);
    } catch (extractError) {
      console.error('Error extracting text from file:', extractError);
      return NextResponse.json(
        { 
          status: 500,
          message: 'Failed to extract text from document',
          error: String(extractError)
        },
        { status: 500 }
      );
    }
    
    // Store extracted text
    const contentUpsert = await prisma.documentContent.upsert({
      where: { documentId },
      update: { content: extractedText },
      create: {
        documentId,
        content: extractedText
      }
    });
    
    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
          content_extracted: true
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document content extracted successfully',
      data: {
        id: document.id,
        content_extracted: true,
        content_length: extractedText.length,
        content_preview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
      }
    });
  } catch (error) {
    console.error('Error extracting document content:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}