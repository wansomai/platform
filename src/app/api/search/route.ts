// src/app/api/search/route.ts
// On-demand pan-African legal search endpoint

import { NextRequest } from 'next/server';
import { createApiResponse, createBadRequestResponse, createErrorResponse } from '@/lib/api/response';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { AppError } from '@/types/error';
import { searchAfricanLegalSources } from '@/lib/legalScraper';

export const maxDuration = 60; // Vercel function timeout

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return createErrorResponse(new AppError('Unauthorized', 'AUTH_REQUIRED', 401));
  }

  let body: { query?: string; jurisdiction?: string; maxResults?: number; snippetsOnly?: boolean };
  try {
    body = await req.json();
  } catch {
    return createBadRequestResponse('Invalid JSON body');
  }

  const { query, jurisdiction, maxResults, snippetsOnly } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return createBadRequestResponse('query is required');
  }
  if (!jurisdiction || typeof jurisdiction !== 'string' || !jurisdiction.trim()) {
    return createBadRequestResponse('jurisdiction is required');
  }

  try {
    const response = await searchAfricanLegalSources(query.trim(), {
      jurisdictionHint: jurisdiction.trim(),
      maxResults: typeof maxResults === 'number' ? Math.min(maxResults, 20) : 10,
      snippetsOnly: snippetsOnly === true,
    });

    return createApiResponse(response, 'Legal search completed', 200);
  } catch (err: any) {
    console.error('[/api/search] error:', err);
    return createErrorResponse(new AppError(err.message || 'Search failed', 'SEARCH_ERROR', 500));
  }
}
