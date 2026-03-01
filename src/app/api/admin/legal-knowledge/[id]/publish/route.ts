import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createErrorResponse, createNotFoundResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/legal-knowledge/[id]/publish
 * Publish a legal knowledge entry for RAG
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const published = await LegalKnowledgeService.publish(id);
      return createApiResponse(published, 'Legal knowledge published successfully');
    } catch (error: any) {
      if (error.message === 'Legal knowledge not found') {
        return createNotFoundResponse('Legal knowledge');
      }
      if (error.message === 'Cannot publish: no chunks have been processed') {
        return createErrorResponse(
          new AppError(
            'Cannot publish: document has not been processed yet. Wait for chunking to complete or trigger reprocessing.',
            'PROCESSING_INCOMPLETE',
            400
          )
        );
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/admin/legal-knowledge/[id]/publish
 * Unpublish a legal knowledge entry (remove from RAG)
 */
export const DELETE = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const unpublished = await LegalKnowledgeService.unpublish(id);
      return createApiResponse(unpublished, 'Legal knowledge unpublished successfully');
    } catch (error: any) {
      if (error.code === 'P2025') {
        return createNotFoundResponse('Legal knowledge');
      }
      throw error;
    }
  })
);
