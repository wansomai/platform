// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { canCreateProject } from "@/lib/subscription";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";

// Get all projects (filtered by user access)
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');

  // ✅ Use helper to get active organization ID
  const currentOrgId = await getActiveOrganizationId(userId);

  // Get all projects where:
  // 1. Project belongs to user's current organization
  // 2. User is a member of the project
  const projects = await prisma.project.findMany({
    where: {
      organizationId: currentOrgId,
      OR: [
        { members: { some: { userId: userId } } },
        { visibility: 'organization' }
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          conversations: true,
          projectDocuments: true
        }
      }
    }
  });

  const formattedProjects = projects.map((project:any) => ({
    id: project.id,
    title: project.title,
    description: project.description || '',
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    messagesCount: project._count.conversations,
    documentsCount: project._count.projectDocuments,
  }));

  return NextResponse.json({
    status: 200,
    message: 'Projects retrieved successfully',
    data: formattedProjects
  });
}));

// Create a new project
export const POST = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const body = await request.json();
  const { title, description, organizationId } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Project title is required" },
      { status: 400 }
    );
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 }
    );
  }

  // Verify that the organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Invalid organization ID" },
      { status: 400 }
    );
  }

  // ✅ Verify user belongs to the organization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      activeOrganizationId: true  // Also get active org for switching support
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }


  // Check if this is the user's primary organization OR active organization
  const isPrimaryOrg = user.organizationId === organizationId;
  const isActiveOrg = user.activeOrganizationId === organizationId;

  // If not primary or active org, check if user is a member via UserOrganization
  if (!isPrimaryOrg && !isActiveOrg) {
    const membership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to create projects in this organization" },
        { status: 403 }
      );
    }
  }

  // Check subscription limits before creating project
  const projectLimitCheck = await canCreateProject(organizationId);
  if (!projectLimitCheck.allowed) {
    return NextResponse.json(
      {
        error: projectLimitCheck.reason,
        requiresUpgrade: true
      },
      { status: 403 }
    );
  }

  // Use a transaction to ensure both project and conversation are created together
  const result = await prisma.$transaction(async (tx) => {
    // Create new project
    const project = await tx.project.create({
      data: {
        title,
        description,
        status: 'active',
        visibility: 'restricted',
        organizationId: organizationId,
        // Add the creating user as a project member with admin role
        members: {
          create: {
            userId: userId,
            role: 'admin'
          }
        }
      },
      include: {
        _count: {
          select: {
            documents: true,
            members: true,
          },
        },
      },
    });

    // Create the initial conversation for this project
    const conversation = await tx.conversation.create({
      data: {
        title: `${title} Discussion`,
        projectId: project.id,
        isPinned: false
      }
    });

    return { project, conversation };
  });

  // Transform project for response
  const transformedProject = {
    id: result.project.id,
    title: result.project.title,
    description: result.project.description,
    status: result.project.status,
    createdAt: result.project.createdAt,
    updatedAt: result.project.updatedAt,
    documents_count: result.project._count.documents,
    team_count: result.project._count.members,
    messages_count: 0, // New project, no messages yet
    last_activity: new Date(result.project.updatedAt).toLocaleDateString(),
    // Include conversation info for immediate use
    conversationId: result.conversation.id,
    conversationTitle: result.conversation.title
  };

  return NextResponse.json({
    status: 201,
    message: "Project and conversation created successfully",
    data: transformedProject
  });
}));