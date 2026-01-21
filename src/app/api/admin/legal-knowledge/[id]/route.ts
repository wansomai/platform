import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createErrorResponse, createNotFoundResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/legal-knowledge/[id]
 * Get a single legal knowledge entry by ID
 */
export const GET = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;

    const legalKnowledge = await LegalKnowledgeService.getById(id);

    if (!legalKnowledge) {
      return createNotFoundResponse('Legal knowledge');
    }

    return createApiResponse(legalKnowledge, 'Legal knowledge retrieved successfully');
  })
);

/**
 * PATCH /api/admin/legal-knowledge/[id]
 * Update a legal knowledge entry
 * Body (all optional):
 * - title: string
 * - description: string
 * - type: LegalKnowledgeType
 * - jurisdiction: Jurisdiction
 * - practiceAreas: PracticeArea[]
 * - content: string
 * - sourceReference: string
 * - effectiveDate: Date
 * - tags: string[]
 * - status: 'active' | 'archived' | 'draft'
 */
export const PATCH = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;
    const body = await request.json();

    // Validate type if provided
    if (body.type) {
      const validTypes: LegalKnowledgeType[] = [
        'TEMPLATE',
        'CASE_LAW',
        'STATUTE',
        'REGULATION',
        'LEGAL_OPINION',
        'PRACTICE_GUIDE'
      ];
      if (!validTypes.includes(body.type)) {
        return createErrorResponse(
          new AppError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 'VALIDATION_ERROR', 400)
        );
      }
    }

    // Validate jurisdiction if provided
    if (body.jurisdiction) {
      const validJurisdictions: Jurisdiction[] = [
        'KENYA_NATIONAL',
        'KENYA_NAIROBI',
        'INTERNATIONAL',
        'GENERAL'
      ];
      if (!validJurisdictions.includes(body.jurisdiction)) {
        return createErrorResponse(
          new AppError(
            `Invalid jurisdiction. Must be one of: ${validJurisdictions.join(', ')}`,
            'VALIDATION_ERROR',
            400
          )
        );
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'archived', 'draft'];
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse(
          new AppError(
            `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            'VALIDATION_ERROR',
            400
          )
        );
      }
    }

    try {
      const updated = await LegalKnowledgeService.update(id, {
        title: body.title,
        description: body.description,
        type: body.type,
        jurisdiction: body.jurisdiction,
        practiceAreas: body.practiceAreas,
        content: body.content,
        sourceReference: body.sourceReference,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
        tags: body.tags,
        status: body.status
      });

      return createApiResponse(updated, 'Legal knowledge updated successfully');
    } catch (error: any) {
      if (error.message === 'Legal knowledge not found') {
        return createNotFoundResponse('Legal knowledge');
      }
      throw error;
    }
  })
);

/**
 * DELETE /api/admin/legal-knowledge/[id]
 * Soft delete a legal knowledge entry (archives it)
 * Query params:
 * - hard: 'true' to permanently delete
 */
export const DELETE = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string, context: RouteContext) => {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    try {
      if (hardDelete) {
        await LegalKnowledgeService.hardDelete(id);
        return createApiResponse(null, 'Legal knowledge permanently deleted');
      } else {
        await LegalKnowledgeService.delete(id);
        return createApiResponse(null, 'Legal knowledge archived successfully');
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        return createNotFoundResponse('Legal knowledge');
      }
      throw error;
    }
  })
);
