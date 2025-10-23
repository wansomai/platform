import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth/auth-options';
import { PrismaClient } from '@/prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/organization/members/available?projectId=[id]
 * Get organization members who are NOT yet in a specific project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    // Get all organization members from UserOrganization table (invited members)
    const orgMemberships = await prisma.userOrganization.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    // Extract users from memberships
    const orgMembers = orgMemberships.map(membership => membership.user);

    // If projectId is provided, filter out members already in the project
    let availableMembers = orgMembers;

    if (projectId) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true }
      });

      const projectMemberIds = new Set(projectMembers.map(m => m.userId));

      availableMembers = orgMembers.filter(member => !projectMemberIds.has(member.id));
    }

    // Format response
    const formattedMembers = availableMembers.map(member => ({
      id: member.id,
      name: member.fullName || member.email || 'Unknown User',
      email: member.email,
      orgRole: member.role
    }));

    return NextResponse.json({
      members: formattedMembers,
      count: formattedMembers.length
    });

  } catch (error) {
    console.error('Error fetching available members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available members' },
      { status: 500 }
    );
  }
}
