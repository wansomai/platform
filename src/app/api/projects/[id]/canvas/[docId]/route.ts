// GET    /api/projects/[id]/canvas/[docId] — fetch specific canvas document
// PUT    /api/projects/[id]/canvas/[docId] — update specific canvas document
// DELETE /api/projects/[id]/canvas/[docId] — delete specific canvas document
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; docId: string }> }
) => {
  const { id: projectId, docId } = await params;

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
  }

  const doc = await prisma.canvasDocument.findFirst({
    where: { id: docId, projectId }
  });

  if (!doc) {
    return NextResponse.json({ error: 'Canvas document not found' }, { status: 404 });
  }

  return NextResponse.json(doc);
}));

export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; docId: string }> }
) => {
  const { id: projectId, docId } = await params;
  const { content, htmlContent, plainText, title } = await request.json();

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
  }

  const stripHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  const existing = await prisma.canvasDocument.findFirst({ where: { id: docId, projectId } });
  if (!existing) {
    return NextResponse.json({ error: 'Canvas document not found' }, { status: 404 });
  }

  const updateData: any = { updatedAt: new Date() };
  if (title !== undefined) updateData.title = title;
  if (content !== undefined && content !== null) updateData.content = content;
  if (htmlContent !== undefined) {
    updateData.htmlContent = htmlContent;
    updateData.plainText = plainText || stripHtml(htmlContent);
  }

  const doc = await prisma.canvasDocument.update({
    where: { id: docId },
    data: updateData
  });

  return NextResponse.json(doc);
}));

export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; docId: string }> }
) => {
  const { id: projectId, docId } = await params;

  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
  }

  const existing = await prisma.canvasDocument.findFirst({ where: { id: docId, projectId } });
  if (!existing) {
    return NextResponse.json({ error: 'Canvas document not found' }, { status: 404 });
  }

  await prisma.canvasDocument.delete({ where: { id: docId } });

  return NextResponse.json({ success: true });
}));
