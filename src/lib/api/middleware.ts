// lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from './response';
import { AppError } from '@/types/error';
import { getUserIdFromRequest, checkProjectAccess } from '../auth/authorization';
import { getActiveOrganizationId } from '../api/org-helpers';
import { hasOrganizationPermission } from '../auth/permissions';
import { OrganizationPermissionType } from '../constants/permissions';

// Re-export for convenience
export { OrganizationPermission } from '../constants/permissions';

/**
 * Error handler middleware - wraps handlers with try/catch and standardized error responses
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[API Error]:', error);

      if (error instanceof AppError) {
        return createErrorResponse(error);
      }

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error'
      );
    }
  };
}

/**
 * Authentication middleware - verifies JWT and extracts userId
 */
export function withAuth(
  handler: (request: NextRequest, userId: string, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // getUserIdFromRequest is async and verifies the JWT signature
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return createErrorResponse(
        new AppError('Authentication required', 'AUTH_REQUIRED', 401)
      );
    }

    return handler(request, userId, ...args);
  };
}

/**
 * Context passed to project-scoped handlers
 */
export interface ProjectContext {
  userId: string;
  projectId: string;
}

/**
 * Project access middleware - combines auth + project access check
 * Automatically extracts projectId from route params and verifies access
 *
 * Usage:
 * export const GET = withErrorHandler(
 *   withProjectAccess(async (request, context) => {
 *     const { userId, projectId } = context;
 *     // ... handler logic
 *   })
 * );
 */
export function withProjectAccess(
  handler: (
    request: NextRequest,
    context: ProjectContext,
    params: any
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> => {
    // Verify authentication
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return createErrorResponse(
        new AppError('Authentication required', 'AUTH_REQUIRED', 401)
      );
    }

    // Extract projectId from params
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    if (!projectId) {
      return createErrorResponse(
        new AppError('Project ID is required', 'MISSING_PROJECT_ID', 400)
      );
    }

    // Verify project access
    const hasAccess = await checkProjectAccess(projectId, userId);

    if (!hasAccess) {
      return createErrorResponse(
        new AppError('Access denied to this project', 'PROJECT_ACCESS_DENIED', 403)
      );
    }

    return handler(request, { userId, projectId }, resolvedParams);
  };
}

/**
 * Context passed to organization-scoped handlers
 */
export interface OrganizationContext {
  userId: string;
  organizationId: string;
}

/**
 * Organization access middleware - combines auth + organization permission check
 * Automatically gets the user's active organization and verifies permission
 *
 * Usage:
 * export const GET = withErrorHandler(
 *   withOrganizationAccess(OrganizationPermission.VIEW_MEMBERS, async (request, context) => {
 *     const { userId, organizationId } = context;
 *     // ... handler logic
 *   })
 * );
 */
export function withOrganizationAccess(
  permission: OrganizationPermissionType,
  handler: (
    request: NextRequest,
    context: OrganizationContext
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Verify authentication
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return createErrorResponse(
        new AppError('Authentication required', 'AUTH_REQUIRED', 401)
      );
    }

    // Get the user's active organization
    const organizationId = await getActiveOrganizationId(userId);

    if (!organizationId) {
      return createErrorResponse(
        new AppError('No active organization found', 'NO_ORGANIZATION', 400)
      );
    }

    // Verify organization permission
    const hasPermission = await hasOrganizationPermission(
      userId,
      organizationId,
      permission
    );

    if (!hasPermission) {
      return createErrorResponse(
        new AppError('Insufficient permissions', 'PERMISSION_DENIED', 403)
      );
    }

    return handler(request, { userId, organizationId });
  };
}

/**
 * Combine multiple middlewares
 * Applies middlewares in order (left to right)
 */
export function composeMiddleware<T extends any[]>(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: (...args: T) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}