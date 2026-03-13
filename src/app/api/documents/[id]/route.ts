// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { blobStorageService } from '@/lib/storage';

// Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const documentId = (await params).id;

    // Get user ID and organization from token (with JWT signature verification)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }

    // Check user's active organization access (supports org switching)
    const organizationId = await getActiveOrganizationId(userId);

    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Get document — user must be the uploader
    const includeContent = searchParams.get('includeContent') === 'true';
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        organization_id: organizationId,
        created_by: userId
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

// Rename document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }

    const organizationId = await getActiveOrganizationId(userId);
    const { title } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { message: 'Title is required', error: true },
        { status: 400 }
      );
    }

    const newTitle = title.trim();

    // Verify document exists in this org (any org member can rename)
    const document = await prisma.document.findUnique({
      where: { id: documentId, organization_id: organizationId }
    });

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found', error: true },
        { status: 404 }
      );
    }

    // Check no other document in the same folder has the same title (case-insensitive)
    const conflict = await prisma.document.findFirst({
      where: {
        organization_id: organizationId,
        title: { equals: newTitle, mode: 'insensitive' },
        folderId: document.folderId,
        id: { not: documentId }
      },
      select: { id: true }
    });

    if (conflict) {
      return NextResponse.json(
        { message: 'A document with that name already exists', error: true },
        { status: 409 }
      );
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { title: newTitle }
    });

    return NextResponse.json({
      status: 200,
      message: 'Document renamed successfully',
      data: { id: updated.id, title: updated.title }
    });
  } catch (error) {
    console.error('Error renaming document:', error);
    return NextResponse.json(
      { message: 'Failed to rename document', error: true },
      { status: 500 }
    );
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const documentId = (await params).id;

    // Get user ID and organization from token (with JWT signature verification)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }

    // Get active org and verify user owns this document
    const organizationId = await getActiveOrganizationId(userId);

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        organization_id: organizationId,
        created_by: userId
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