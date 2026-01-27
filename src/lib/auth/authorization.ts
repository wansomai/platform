// src/lib/auth/authorization.ts
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import * as jose from 'jose';

/**
 * Gets the JWT secret for token verification
 * @throws Error if NEXTAUTH_SECRET is not configured
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Checks if a user has access to a specific project
 * Access is granted if:
 * 1. User is a member of the project team
 * 2. User belongs to the organization that owns the project
 *
 * @param projectId - The ID of the project to check access for
 * @param userId - The ID of the user requesting access
 * @returns boolean - True if the user has access, false otherwise
 */
export async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  try {
    // Check if user is a direct member of the project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (projectMember) return true;

    // If not a direct member, check if user belongs to the project's organization
    const [user, project] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      }),
      prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
      })
    ]);

    if (!user || !project || project.organizationId !== user.organizationId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[checkProjectAccess] Error:', error);
    return false;
  }
}

/**
 * Verifies and extracts the user ID from the JWT token in the request
 * Uses proper cryptographic verification of the token signature
 *
 * @param request - The Next.js request object
 * @returns string | null - The user ID if token is valid, null otherwise
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT signature and decode the payload
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);

    // Return the user ID from the verified payload
    return (payload.userId as string) || null;
  } catch (error) {
    // Token verification failed (invalid signature, expired, etc.)
    return null;
  }
}

