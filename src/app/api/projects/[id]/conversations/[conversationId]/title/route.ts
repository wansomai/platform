import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import { createApiResponse, createNotFoundResponse } from '@/lib/api/response';

export const GET = withErrorHandler(
  withProjectAccess(async (_request: NextRequest, context: ProjectContext, params: any) => {
    const { conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, title: true },
    });

    if (!conversation) {
      return createNotFoundResponse('Conversation');
    }

    return createApiResponse({ title: conversation.title });
  })
);
