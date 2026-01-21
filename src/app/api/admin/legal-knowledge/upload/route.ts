import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createCreatedResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';

// Allowed file types for upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/admin/legal-knowledge/upload
 * Upload a file and create a legal knowledge entry
 *
 * Form data:
 * - file: File (required)
 * - title: string (required)
 * - description: string
 * - type: LegalKnowledgeType (required)
 * - jurisdiction: Jurisdiction (required)
 * - practiceAreas: JSON string of PracticeArea[]
 * - sourceType: string
 * - sourceReference: string
 * - effectiveDate: ISO date string
 * - tags: JSON string of string[]
 */
export const POST = withErrorHandler(
  withAdminAuth(async (request: NextRequest, userId: string) => {
    const formData = await request.formData();

    // Get file
    const file = formData.get('file') as File | null;
    if (!file) {
      return createErrorResponse(
        new AppError('No file provided', 'VALIDATION_ERROR', 400)
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return createErrorResponse(
        new AppError(
          `Invalid file type. Allowed types: PDF, DOCX, DOC, TXT`,
          'VALIDATION_ERROR',
          400
        )
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        new AppError(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          'VALIDATION_ERROR',
          400
        )
      );
    }

    // Get required metadata
    const title = formData.get('title') as string;
    const type = formData.get('type') as LegalKnowledgeType;
    const jurisdiction = formData.get('jurisdiction') as Jurisdiction;

    if (!title || !type || !jurisdiction) {
      return createErrorResponse(
        new AppError(
          'Missing required fields: title, type, jurisdiction',
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
    if (!validTypes.includes(type)) {
      return createErrorResponse(
        new AppError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 'VALIDATION_ERROR', 400)
      );
    }

    // Validate jurisdiction
    const validJurisdictions: Jurisdiction[] = [
      'KENYA_NATIONAL',
      'KENYA_NAIROBI',
      'INTERNATIONAL',
      'GENERAL'
    ];
    if (!validJurisdictions.includes(jurisdiction)) {
      return createErrorResponse(
        new AppError(
          `Invalid jurisdiction. Must be one of: ${validJurisdictions.join(', ')}`,
          'VALIDATION_ERROR',
          400
        )
      );
    }

    // Parse optional fields
    const description = formData.get('description') as string | null;
    const sourceType = formData.get('sourceType') as string | null;
    const sourceReference = formData.get('sourceReference') as string | null;
    const effectiveDateStr = formData.get('effectiveDate') as string | null;

    let practiceAreas: PracticeArea[] = [];
    const practiceAreasStr = formData.get('practiceAreas') as string | null;
    if (practiceAreasStr) {
      try {
        practiceAreas = JSON.parse(practiceAreasStr);
      } catch {
        return createErrorResponse(
          new AppError('Invalid practiceAreas format. Expected JSON array.', 'VALIDATION_ERROR', 400)
        );
      }
    }

    let tags: string[] = [];
    const tagsStr = formData.get('tags') as string | null;
    if (tagsStr) {
      try {
        tags = JSON.parse(tagsStr);
      } catch {
        return createErrorResponse(
          new AppError('Invalid tags format. Expected JSON array.', 'VALIDATION_ERROR', 400)
        );
      }
    }

    // Upload file to Vercel Blob
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `legal-knowledge/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: file.type
    });

    // Create legal knowledge entry with text extraction
    try {
      const legalKnowledge = await LegalKnowledgeService.createFromFile(
        fileBuffer,
        file.name,
        file.type,
        {
          title,
          description: description || undefined,
          type,
          jurisdiction,
          practiceAreas,
          sourceType: sourceType || undefined,
          sourceReference: sourceReference || undefined,
          effectiveDate: effectiveDateStr ? new Date(effectiveDateStr) : undefined,
          tags
        },
        blob.url,
        userId
      );

      return createCreatedResponse(
        legalKnowledge,
        'File uploaded and legal knowledge created successfully. Processing chunks in background.'
      );
    } catch (error: any) {
      // If creation fails, try to clean up the uploaded file
      console.error('Failed to create legal knowledge:', error);
      return createErrorResponse(
        new AppError(
          error.message || 'Failed to process file',
          'PROCESSING_ERROR',
          500
        )
      );
    }
  })
);
