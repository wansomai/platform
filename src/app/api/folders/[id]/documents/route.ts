// app/api/folders/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';

export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const folderId = (await params).id;

  // Use the active organization so invited members work correctly
  const organizationId = await getActiveOrganizationId(userId);

  // Verify folder exists and belongs to the active organization
  let folder = null;
  if (folderId !== 'root') {
    folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        organizationId,
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }
  }

  // Parse request body
  const { documentIds, renames } = await request.json();

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json(
      { error: 'Document IDs are required' },
      { status: 400 }
    );
  }

  // Build rename map: docId → newTitle (trimmed)
  const renameMap: Record<string, string> = {};
  if (Array.isArray(renames)) {
    for (const r of renames) {
      if (r.id && r.newTitle && r.newTitle.trim()) {
        renameMap[r.id] = r.newTitle.trim();
      }
    }
  }

  // Verify documents exist and belong to the active organization
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      organization_id: organizationId,
    },
    select: { id: true, title: true }
  });

  if (documents.length !== documentIds.length) {
    return NextResponse.json(
      { error: 'One or more documents not found' },
      { status: 404 }
    );
  }

  // Check for title conflicts in the target folder
  const targetFolderId = folderId === 'root' ? null : folderId;
  const existingInTarget = await prisma.document.findMany({
    where: {
      organization_id: organizationId,
      folderId: targetFolderId,
      id: { notIn: documentIds }, // exclude the docs being moved themselves
    },
    select: { title: true }
  });
  const existingTitlesLower = new Set(existingInTarget.map((d: { title: string }) => d.title.toLowerCase()));

  const conflicts: { id: string; title: string }[] = [];
  for (const doc of documents) {
    const effectiveTitle = renameMap[doc.id] ?? doc.title;
    if (existingTitlesLower.has(effectiveTitle.toLowerCase())) {
      conflicts.push({ id: doc.id, title: effectiveTitle });
    }
  }

  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: 'Some documents conflict with existing names in the target folder. Please rename them before moving.',
        conflicts
      },
      { status: 409 }
    );
  }

  // Apply renames first (individual updates required for title changes)
  for (const [docId, newTitle] of Object.entries(renameMap)) {
    await prisma.document.update({
      where: { id: docId },
      data: { title: newTitle }
    });
  }

  // Move documents to the target folder
  await prisma.document.updateMany({
    where: {
      id: { in: documentIds },
      organization_id: organizationId,
    },
    data: {
      folderId: targetFolderId
    }
  });

  return NextResponse.json({
    status: 200,
    message: `Documents moved to ${folderId === 'root' ? 'root folder' : 'folder'} successfully`,
    data: { count: documents.length }
  });
}));
