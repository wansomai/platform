import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth/authorization";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

const prisma = new PrismaClient();

// Get organization members
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  const members = await prisma.userOrganization.findMany({
    where: {
      organizationId: user.organizationId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      joinedAt: 'desc'
    }
  });

  const formattedMembers = members.map(member => ({
    id: member.user.id,
    name: member.user.fullName || member.user.email,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt.toISOString()
  }));

  return NextResponse.json({ members: formattedMembers });
}));

// Remove a member from organization
export const DELETE = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { memberId } = await request.json();

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Check if current user has permission to remove members
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Prevent removing yourself
  if (memberId === userId) {
    return NextResponse.json(
      { error: 'Cannot remove yourself from the organization' },
      { status: 400 }
    );
  }

  // Remove the user from the organization
  await prisma.userOrganization.delete({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: currentUser.organizationId
      }
    }
  });

  return NextResponse.json({ success: true });
}));