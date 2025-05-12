// src/app/api/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';

// Schema for organization creation
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name is too long")
});

// Create a new organization
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
    const { name } = createOrganizationSchema.parse(body);
    
    // Create the organization and user membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the organization
      const organization = await tx.organization.create({
        data: { name }
      });
      
      // Create a membership (owner role)
      await tx.userOrganization.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'owner'
        }
      });
      
      // Update the user's active organization
      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: organization.id }
      });
      
      return {
        id: organization.id,
        name: organization.name,
        role: 'owner',
        isActive: true,
        joinedAt: new Date().toISOString()
      };
    });
    
    return NextResponse.json({
      status: 201,
      message: 'Organization created successfully',
      data: result
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid organization data', errors: error.errors, error: true },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to create organization', error: true },
      { status: 500 }
    );
  }
}

// Get all organizations the user belongs to
export async function GET(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get the user with their active organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        activeOrganizationId: true,
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Format the organizations for response
    const organizations = user.organizationMemberships.map(membership => ({
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      isActive: membership.organization.id === user.activeOrganizationId,
      joinedAt: membership.joinedAt.toISOString()
    }));
    
    // Sort organizations with active one first, then alphabetically
    organizations.sort((a, b) => {
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Organizations retrieved successfully',
      data: organizations
    });
  } catch (error) {
    console.error('Error retrieving organizations:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve organizations', error: true },
      { status: 500 }
    );
  }
}