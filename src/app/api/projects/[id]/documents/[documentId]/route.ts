// src/app/api/projects/[id]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { blobStorageService } from '@/lib/storage';

const prisma = new PrismaClient();

// Schema validation
const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  category: z.string().optional(),
  description: z.string().optional()
});

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

// GET handler - Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, documentId: string } }
) {
  try {
    const projectId = params.id;
    const documentId = params.documentId;

    
    // Get document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        project_id: projectId
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
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
    
    // Get document content if requested
    const includeContent = request.nextUrl.searchParams.get('include_content') === 'true';
    let content = null;
    
    if (includeContent && document.content_extracted && 
        typeof document.content_extracted === 'object' && 
        'Bool' in document.content_extracted && 
        (document.content_extracted as any).Bool) {
      const documentContent = await prisma.documentContent.findUnique({
        where: { documentId }
      });
      
      content = documentContent?.content || null;
    }
    
    // Generate a signed download URL if using file path
    // If the file_url is already a full URL, use it directly
    let downloadUrl = document.file_url;
    if (!document.file_url.startsWith('http')) {
      // Extract the filename from the path
      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        downloadUrl = await blobStorageService.getFileUrl(fileName);
      }
    }
    
    // Format document
    const formattedDocument = {
      id: document.id,
      name: document.title,
      file_url: document.file_url,
      download_url: downloadUrl,
      file_type: document.file_type,
      file_size: document.file_size,
      category: document.section,
      uploaded_at: document.created_at.toISOString(),
      uploaded_by: document.created_by || 'Unknown User',
      description: document.description ? 
        (typeof document.description === 'object' && 'String' in document.description ? 
          (document.description as any).String : 
          '') : 
        '',
      content_extracted: document.content_extracted ? 
        (typeof document.content_extracted === 'object' && 'Bool' in document.content_extracted ? 
          (document.content_extracted as any).Bool : 
          false) : 
        false,
      content: content
    };
    
    return NextResponse.json({
      status: 200,
      message: 'Document retrieved successfully',
      data: formattedDocument
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT handler - Update a document
export async function PUT(
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
    
    // Parse request body
    const body = await request.json();
    const { title, category, description } = updateDocumentSchema.parse(body);
    
    // Prepare update data
    const updateData: any = {};
    
    if (title) {
      updateData.title = title;
    }
    
    if (category) {
      updateData.section = category;
    }
    
    if (description !== undefined) {
      updateData.description = {
        String: description,
        Valid: description.length > 0
      };
    }
    
    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    // Format response
    const formattedDocument = {
      id: updatedDocument.id,
      name: updatedDocument.title,
      file_url: updatedDocument.file_url,
      file_type: updatedDocument.file_type,
      file_size: updatedDocument.file_size,
      category: updatedDocument.section,
      uploaded_at: updatedDocument.created_at.toISOString(),
      uploaded_by: updatedDocument.createdByUser?.fullName || 'Unknown User',
      description: updatedDocument.description ? 
        (typeof updatedDocument.description === 'object' && 'String' in updatedDocument.description ? 
          (updatedDocument.description as any).String : 
          '') : 
        '',
      content_extracted: updatedDocument.content_extracted ? 
        (typeof updatedDocument.content_extracted === 'object' && 'Bool' in updatedDocument.content_extracted ? 
          (updatedDocument.content_extracted as any).Bool : 
          false) : 
        false
    };
    
    return NextResponse.json({
      status: 200,
      message: 'Document updated successfully',
      data: formattedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a document
export async function DELETE(
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
    
    // Delete document from database
    // This will automatically delete related content and embeddings due to cascade
    await prisma.document.delete({
      where: { id: documentId }
    });
    
    // Delete file from storage
    try {
      // Extract the filename from the path or URL
      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        await blobStorageService.deleteFile(document.file_url);
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with response even if storage deletion fails
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}