// src/app/api/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';

// Get invitation details by token
export async function GET(request: NextRequest) {
  try {
    // Validate token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token || !z.string().uuid().safeParse(token).success) {
      return NextResponse.json(
        { message: 'Invalid token format', error: true }, 
        { status: 400 }
      );
    }
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get current user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
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
    
    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'This invitation has expired', error: true }, 
        { status: 400 }
      );
    }
    
    // Format response with additional info
    const response = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      invitedById: invitation.invitedById,
      invitedByName: invitation.invitedBy.fullName || invitation.invitedBy.email,
      expiresAt: invitation.expiresAt.toISOString(),
      // Add info about user's current organization if different
      currentOrganization: user.organizationId !== invitation.organizationId
        ? user.organization?.name
        : null
    };
    
    return NextResponse.json({
      status: 200,
      message: 'Invitation details retrieved successfully',
      data: response
    });
  } catch (error) {
    console.error('Error retrieving invitation details:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve invitation details', error: true },
      { status: 500 }
    );
  }
}