// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { blobStorageService } from '@/lib/storage';

// Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    // Get user ID and organization from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check user's organization access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get document
    const includeContent = searchParams.get('includeContent') === 'true';
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        organization_id: user.organizationId // Ensure user has access
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        },
        content: includeContent // Only include content if requested
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { message: 'Document not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Format document for response
    const formattedDocument = {
      id: document.id,
      title: document.title,
      description: document.description || '',
      fileUrl: document.file_url,
      fileType: document.file_type,
      fileSize: document.file_size,
      createdBy: document.createdByUser?.fullName || 'Unknown',
      createdById: document.created_by,
      createdAt: document.created_at.toISOString(),
      updatedAt: document.updated_at.toISOString(),
      contentExtracted: document.content_extracted ? 
        (typeof document.content_extracted === 'object' && 'Bool' in document.content_extracted ? 
          (document.content_extracted as any).Bool : 
          false) : 
        false,
      content: document.content?.content || null
    };
    
    return NextResponse.json({
      status: 200,
      message: 'Document details retrieved successfully',
      data: formattedDocument
    });
  } catch (error) {
    console.error('Error fetching document details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch document details', error: true },
      { status: 500 }
    );
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    // Get user ID and organization from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check user's organization access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        organization_id: user.organizationId // Ensure user has access
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { message: 'Document not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Delete document from storage
    try {
      await blobStorageService.deleteFile(document.file_url);
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with deletion even if storage removal fails
    }
    
    // Delete document from database
    await prisma.document.delete({
      where: { id: documentId }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Failed to delete document', error: true },
      { status: 500 }
    );
  }
}