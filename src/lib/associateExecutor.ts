// src/lib/associateExecutor.ts
// Executes AI Associate function calls

import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { findAssociateByFunctionName } from './associateTools';
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

/**
 * Execute an AI Associate function call
 */
export async function executeAssociateCall(
  functionCall: any,
  projectId: string,
  project: any,
  conversationDocuments: any[],
  recentMessages: string[],
  streamCallback?: (event: any) => void,
  userId?: string
): Promise<any> {
  try {
    const { query, context } = functionCall.args as any;

    if (!query) {
      return { error: 'Query is required for associate call' };
    }

    // Extract function name and find the associate
    const functionName = functionCall.name;

    if (streamCallback) {
      streamCallback({
        type: 'status',
        status: 'processing',
        message: `Finding specialized associate...`,
        conversationId: projectId
      });
    }

    // Find the associate by reverse-engineering the function name
    const associate = await findAssociateByFunctionName(functionName, projectId);

    if (!associate) {
      return {
        error: 'Associate not found or not assigned to this project',
        message: 'The requested AI associate could not be found. Please ensure the associate is assigned to this project and is active.'
      };
    }

    if (streamCallback) {
      streamCallback({
        type: 'status',
        status: 'processing',
        message: `Consulting ${associate.name}...`,
        conversationId: projectId
      });
    }

    // Load associate's knowledgebase documents
    let knowledgeBaseContent = '';
    if (associate.knowledgeBase && associate.knowledgeBase.length > 0) {
      const kbDocuments = await prisma.document.findMany({
        where: { id: { in: associate.knowledgeBase } },
        include: {
          content: { select: { content: true } }
        }
      });

      if (kbDocuments.length > 0) {
        knowledgeBaseContent = kbDocuments
          .map(doc => `### ${doc.title} ###\n${doc.content?.content || 'Content not available'}`)
          .join('\n\n---\n\n');
      }
    }

    // Build associate-specific system message
    const practiceAreasText = associate.practiceAreas
      .map((pa: string) => pa.replace(/_/g, ' '))
      .join(', ');

    const associateSystemMessage = `
You are ${associate.name}, an AI legal associate specializing in ${practiceAreasText}.

**Your Instructions**:
${associate.instructions}

${associate.steps && associate.steps.length > 0 ? `
**Your Workflow**:
${associate.steps.map((step: any, idx: number) => `${idx + 1}. ${step.description}`).join('\n')}
` : ''}

${knowledgeBaseContent ? `
**Your Specialized Knowledge Base**:

${knowledgeBaseContent}

IMPORTANT: Use this specialized knowledge to inform your responses. This is your domain expertise that makes you valuable as a specialist.
` : ''}

${project?.knowledgeBase?.settings?.jurisdiction ? `
**Jurisdiction Context**: ${JSON.stringify(project.knowledgeBase.settings.jurisdiction)}
` : ''}

${project?.instructions ? `
**Project Instructions**: ${project.instructions}
` : ''}

**Your Role**: You are a specialized AI legal associate, not a general assistant. Provide expert-level responses drawing on your specialized knowledge and experience in ${practiceAreasText}.

Be thorough, professional, and demonstrate your expertise in your responses.
    `.trim();

    // Prepare conversation context
    const conversationContext = recentMessages.length > 0
      ? `\n\n**Recent Conversation Context**:\n${recentMessages.slice(-5).join('\n')}\n`
      : '';

    // Create the prompt for the associate
    const fullPrompt = `${conversationContext}\n**User Query**: ${query}${context ? `\n\n**Additional Context**: ${context}` : ''}`;

    // Call Gemini with associate-specific context
    const result = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      config: {
        systemInstruction: associateSystemMessage,
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    const response = result.text || 'No response generated';

    if (streamCallback) {
      streamCallback({
        type: 'status',
        status: 'complete',
        message: `${associate.name} has responded`,
        conversationId: projectId
      });
    }

    return {
      success: true,
      associateName: associate.name,
      associateId: associate.id,
      practiceAreas: associate.practiceAreas,
      response,
      message: `**${associate.name}** (${practiceAreasText}):\n\n${response}`
    };

  } catch (error: any) {
    console.error('❌ Error executing associate call:', error);
    return {
      error: error.message || 'Failed to execute associate call',
      message: `I encountered an error while consulting the specialized associate. Please try again.`
    };
  }
}
