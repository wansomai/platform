import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createNotFoundResponse } from '@/lib/api/response';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/legal-knowledge/[id]/reprocess
 * Reprocess a legal knowledge entry (regenerate chunks and embeddings)
 * Useful after content updates or if initial processing failed
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;

    try {
      // Start reprocessing - this will run in the background
      LegalKnowledgeService.reprocess(id).catch(error => {
        console.error(`Reprocessing failed for ${id}:`, error);
      });

      return createApiResponse(
        { id, status: 'processing' },
        'Reprocessing started. Chunks and embeddings will be regenerated.'
      );
    } catch (error: any) {
      if (error.message === 'Legal knowledge not found') {
        return createNotFoundResponse('Legal knowledge');
      }
      throw error;
    }
  })
);
