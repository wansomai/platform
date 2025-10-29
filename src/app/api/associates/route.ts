// app/api/associates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getUserOrganizationId } from '@/lib/api/org-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true },
        { status: 401 }
      );
    }

    // ✅ Get user's organization
    const organizationId = await getUserOrganizationId(userId);

    // Parse request body
    const {
      name,
      instructions,
      steps,
      tools,
      projectIds = [] // Provide a default empty array
    } = await request.json();

    // Validate input
    if (!name || !instructions || !steps || !tools) {
      return NextResponse.json(
        { message: 'Missing required fields', error: true },
        { status: 400 }
      );
    }

    // Create associate with steps and tools in a transaction
    const associate = await prisma.$transaction(async (tx:any) => {
      // Create associate
      const newAssociate = await tx.aIAssociate.create({
        data: {
          name,
          instructions,
          organizationId,
          createdById: userId
        }
      });
      
      // Create steps
      await Promise.all(steps.map((step: { description: any; }, index: any) => 
        tx.associateStep.create({
          data: {
            associateId: newAssociate.id,
            description: step.description,
            stepOrder: index
          }
        })
      ));
      
      // Create tool associations
      await Promise.all(tools.map((toolId: any) => 
        tx.associateTool.create({
          data: {
            associateId: newAssociate.id,
            toolId
          }
        })
      ));
      
      // Link to projects if provided
      if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
        // First verify that projects belong to the user's organization
        const projects = await tx.project.findMany({
          where: {
            id: { in: projectIds.filter(Boolean) }, // Filter out null/undefined values
            organizationId: user.organizationId
          },
          select: { id: true }
        });
        
        const validProjectIds = projects.map((p: { id: any; }) => p.id);
        
        // Create project associations
        if (validProjectIds.length > 0) {
          await Promise.all(validProjectIds.map((projectId: any) => 
            tx.projectAssociate.create({
              data: {
                associateId: newAssociate.id,
                projectId
              }
            })
          ));
        }
      }
      
      return newAssociate;
    });
    
    return NextResponse.json({
      status: 201,
      message: 'AI Associate created successfully',
      data: associate
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating AI Associate:', error);
    return NextResponse.json(
      { message: 'Failed to create AI Associate', error: true },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Fetch all associates for this organization
    const associates = await prisma.aIAssociate.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        tools: true,
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        },
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Format the response
    const formattedAssociates = associates.map((associate: any) => ({
      id: associate.id,
      name: associate.name,
      instructions: associate.instructions,
      createdBy: associate.createdBy.fullName,
      createdAt: associate.createdAt.toISOString(),
      updatedAt: associate.updatedAt.toISOString(),
      steps: associate.steps.map((step: { id: any; description: any; stepOrder: any; }) => ({
        id: step.id,
        description: step.description,
        order: step.stepOrder
      })),
      tools: associate.tools.map((tool: { toolId: any; }) => tool.toolId),
      projects: associate.projects.map((pa: { project: { id: any; title: any; }; }) => ({
        id: pa.project.id,
        title: pa.project.title
      })),
      conversationsCount: associate._count.conversations
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Associates retrieved successfully',
      data: formattedAssociates
    });
  } catch (error) {
    console.error('Error fetching AI Associates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch AI Associates', error: true },
      { status: 500 }
    );
  }
}