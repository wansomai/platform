// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth/authorization";

const prisma = new PrismaClient();

// Get all projects (filtered by user access)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { status: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user?.organizationId) {
      return NextResponse.json(
        { status: 404, message: 'User organization not found' },
        { status: 404 }
      );
    }
    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        members: {
          some: { userId: userId }
        }
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
    const formattedProjects = projects.map(project => ({
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
    
  } catch (error) {
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new project
export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get project data from request body
    const body = await request.json();
 
    const { title, description, organizationId } = body;

    if (!title) {
      return NextResponse.json(
        { status: 400, message: "Project title is required" },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { status: 400, message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Verify that the organization exists
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId
      }
    });

    if (!organization) {
      return NextResponse.json(
        { status: 400, message: "Invalid organization ID" },
        { status: 400 }
      );
    }
    
    // Verify user belongs to the organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });


    
    if (!user || user.organizationId !== organizationId) {
      return NextResponse.json(
        { status: 403, message: "You don't have permission to create projects in this organization" },
        { status: 403 }
      );
    }

    // Create new project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: 'active',
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

    // Transform project for response
    const transformedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      documents_count: project._count.documents,
      team_count: project._count.members,
      last_activity: new Date(project.updatedAt).toLocaleDateString()
    };

    return NextResponse.json({
      status: 201,
      message: "Project created successfully",
      data: transformedProject
    });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { 
        status: 500, 
        message: error.message || "Failed to create project. Please try again.",
        error: true
      },
      { status: 500 }
    );
  }
}