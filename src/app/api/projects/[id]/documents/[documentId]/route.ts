// src/app/api/projects/[id]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

const prisma = new PrismaClient();


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

// DELETE - Remove document from project (keeps in vault)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, documentId: string }> }
) {
  try {
    const { id: projectId, documentId } = (await params);
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this project', error: true }, 
        { status: 403 }
      );
    }
    
    // Check if the document is attached to the project
    const projectDocument = await prisma.projectDocument.findUnique({
      where: {
        project_id_document_id: {
          project_id: projectId,
          document_id: documentId
        }
      }
    });
    
    if (!projectDocument) {
      return NextResponse.json(
        { message: 'Document not attached to project', error: true }, 
        { status: 404 }
      );
    }
    
    // Remove document from project (detach only - document remains in vault)
    await prisma.projectDocument.delete({
      where: {
        project_id_document_id: {
          project_id: projectId,
          document_id: documentId
        }
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Document detached from project successfully'
    });
  } catch (error) {
    console.error('Error detaching document from project:', error);
    return NextResponse.json(
      { message: 'Failed to detach document from project', error: true },
      { status: 500 }
    );
  }
}