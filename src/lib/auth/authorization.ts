// src/lib/auth-utils.ts
import { PrismaClient } from '@/prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) return false;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project || project.organizationId !== user.organizationId) {
      return false;
    }
    
    return true;
  } catch (error) {
    
    return false;
  }
}

/**
 * Gets the user ID from the request headers by extracting it from the JWT token
 * 
 * @param request - The Next.js request object
 * @returns string | null - The user ID if found, null otherwise
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Decode the JWT token (without verification for simplicity)
    // In production, you should verify the token using the secret
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c:string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Return the user ID from the payload
    return payload.userId || null;
  } catch (error) {
    
    return null;
  }
}

/**
 * Gets the projects that a user has access to
 * 
 * @param userId - The ID of the user
 * @returns Promise<string[]> - Array of project IDs the user has access to
 */
export async function getAccessibleProjectIds(userId: string): Promise<string[]> {
  try {
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user?.organizationId) return [];
    
    // Get projects where user is a direct member
    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    
    const userProjectIds = userProjects.map((p:any) => p.projectId);
    
    // Get projects from user's organization
    const orgProjects = await prisma.project.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true }
    });
    
    const orgProjectIds = orgProjects.map((p:any) => p.id);
    
    // Combine and deduplicate
    return [...new Set([...userProjectIds, ...orgProjectIds])];
  } catch (error) {
    
    return [];
  }
}