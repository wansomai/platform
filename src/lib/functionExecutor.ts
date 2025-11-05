// src/lib/functionExecutor.ts
// Executes Gemini function calls for legal drafting

import { PrismaClient } from '@/prisma/client';
import { AIDocumentService, ProjectContext } from '@/services/aiDocumentService';

const prisma = new PrismaClient();

/**
 * Execute a function call from Gemini
 * @param functionCall - Function call object from Gemini (new @google/genai format)
 * @param streamCallback - Optional callback for streaming updates
 */
export async function executeFunctionCall(
  functionCall: any,
  projectId: string,
  project: any,
  conversationDocuments: any[],
  canvasDocument: any,
  recentMessages: string[],
  streamCallback?: (event: any) => void
): Promise<any> {
  console.log('🔧 Executing function call:', functionCall.name, functionCall.args);

  try {
    switch (functionCall.name) {
      case 'draftNewDocument': {
        const { documentType, parties, terms, additionalContext } = functionCall.args as any;

        // Build project context
        const projectContext: ProjectContext = {
          jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
          instructions: project?.knowledgeBase?.instructions || '',
          documents: conversationDocuments.map((doc: any) => ({
            title: doc.document.title,
            content: doc.document.content?.content || ''
          })),
          conversationHistory: recentMessages || []
        };

        // Create a detailed drafting request
        const partiesText = Array.isArray(parties) ? parties.map((p: any) => `- ${p.name} (${p.role})`).join('\n') : 'Not specified';
        const termsText = typeof terms === 'object' ? JSON.stringify(terms, null, 2) : terms;

        const draftingRequest = `Create a ${documentType} with the following details:

Parties:
${partiesText}

Terms: ${termsText}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}`;

        console.log('📝 Generating document with streaming:', documentType);

        // Send initial status
        if (streamCallback) {
          streamCallback({
            type: 'canvas_status',
            status: 'generating_document',
            message: `Drafting ${documentType}...`,
            conversationId: projectId
          });
        }

        // Generate the document with streaming
        const result = await AIDocumentService.generateDocumentStreaming(
          draftingRequest,
          projectContext,
          (partialContent, section) => {
            // Stream updates to canvas in real-time
            if (streamCallback) {
              streamCallback({
                type: 'canvas_content_update',
                conversationId: projectId,
                partialContent: partialContent,
                currentSection: section,
                actionType: 'generating'
              });
            }
          }
        );

        if (!result.success) {
          return { error: result.error || 'Failed to generate document' };
        }

        // Save to canvas
        await prisma.canvasDocument.upsert({
          where: { projectId },
          create: {
            projectId,
            content: result.htmlContent || result.plainText || '',
            htmlContent: result.htmlContent || '',
            plainText: result.plainText || '',
          },
          update: {
            content: result.htmlContent || result.plainText || '',
            htmlContent: result.htmlContent || '',
            plainText: result.plainText || '',
          }
        });

        console.log('✅ Document created successfully in canvas');

        // Send final canvas update
        if (streamCallback) {
          streamCallback({
            type: 'canvas_update',
            conversationId: projectId,
            content: `Successfully created ${documentType}`,
            canvasContent: result.htmlContent || result.plainText || '',
            canvasUpdated: true,
            actionType: 'generating'
          });
        }

        return {
          success: true,
          message: `Successfully created ${documentType} in the canvas editor. The document includes all the specified parties and terms.`
        };
      }

      case 'editCanvasDocument': {
        const { changeDescription, targetSection } = functionCall.args as any;

        if (!canvasDocument) {
          return { error: 'No canvas document exists to edit. Please create a document first.' };
        }

        const projectContext: ProjectContext = {
          jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
          instructions: project?.knowledgeBase?.instructions || '',
          documents: conversationDocuments.map((doc: any) => ({
            title: doc.document.title,
            content: doc.document.content?.content || ''
          })),
          conversationHistory: recentMessages || []
        };

        const editRequest = targetSection
          ? `In the ${targetSection} section: ${changeDescription}`
          : changeDescription;

        console.log('✏️  Editing canvas document with streaming:', editRequest);

        // Send initial status
        if (streamCallback) {
          streamCallback({
            type: 'canvas_status',
            status: 'editing_document',
            message: 'Updating document...',
            conversationId: projectId
          });
        }

        // Edit document with streaming
        const result = await AIDocumentService.editDocumentStreaming(
          editRequest,
          canvasDocument.htmlContent,
          projectContext,
          (partialContent, section) => {
            // Stream updates to canvas in real-time
            if (streamCallback) {
              streamCallback({
                type: 'canvas_content_update',
                conversationId: projectId,
                partialContent: partialContent,
                currentSection: section,
                actionType: 'editing'
              });
            }
          }
        );

        if (!result.success) {
          return { error: result.error || 'Failed to edit document' };
        }

        // Update canvas
        await prisma.canvasDocument.update({
          where: { projectId },
          data: {
            content: result.htmlContent || result.plainText || '',
            htmlContent: result.htmlContent || '',
            plainText: result.plainText || '',
          }
        });

        console.log('✅ Document updated successfully in canvas');

        // Send final canvas update
        if (streamCallback) {
          streamCallback({
            type: 'canvas_update',
            conversationId: projectId,
            content: `Successfully updated the document`,
            canvasContent: result.htmlContent || result.plainText || '',
            canvasUpdated: true,
            actionType: 'editing'
          });
        }

        return {
          success: true,
          message: `Successfully updated the document in the canvas editor. Changes: ${changeDescription}`
        };
      }

      case 'searchProjectDocuments': {
        const { query } = functionCall.args as any;

        if (conversationDocuments.length === 0) {
          return {
            success: true,
            results: [],
            message: 'No documents are attached to this project.'
          };
        }

        console.log('🔍 Searching project documents for:', query);

        // Simple search through document contents
        const searchResults: any[] = [];
        for (const docRef of conversationDocuments) {
          const content = docRef.document.content?.content || '';
          if (content.toLowerCase().includes(query.toLowerCase())) {
            // Extract relevant excerpt (500 chars around the match)
            const index = content.toLowerCase().indexOf(query.toLowerCase());
            const start = Math.max(0, index - 250);
            const end = Math.min(content.length, index + 250);
            const excerpt = content.substring(start, end);

            searchResults.push({
              documentTitle: docRef.document.title,
              excerpt: excerpt,
              documentId: docRef.document.id
            });
          }
        }

        console.log(`✅ Search complete: found ${searchResults.length} matches`);

        return {
          success: true,
          results: searchResults,
          message: searchResults.length > 0
            ? `Found ${searchResults.length} relevant document(s).`
            : 'No matches found in the attached documents.'
        };
      }

      default:
        console.error('❌ Unknown function:', functionCall.name);
        return { error: `Unknown function: ${functionCall.name}` };
    }
  } catch (error: any) {
    console.error('❌ Error executing function:', error);
    return { error: error.message || 'Failed to execute function' };
  }
}
