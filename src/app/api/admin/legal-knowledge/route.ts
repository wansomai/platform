
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createApiResponse, createErrorResponse, createCreatedResponse, calculatePagination, createPaginatedResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';
import type { LegalKnowledgeFilter, LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';

/**
 * GET /api/admin/legal-knowledge
 * List all legal knowledge entries with filtering and pagination
 * Query params:
 * - type: LegalKnowledgeType
 * - jurisdiction: Jurisdiction
 * - status: 'active' | 'archived' | 'draft'
 * - isPublished: boolean
 * - search: string
 * - page: number (default 1)
 * - limit: number (default 20)
 */
export const GET = withErrorHandler(
  withAdminAuth(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const filter: LegalKnowledgeFilter = {};

    const type = searchParams.get('type');
    if (type) {
      filter.type = type as LegalKnowledgeType;
    }

    const jurisdiction = searchParams.get('jurisdiction');
    if (jurisdiction) {
      filter.jurisdiction = jurisdiction as Jurisdiction;
    }

    const status = searchParams.get('status');
    if (status) {
      filter.status = status as 'active' | 'archived' | 'draft';
    }

    const isPublished = searchParams.get('isPublished');
    if (isPublished !== null) {
      filter.isPublished = isPublished === 'true';
    }

    const search = searchParams.get('search');
    if (search) {
      filter.search = search;
    }

    const { items, total } = await LegalKnowledgeService.list(filter, page, limit);
    const stats = await LegalKnowledgeService.getStats();

    const pagination = calculatePagination(total, page, limit);

    return NextResponse.json({
      success: true,
      data: items,
      pagination,
      stats,
      message: 'Legal knowledge retrieved successfully',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/admin/legal-knowledge
 * Create a new legal knowledge entry from text content
 * Body:
 * - title: string (required)
 * - description: string
 * - type: LegalKnowledgeType (required)
 * - jurisdiction: Jurisdiction (required)
 * - practiceAreas: PracticeArea[]
 * - content: string (required)
 * - sourceType: string
 * - sourceReference: string
 * - effectiveDate: Date
 * - tags: string[]
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string) => {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type || !body.jurisdiction || !body.content) {
      return createErrorResponse(
        new AppError(
          'Missing required fields: title, type, jurisdiction, content',
          'VALIDATION_ERROR',
          400
        )
      );
    }

    // Validate type
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

    // Validate jurisdiction
    const validJurisdictions: Jurisdiction[] = [
      'KENYA',
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

    const legalKnowledge = await LegalKnowledgeService.create(
      {
        title: body.title,
        description: body.description,
        type: body.type,
        jurisdiction: body.jurisdiction,
        practiceAreas: body.practiceAreas || [],
        content: body.content,
        sourceType: body.sourceType,
        sourceReference: body.sourceReference,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
        tags: body.tags || []
      },
      userId
    );

    return createCreatedResponse(legalKnowledge, 'Legal knowledge created successfully');
  })
);
