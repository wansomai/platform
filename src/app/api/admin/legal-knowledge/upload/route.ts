import { NextRequest } from 'next/server';
import { blobStorageService } from '@/lib/storage';
import { withAdminAuth } from '@/lib/auth/admin-middleware';
import { withErrorHandler } from '@/lib/api/middleware';
import { createCreatedResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';
import { LegalKnowledgeService } from '@/services/legalKnowledgeService';
import { classifyLegalDocument } from '@/services/legalClassificationService';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import type { PracticeArea } from '@/prisma/client';

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
 * Simplified form data:
 * - file: File (required)
 * - title: string (required)
 *
 * The AI will automatically classify:
 * - type (TEMPLATE, CASE_LAW, STATUTE, etc.)
 * - jurisdiction
 * - practiceAreas
 * - tags
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

    // Get title (only required field now)
    const title = formData.get('title') as string;
    if (!title) {
      return createErrorResponse(
        new AppError('Title is required', 'VALIDATION_ERROR', 400)
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `legal-knowledge/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const fileUrl = await blobStorageService.uploadFile(fileBuffer, fileName, file.type);

    // Extract text first (needed for classification)
    let extractedText: string;
    try {
      extractedText = await LegalKnowledgeService.extractText(fileBuffer, file.type);
      if (!extractedText || extractedText.trim().length === 0) {
        return createErrorResponse(
          new AppError('Could not extract text from file', 'PROCESSING_ERROR', 400)
        );
      }
    } catch (error: any) {
      console.error('Text extraction failed:', error);
      return createErrorResponse(
        new AppError(
          error.message || 'Failed to extract text from file',
          'PROCESSING_ERROR',
          500
        )
      );
    }

    // AI classification (defaults used if classification fails)
    let classification: {
      type: LegalKnowledgeType;
      jurisdiction: Jurisdiction;
      practiceAreas: PracticeArea[];
      tags: string[];
    } = {
      type: 'TEMPLATE',
      jurisdiction: 'GENERAL',
      practiceAreas: [],
      tags: []
    };

    try {
      const aiClassification = await classifyLegalDocument(title, extractedText);
      classification = {
        type: aiClassification.type,
        jurisdiction: aiClassification.jurisdiction,
        practiceAreas: aiClassification.practiceAreas,
        tags: aiClassification.tags
      };
      console.log('AI classification result:', classification);
    } catch (error) {
      console.error('AI classification failed, using defaults:', error);
      // Continue with defaults
    }

    // Create legal knowledge entry
    try {
      const legalKnowledge = await LegalKnowledgeService.createFromFile(
        fileBuffer,
        file.name,
        file.type,
        {
          title,
          type: classification.type,
          jurisdiction: classification.jurisdiction,
          practiceAreas: classification.practiceAreas,
          tags: classification.tags
        },
        fileUrl,
        userId
      );

      return createCreatedResponse(
        legalKnowledge,
        'File uploaded successfully. AI classification complete. Processing chunks in background.'
      );
    } catch (error: any) {
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
