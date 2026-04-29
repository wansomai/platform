import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withAuth } from '@/lib/api/middleware';
import { createApiResponse, createBadRequestResponse } from '@/lib/api/response';

const VALID_TYPES = ['project', 'document', 'associate'] as const;
type PinItemType = typeof VALID_TYPES[number];

// GET /api/pins?itemType=project   — returns pinned item IDs for the current user
// GET /api/pins                    — returns all pinned items grouped by type
export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType') as PinItemType | null;

    const where = itemType
      ? { userId, itemType }
      : { userId };

    const pins = await prisma.pinnedItem.findMany({
      where,
      orderBy: { pinnedAt: 'asc' },
      select: { itemId: true, itemType: true, pinnedAt: true },
    });

    return createApiResponse(pins);
  })
);

// POST /api/pins
// Body: { itemType: 'project' | 'document' | 'associate', itemId: string }
// Toggles: creates if not pinned, deletes if already pinned
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, userId: string) => {
    const { itemType, itemId } = await request.json() as { itemType: string; itemId: string };

    if (!VALID_TYPES.includes(itemType as PinItemType) || !itemId) {
      return createBadRequestResponse('itemType must be project, document, or associate');
    }

    const existing = await prisma.pinnedItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId } },
    });

    if (existing) {
      await prisma.pinnedItem.delete({
        where: { userId_itemType_itemId: { userId, itemType, itemId } },
      });
      return createApiResponse({ pinned: false, itemId }, 'Unpinned');
    }

    await prisma.pinnedItem.create({
      data: { userId, itemType, itemId },
    });
    return createApiResponse({ pinned: true, itemId }, 'Pinned');
  })
);
