import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';




// GET /api/projects/[id]/canvas - Get canvas document for project
export async function GET(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
       const userId = getUserIdFromRequest(request);
       if (!userId) {
         return NextResponse.json(
           { message: 'Authentication required', error: true }, 
           { status: 401 }
         );
       }
   const projectId = (await params).id

    // Verify user has access to project
     const hasAccess = await checkProjectAccess(projectId, userId);
     if (!hasAccess) {
       return NextResponse.json(
         { message: 'Access denied to this project', error: true }, 
         { status: 403 }
       );
     }

    // Get canvas document
    const canvasDocument = await prisma.canvasDocument.findUnique({
      where: { projectId }
    });

    return NextResponse.json(canvasDocument);
  } catch (error) {
    console.error('Error fetching canvas document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canvas document' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/canvas
export async function POST(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
         const userId = getUserIdFromRequest(request);
       if (!userId) {
         return NextResponse.json(
           { message: 'Authentication required', error: true }, 
           { status: 401 }
         );
       }
   const projectId = (await params).id
    const { content, htmlContent, plainText } = await request.json();

    // Verify user has access to project
        const hasAccess = await checkProjectAccess(projectId, userId);
     if (!hasAccess) {
       return NextResponse.json(
         { message: 'Access denied to this project', error: true }, 
         { status: 403 }
       );
     }

    // Helper function to strip HTML tags
    const stripHtml = (html: string): string => {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    // Create or update canvas document
    const canvasDocument = await prisma.canvasDocument.upsert({
      where: { projectId },
      create: {
        projectId,
        content: content || {},
        htmlContent: htmlContent || '',
        plainText: plainText || stripHtml(htmlContent || '')
      },
      update: {
        content: content || {},
        htmlContent: htmlContent || '',
        plainText: plainText || stripHtml(htmlContent || ''),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(canvasDocument);
  } catch (error) {
    console.error('Error saving canvas document:', error);
    return NextResponse.json(
      { error: 'Failed to save canvas document' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/canvas - Clear canvas document
export async function DELETE(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
      const userId = getUserIdFromRequest(request);
       if (!userId) {
         return NextResponse.json(
           { message: 'Authentication required', error: true }, 
           { status: 401 }
         );
       }
    const projectId = (await params).id

    // Verify user has access to project
        const hasAccess = await checkProjectAccess(projectId, userId);
     if (!hasAccess) {
       return NextResponse.json(
         { message: 'Access denied to this project', error: true }, 
         { status: 403 }
       );
     }


    // Delete canvas document
    await prisma.canvasDocument.delete({
      where: { projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting canvas document:', error);
    return NextResponse.json(
      { error: 'Failed to delete canvas document' },
      { status: 500 }
    );
  }
}