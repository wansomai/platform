// app/api/projects/[id]/associates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// GET - List associates for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Get the project's organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Find associates connected to this project through ProjectAssociate
    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            },
            tools: true,
            createdBy: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });
    
    // Find organization-wide associates not already linked to this project
    const orgAssociates = await prisma.aIAssociate.findMany({
      where: {
        organizationId: project.organizationId,
        projects: {
          none: {
            projectId
          }
        }
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        tools: true,
        createdBy: {
          select: {
            fullName: true
          }
        }
      }
    });
    
    // Format project associates
    const formattedProjectAssociates = projectAssociates.map(pa => ({
      id: pa.associate.id,
      name: pa.associate.name,
      instructions: pa.associate.instructions,
      createdBy: pa.associate.createdBy.fullName,
      createdAt: pa.associate.createdAt.toISOString(),
      updatedAt: pa.associate.updatedAt.toISOString(),
      addedToProject: pa.addedAt.toISOString(),
      steps: pa.associate.steps.map(step => ({
        id: step.id,
        description: step.description,
        order: step.stepOrder
      })),
      tools: pa.associate.tools.map(tool => tool.toolId),
      linkedToProject: true
    }));
    
    // Format org-wide associates
    const formattedOrgAssociates = orgAssociates.map(associate => ({
      id: associate.id,
      name: associate.name,
      instructions: associate.instructions,
      createdBy: associate.createdBy.fullName,
      createdAt: associate.createdAt.toISOString(),
      updatedAt: associate.updatedAt.toISOString(),
      steps: associate.steps.map(step => ({
        id: step.id,
        description: step.description,
        order: step.stepOrder
      })),
      tools: associate.tools.map(tool => tool.toolId),
      linkedToProject: false
    }));
    
    // Combine both sets
    const allAssociates = [...formattedProjectAssociates, ...formattedOrgAssociates];
    
    return NextResponse.json({
      status: 200,
      message: 'Associates retrieved successfully',
      data: allAssociates
    });
  } catch (error) {
    console.error('Error fetching AI Associates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch AI Associates', error: true },
      { status: 500 }
    );
  }
}

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  // First check if user is a project member
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
  
  if (projectMember) return true;
  
  // If not a direct member, check if user belongs to the organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });
  
  if (!project) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });
  
  return user?.organizationId === project.organizationId;
}