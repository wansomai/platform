// src/app/api/organizations/switch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';

// Validation schema for organization switching
const switchSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required")
});

// Switch to another organization
export async function POST(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const { organizationId } = switchSchema.parse(body);
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        organizationId: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if the user belongs to this organization
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId
        }
      }
    });
    
    if (!membership) {
      // Check if we need to create a membership first
      // This handles cases where a user was invited directly via their email
      // but hasn't accepted the invitation yet
      const invitations = await prisma.invitation.findMany({
        where: {
          email: user.email,
          organizationId,
          expiresAt: { gt: new Date() } // Active invitations only
        }
      });
      
      if (invitations.length > 0) {
        // Create membership with the most privileged role from invitations
        const roles = invitations.map(inv => inv.role);
        const roleHierarchy = { owner: 3, admin: 2, manager: 1, member: 0 };
        let highestRole = 'member';
        
        for (const role of roles) {
          if ((roleHierarchy[role as keyof typeof roleHierarchy] || 0) > 
              (roleHierarchy[highestRole as keyof typeof roleHierarchy] || 0)) {
            highestRole = role;
          }
        }
        
        // Create the membership
        await prisma.userOrganization.create({
          data: {
            userId,
            organizationId,
            role: highestRole
          }
        });
        
        // Delete the invitations
        await prisma.invitation.deleteMany({
          where: {
            email: user.email,
            organizationId
          }
        });
      } else {
        return NextResponse.json(
          { message: 'You do not have access to this organization', error: true }, 
          { status: 403 }
        );
      }
    }
    
    // Update the user's active organization
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Organization switched successfully',
      data: {
        organizationId,
        organizationName: organization.name
      }
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors, error: true },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to switch organization', error: true },
      { status: 500 }
    );
  }
}