// app/api/folders/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

export async function POST(
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
    let folder = null;
    if (folderId !== 'root') {
      folder = await prisma.folder.findUnique({
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
    }
    
    // Parse request body
    const { documentIds } = await request.json();
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { message: 'Document IDs are required', error: true },
        { status: 400 }
      );
    }
    
    // Verify documents exist and belong to organization
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        organization_id: user.organizationId
      }
    });
    
    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { message: 'One or more documents not found', error: true },
        { status: 404 }
      );
    }
    
    // Update documents to move to folder
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        organization_id: user.organizationId
      },
      data: {
        folderId: folderId === 'root' ? null : folderId
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: `Documents moved to ${folderId === 'root' ? 'root folder' : 'folder'} successfully`,
      data: { count: documents.length }
    });
  } catch (error) {
    console.error('Error moving documents to folder:', error);
    return NextResponse.json(
      { message: 'Failed to move documents', error: true },
      { status: 500 }
    );
  }
}