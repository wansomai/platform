import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess } from '@/lib/api/middleware';
import { createApiResponse, createBadRequestResponse, createNotFoundResponse } from '@/lib/api/response';

// PATCH /api/projects/[id]/conversations/[conversationId]/pin-message
// Body: { messageId: string }  — pin a message
// Body: { messageId: null }    — unpin
export const PATCH = withErrorHandler(
  withProjectAccess(async (
    request: NextRequest,
    { projectId, userId }: { userId: string; projectId: string },
    params: { params: Promise<{ id: string; conversationId: string }> }
  ) => {
    const { conversationId } = await params.params;
    const body = await request.json();
    const { messageId } = body as { messageId: string | null };

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
      select: { id: true },
    });

    if (!conversation) return createNotFoundResponse('Conversation');

    if (messageId) {
      // Verify the message belongs to this conversation
      const message = await prisma.message.findFirst({
        where: { id: messageId, conversationId },
        select: { id: true, content: true },
      });
      if (!message) return createBadRequestResponse('Message not found in this conversation');
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { pinnedMessageId: messageId ?? null },
      select: { id: true, pinnedMessageId: true },
    });

    return createApiResponse(updated, messageId ? 'Message pinned' : 'Message unpinned');
  })
);
