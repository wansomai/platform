import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { checkProjectAccess } from '@/lib/auth/authorization';

const prisma = new PrismaClient();

/**
 * POST /api/projects/[id]/members/add
 * Add an existing organization member to a project
 */
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;
  const { memberId, role = 'member' } = await request.json();

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }

  // Validate role
  if (!['admin', 'member'].includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be admin or member' },
      { status: 400 }
    );
  }

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have access to this project' },
      { status: 403 }
    );
  }

  // Get current user's organization
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Verify the member to be added belongs to the same organization
  // Check in UserOrganization table (for invited members)
  const membershipCheck = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: currentUser.organizationId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  if (!membershipCheck) {
    return NextResponse.json(
      { error: 'Member does not belong to your organization' },
      { status: 403 }
    );
  }

  const memberToAdd = membershipCheck.user;

  // Check if member is already in the project
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId: projectId
      }
    }
  });

  if (existingMember) {
    return NextResponse.json(
      { error: 'Member is already in this project' },
      { status: 400 }
    );
  }

  // Add member to project
  const projectMember = await prisma.projectMember.create({
    data: {
      userId: memberId,
      projectId: projectId,
      role: role
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Member added to project successfully',
    member: {
      id: `${projectMember.userId}-${projectMember.projectId}`,
      userId: projectMember.userId,
      name: memberToAdd.fullName || memberToAdd.email || 'Unknown User',
      email: memberToAdd.email,
      role: projectMember.role,
      joinedAt: projectMember.createdAt.toISOString()
    }
  });
}));
