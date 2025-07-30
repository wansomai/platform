// lib/api/validation.ts
import { AppError } from '@/types/error';
import { z } from 'zod';

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        error.errors
      );
    }
    throw error;
  }
}

// Common validation schemas
export const schemas = {
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  }),
  
  documentFilters: z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    sort: z.enum(['recent', 'oldest', 'name', 'size']).default('recent'),
    folder: z.string().nullable().optional(),
    category: z.string().optional(),
  }),
  
  projectCreate: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    organizationId: z.string().min(1, 'Organization ID is required'),
  }),
  
  conversationCreate: z.object({
    title: z.string().min(1, 'Title is required'),
  }),
  
  messageCreate: z.object({
    content: z.string().min(1, 'Message content is required'),
    metadata: z.record(z.any()).optional(),
  }),
};