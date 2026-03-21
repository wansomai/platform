// GET /api/projects/[id]/canvas  — list all canvas documents for the project
// POST /api/projects/[id]/canvas — create a new canvas document
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

// Get all canvas documents for project (sorted newest first)
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
  }

  const canvasDocuments = await prisma.canvasDocument.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, projectId: true, title: true, htmlContent: true, plainText: true, content: true, createdAt: true, updatedAt: true }
  });

  return NextResponse.json(canvasDocuments);
}));

// Create a new canvas document
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;
  const { content, htmlContent, plainText, title } = await request.json();

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
  }

  const stripHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  const canvasDocument = await prisma.canvasDocument.create({
    data: {
      projectId,
      title: title || 'Untitled Document',
      content: content || {},
      htmlContent: htmlContent || '',
      plainText: plainText || stripHtml(htmlContent || '')
    }
  });

  return NextResponse.json(canvasDocument, { status: 201 });
}));
