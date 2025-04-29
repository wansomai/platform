// app/api/folders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const folderId = (await params).id;
    
    // Get user ID and organization
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
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
    
    // Get folder with documents
    const folder = await prisma.folder.findUnique({
      where: { 
        id: folderId,
        organizationId: user.organizationId
      },
      include: {
        documents: {
          include: {
            createdByUser: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        children: {
          include: {
            _count: {
              select: { documents: true }
            }
          }
        }
      }
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: 'Folder not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Format documents
    const formattedDocuments = folder.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      fileUrl: doc.file_url,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      createdBy: doc.createdByUser?.fullName || 'Unknown',
      createdById: doc.created_by,
      createdAt: doc.created_at.toISOString(),
      updatedAt: doc.updated_at.toISOString(),
      contentExtracted: doc.content_extracted ? 
        (typeof doc.content_extracted === 'object' && 'Bool' in doc.content_extracted ? 
          (doc.content_extracted as any).Bool : 
          false) : 
        false
    }));
    
    // Format response
    const formattedFolder = {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      documents: formattedDocuments,
      subfolders: folder.children.map(child => ({
        id: child.id,
        name: child.name,
        documentCount: child._count.documents
      })),
      createdBy: folder.createdBy,
      createdAt: folder.createdAt.toISOString()
    };
    
    return NextResponse.json({
      status: 200,
      message: 'Folder retrieved successfully',
      data: formattedFolder
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { message: 'Failed to fetch folder', error: true },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const folderId = (await params).id;
    
    // Get user ID and organization
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
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
    
    // Verify folder exists and belongs to organization
    const folder = await prisma.folder.findUnique({
      where: { 
        id: folderId,
        organizationId: user.organizationId
      }
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: 'Folder not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Parse request body
    const { name, parentId } = await request.json();
    
    // Update data
    const updateData: any = {};
    
    if (name && name.trim() !== '') {
      updateData.name = name.trim();
    }
    
    if (parentId !== undefined) {
      // If setting parent, verify parent folder exists and belongs to organization
      if (parentId) {
        const parentFolder = await prisma.folder.findUnique({
          where: { 
            id: parentId,
            organizationId: user.organizationId
          }
        });
        
        if (!parentFolder) {
          return NextResponse.json(
            { message: 'Parent folder not found', error: true },
            { status: 404 }
          );
        }
        
        // Prevent circular reference
        if (parentId === folderId) {
          return NextResponse.json(
            { message: 'A folder cannot be its own parent', error: true },
            { status: 400 }
          );
        }
      }
      
      updateData.parentId = parentId || null;
    }
    
    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: updateData
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Folder updated successfully',
      data: updatedFolder
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { message: 'Failed to update folder', error: true },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const folderId = (await params).id;
    
    // Get user ID and organization
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
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
    
    // Verify folder exists and belongs to organization
    const folder = await prisma.folder.findUnique({
      where: { 
        id: folderId,
        organizationId: user.organizationId
      },
      include: {
        children: true,
        documents: {
          select: { id: true }
        }
      }
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: 'Folder not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if folder has documents
    if (folder.documents.length > 0) {
      // Update documents to remove folder association
      await prisma.document.updateMany({
        where: { folderId: folderId },
        data: { folderId: null }
      });
    }
    
    // Check if folder has subfolders
    if (folder.children.length > 0) {
      // Update subfolders to remove parent association
      await prisma.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId } // Move to parent folder or to root
      });
    }
    
    // Delete folder
    await prisma.folder.delete({
      where: { id: folderId }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { message: 'Failed to delete folder', error: true },
      { status: 500 }
    );
  }
}