// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all projects
export async function GET(request: NextRequest) {
  try {
    // Fetch all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            documents: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform the projects to include document and member counts
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      documents_count: project._count.documents,
      team_count: project._count.members,
      last_activity: new Date(project.updatedAt).toLocaleDateString()
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Error fetching projects" },
      { status: 500 }
    );
  }
}

// Create a new project
export async function POST(request: NextRequest) {
  try {
    // Get project data from request body
    const body = await request.json();
    console.log("Request body:", body);
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

    // Create new project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: 'active',
        organizationId: organizationId
        
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