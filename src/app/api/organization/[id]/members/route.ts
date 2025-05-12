// src/app/api/organizations/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// Get all members of an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify user belongs to this organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user || user.organizationId !== organizationId) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Get organization members
    const members = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Format response data
    const formattedMembers = members.map(member => ({
      id: member.id,
      email: member.email,
      fullName: member.fullName,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
      isRegistered: member.accounts.length > 0
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Organization members retrieved successfully',
      data: formattedMembers
    });
  } catch (error) {
    console.error('Error retrieving organization members:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve organization members', error: true },
      { status: 500 }
    );
  }
}