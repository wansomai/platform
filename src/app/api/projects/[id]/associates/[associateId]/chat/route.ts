// app/api/projects/[id]/associates/[associateId]/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, associateId: string }> }
) {
  try {
    const { id: projectId, associateId } = (await params);
    
    // Get user ID
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Get the query from request body
    const { query, conversationId } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { message: 'Query is required', error: true }, 
        { status: 400 }
      );
    }
    
    // Get associate with steps and tools
    const associate = await prisma.aIAssociate.findFirst({
      where: {
        id: associateId,
        OR: [
          // Associate directly linked to this project
          { 
            projects: {
              some: { projectId }
            }
          },
          // Organization-wide associate
          {
            organization: {
              projects: {
                some: { id: projectId }
              }
            },
            projects: { none: {} }
          }
        ]
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        tools: true
      }
    });
    
    if (!associate) {
      return NextResponse.json(
        { message: 'Associate not found or not available for this project', error: true }, 
        { status: 404 }
      );
    }
    
    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          projectId // Ensure the conversation belongs to this project
        }
      });
      
      if (!conversation) {
        return NextResponse.json(
          { message: 'Conversation not found', error: true }, 
          { status: 404 }
        );
      }
      
      // Add the user message to the existing conversation
      await prisma.message.create({
        data: {
          conversationId,
          content: query,
          role: 'user',
          userId
        }
      });
    } else {
      // Create new conversation linked to the associate
      conversation = await prisma.conversation.create({
        data: {
          title: `Chat with ${associate.name}`,
          projectId,
          aiAssociateId: associate.id,
          messages: {
            create: {
              content: query,
              role: 'user',
              userId
            }
          }
        }
      });
    }
    
    // Format steps and tools for the AI prompt
    const stepsText = associate.steps.map((step, idx) => 
      `${idx + 1}. ${step.description}`
    ).join('\n');
    
    const toolsText = associate.tools.map(tool => 
      tool.toolId === 'documentSearch' ? 'Document Search: Search through workspace documents' :
      tool.toolId === 'webSearch' ? 'Web Search: Search the internet for information' :
      `Tool: ${tool.toolId}`
    ).join('\n');
    
    // If document search is enabled, get project documents for context
    let documentContext = '';
    if (associate.tools.some(tool => tool.toolId === 'documentSearch')) {
      // Get attached documents for this project with their content
      const projectDocuments = await prisma.projectDocument.findMany({
        where: { project_id: projectId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              content: {
                select: { content: true }
              }
            }
          }
        },
        take: 5 // Limit to 5 most recent documents for performance
      });
      
      // Format document context
      documentContext = projectDocuments
        .filter(doc => doc.document.content?.content)
        .map(doc => (
          `Document: ${doc.document.title}\n` +
          `ID: ${doc.document.id}\n` +
          `Excerpt: ${doc.document.content?.content.substring(0, 300)}...\n\n`
        ))
        .join('');
    }
    
    // Create system prompt
    const systemPrompt = `You are ${associate.name}, a specialized AI legal assistant. Follow these instructions carefully:

${associate.instructions}

Follow these steps when processing requests:
${stepsText}

You have access to these tools:
${toolsText}

${documentContext ? `Project Document Context:\n${documentContext}` : ''}

Always maintain a professional, helpful tone and explain your reasoning clearly.`;

    // Get message history
    let messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20 // Limit to last 20 messages
    });
    
    // Prepare conversation history for OpenAI
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
    
    // Add system message at the beginning
    conversationHistory.unshift({
      role: 'assistant' as const,
      content: systemPrompt
    });
    
    try {
      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo", // Or your preferred model
        messages: conversationHistory,
        max_tokens: 2000
      });
      
      // Store the AI response in the database
      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.",
          role: 'assistant'
        }
      });
      
      // Update the conversation's associate link if not already set
      if (!conversation.aiAssociateId) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { aiAssociateId: associate.id }
        });
      }
      
      return NextResponse.json({
        status: 200,
        message: 'Response generated successfully',
        data: {
          message: aiMessage.content,
          conversationId: conversation.id,
          messageId: aiMessage.id,
          timestamp: aiMessage.createdAt.toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Save error message to conversation for continuity
      const errorMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: "I apologize, but I encountered an error while processing your request. Please try again.",
          role: 'assistant'
        }
      });
      
      return NextResponse.json(
        { 
          status: 500,
          message: 'Error generating response',
          data: {
            message: errorMessage.content,
            conversationId: conversation.id,
            messageId: errorMessage.id,
            timestamp: errorMessage.createdAt.toISOString(),
            error: true
          }
        },
        { status: 200 } // Return 200 even with error for continuity
      );
    }
  } catch (error) {
    console.error('Error processing chat with associate:', error);
    return NextResponse.json(
      { message: 'Failed to process query', error: true },
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