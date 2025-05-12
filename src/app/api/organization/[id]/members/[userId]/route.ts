// src/app/api/organizations/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';

// Validation schema for role update
const roleUpdateSchema = z.object({
  role: z.string().refine(role => ['admin', 'manager', 'member'].includes(role.toLowerCase()), {
    message: "Role must be one of: admin, manager, member"
  })
});

// Update a member's role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: organizationId, userId: memberIdToUpdate } = await params;
    
    // Get user ID from token
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify current user is an admin of this organization
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { organizationId: true, role: true }
    });
    
    if (!currentUser || currentUser.organizationId !== organizationId) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Only admins can update roles
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      return NextResponse.json(
        { message: 'Only admins can update member roles', error: true }, 
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate role
    const { role } = roleUpdateSchema.parse(body);
    
    // User can't change their own role (to prevent accidentally removing admin access)
    if (currentUserId === memberIdToUpdate) {
      return NextResponse.json(
        { message: 'Cannot change your own role', error: true }, 
        { status: 400 }
      );
    }
    
    // Update user role
    const updatedUser = await prisma.user.update({
      where: {
        id: memberIdToUpdate,
        organizationId // Ensure user belongs to this organization
      },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Member role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid role', errors: error.errors, error: true },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to update member role', error: true },
      { status: 500 }
    );
  }
}

// Remove a member from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: organizationId, userId: memberIdToRemove } = await params;
    
    // Get user ID from token
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify current user is an admin of this organization
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { organizationId: true, role: true }
    });
    
    if (!currentUser || currentUser.organizationId !== organizationId) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Only admins can remove members
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      return NextResponse.json(
        { message: 'Only admins can remove members', error: true }, 
        { status: 403 }
      );
    }
    
    // User can't remove themselves
    if (currentUserId === memberIdToRemove) {
      return NextResponse.json(
        { message: 'Cannot remove yourself from organization', error: true }, 
        { status: 400 }
      );
    }
    
    // Check if the user to remove exists and belongs to this organization
    const userToRemove = await prisma.user.findUnique({
      where: {
        id: memberIdToRemove,
        organizationId
      }
    });
    
    if (!userToRemove) {
      return NextResponse.json(
        { message: 'Member not found in this organization', error: true }, 
        { status: 404 }
      );
    }
    
    // Cannot remove organization owner
    if (userToRemove.role === 'owner') {
      return NextResponse.json(
        { message: 'Cannot remove organization owner', error: true }, 
        { status: 403 }
      );
    }
    
    // First, remove the user from all projects in the organization
    await prisma.projectMember.deleteMany({
      where: {
        userId: memberIdToRemove,
        project: {
          organizationId
        }
      }
    });
    
    // Create a new organization for the removed user
    const newOrganization = await prisma.organization.create({
      data: {
        name: `${userToRemove.fullName || userToRemove.email}'s Organization`,
      }
    });
    
    // Update the user to belong to the new organization with owner role
    await prisma.user.update({
      where: { id: memberIdToRemove },
      data: {
        organizationId: newOrganization.id,
        role: 'owner'
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Member removed from organization successfully'
    });
  } catch (error) {
    console.error('Error removing member from organization:', error);
    return NextResponse.json(
      { message: 'Failed to remove member from organization', error: true },
      { status: 500 }
    );
  }
}