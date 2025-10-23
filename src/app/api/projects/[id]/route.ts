// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { checkProjectAccess } from '@/lib/auth/authorization'
import { withAuth, withErrorHandler } from '@/lib/api/middleware'

const prisma = new PrismaClient()

// Schema validation
const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'on hold']).optional()
})

// GET handler - Get project by ID
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to access this project' },
      { status: 403 }
    );
  }
    
  // Get query parameters for workspace data customization
  const { searchParams } = new URL(request.url);

  // Check if this is a workspace request
  const isWorkspaceRequest = searchParams.get('workspace') === 'true';
  const includeMessages = searchParams.get('include_messages') === 'true';
  const messageLimit = Math.min(parseInt(searchParams.get('message_limit') || '50'), 100);
  const includeDocuments = searchParams.get('include_documents') === 'true';
  const includeSettings = searchParams.get('include_settings') === 'true';
  if (isWorkspaceRequest) {
  // Enhanced workspace response - load everything in parallel with optimized queries
  const [project, conversations, projectDocuments] = await Promise.all([
    // Get basic project info with minimal relations
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    }),
    
    // Get conversations with messages if requested - optimized query
    includeMessages ? prisma.conversation.findMany({
      where: { projectId: projectId },
      select: {
        id: true,
        title: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: messageLimit,
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
            metadata: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 1, // Get the most recent conversation only
    }) : Promise.resolve([]),
    
    // Get project documents if requested - optimized query
    includeDocuments ? prisma.projectDocument.findMany({
      where: { project_id: projectId },
      select: {
        added_at: true,
        document: {
          select: {
            id: true,
            title: true,
            description: true,
            file_url: true,
            file_type: true,
            file_size: true,
            created_at: true,
            createdByUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      },
      take: 50, // Limit documents for performance
    }) : Promise.resolve([]),
    
    // Removed: knowledgeBase promise (no longer loading settings/instructions)
  ]);
  
  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }
  
  // Get the most recent conversation and its messages
  const currentConversation = conversations[0] || null;
  const messages = currentConversation?.messages || [];
  
  // Format workspace response
  const workspaceData = {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      organization: project.organization,
    },
    
    // Current conversation info
    currentConversation: currentConversation ? {
      id: currentConversation.id,
      title: currentConversation.title,
      isPinned: currentConversation.isPinned,
      createdAt: currentConversation.createdAt.toISOString(),
      updatedAt: currentConversation.updatedAt.toISOString(),
    } : null,
    
    // Messages from current conversation
    ...(includeMessages && {
      messages: messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        timestamp: message.createdAt.toISOString(),
        metadata: message.metadata || {},
        user: message.user,
      })).reverse() // Reverse to show oldest first
    }),
    
    // Project documents (keeping original working structure)
    ...(includeDocuments && {
      documents: projectDocuments.map(pd => ({
        id: pd.document.id,
        title: pd.document.title,
        description: pd.document.description,
        fileUrl: pd.document.file_url,
        fileType: pd.document.file_type,
        fileSize: pd.document.file_size,
        createdBy: pd.document.createdByUser,
        createdAt: pd.document.created_at.toISOString(),
        addedAt: pd.added_at.toISOString(),
        addedBy: pd.user,
      }))
    }),
    
    // Removed: settings section (was loading from knowledgeBase)
    
    // Metadata
    meta: {
      loadedAt: new Date().toISOString(),
      includes: {
        messages: includeMessages,
        documents: includeDocuments,
        settings: false, // No longer included
      },
      counts: {
        messages: includeMessages ? messages.length : null,
        documents: includeDocuments ? projectDocuments.length : null,
        conversations: conversations.length,
      }
    }
  };
  
  return NextResponse.json({
    status: 200,
    message: 'Workspace loaded successfully',
    data: workspaceData
  });
} else {
      // Basic project response (existing behavior)
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
      
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: 'Project retrieved successfully',
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        organization: project.organization,
      }
    });
  }
}));

// PUT handler - Update project
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to update this project' },
      { status: 403 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const { title, description, status } = updateProjectSchema.parse(body);

  // Update project
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status })
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          members: true,
          documents: true
        }
      }
    }
  });

  // Get message count
  const messageCount = await prisma.message.count({
    where: {
      conversation: {
        projectId
      }
    }
  });

  // Format for response
  const formattedProject = {
    id: updatedProject.id,
    title: updatedProject.title,
    description: updatedProject.description,
    status: updatedProject.status,
    created_at: updatedProject.createdAt.toISOString(),
    team_count: updatedProject._count?.members || 0,
    documents_count: updatedProject._count?.documents || 0,
    messages_count: messageCount || 0,
    last_activity: updatedProject.updatedAt.toISOString()
  };

  return NextResponse.json({
    status: 200,
    message: 'Project updated successfully',
    data: formattedProject
  });
}));

// DELETE handler - Delete project
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // For deletion, we need to check if the user has admin rights
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  // Only allow deletion if user is an admin
  if (!projectMember || projectMember.role !== 'admin') {
    return NextResponse.json(
      { error: 'You do not have permission to delete this project' },
      { status: 403 }
    );
  }

  // Delete project (with cascading deletes for related entities)
  await prisma.project.delete({
    where: { id: projectId }
  });

  return NextResponse.json({
    status: 200,
    message: 'Project deleted successfully'
  });
}));