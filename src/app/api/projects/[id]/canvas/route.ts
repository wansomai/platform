// GET /api/projects/[id]/canvas
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

// Get canvas document for project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Verify user has access to project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Get canvas document
  const canvasDocument = await prisma.canvasDocument.findUnique({
    where: { projectId }
  });

  return NextResponse.json(canvasDocument);
}));

// POST /api/projects/[id]/canvas
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;
  const { content, htmlContent, plainText } = await request.json();

  // Verify user has access to project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
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
}));

// DELETE - Clear canvas document
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Verify user has access to project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Delete canvas document
  await prisma.canvasDocument.delete({
    where: { projectId }
  });

  return NextResponse.json({ success: true });
}));