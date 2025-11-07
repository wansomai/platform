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
  previewDocument: any,
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

      case 'reviewDocument': {
        const { documentIds, reviewFocus, specificInstructions } = functionCall.args as any;

        console.log('📋 Reviewing documents with focus:', reviewFocus);

        // Determine which documents to review
        let documentsToReview: any[] = [];
        let primaryDocumentName = '';

        // Handle 'primary' - the document currently in focus (preview or canvas)
        if (documentIds.includes('primary') || documentIds[0] === 'primary') {
          // Priority 1: Preview document (if user is viewing a document)
          if (previewDocument) {
            documentsToReview = conversationDocuments.filter((doc: any) =>
              doc.document.id === previewDocument.id
            );
            primaryDocumentName = previewDocument.title;
            console.log('📋 Primary document is preview document:', primaryDocumentName);
          }
          // Priority 2: Canvas document (if user is in drafting mode)
          else if (canvasDocument && canvasDocument.htmlContent) {
            documentsToReview = [{
              document: {
                id: 'canvas',
                title: 'Canvas Document',
                content: {
                  content: canvasDocument.plainText || canvasDocument.htmlContent
                }
              }
            }];
            primaryDocumentName = 'Canvas Document';
            console.log('📋 Primary document is canvas document');
          }
          // Fallback: No primary document available
          else {
            return {
              error: 'No primary document is currently in focus. Please open a document in preview or canvas mode, or specify which document to review.'
            };
          }
        }
        // Handle 'all' - review all project documents
        else if (documentIds.includes('all') || documentIds[0] === 'all') {
          if (conversationDocuments.length === 0) {
            return {
              error: 'No documents are available in this project to review. Please upload documents first.'
            };
          }
          documentsToReview = conversationDocuments;
          console.log('📋 Reviewing all project documents:', documentsToReview.length);
        }
        // Handle specific document IDs
        else {
          if (conversationDocuments.length === 0) {
            return {
              error: 'No documents are available in this project to review. Please upload documents first.'
            };
          }
          documentsToReview = conversationDocuments.filter((doc: any) =>
            documentIds.includes(doc.document.id)
          );
          console.log('📋 Reviewing specific documents:', documentsToReview.length);
        }

        if (documentsToReview.length === 0) {
          return {
            error: 'Could not find the specified documents to review.'
          };
        }

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

        // Prepare documents for review
        const documentsForReview = documentsToReview.map((doc: any) => ({
          title: doc.document.title,
          content: doc.document.content?.content || '',
          id: doc.document.id
        }));

        const reviewInstruction = `Conduct a comprehensive ${reviewFocus} review of the following document(s):

${documentsForReview.map((doc, idx) => `${idx + 1}. ${doc.title}`).join('\n')}

${specificInstructions ? `Specific Instructions: ${specificInstructions}` : ''}

Please provide a structured review report.`;

        console.log('📝 Generating document review report');

        // Send initial status (not canvas-related, just general processing)
        if (streamCallback) {
          streamCallback({
            type: 'status',
            status: 'processing',
            message: `Reviewing ${documentsToReview.length} document(s)...`,
            conversationId: projectId
          });
        }

        // Generate the review report (no streaming to canvas)
        const result = await AIDocumentService.generateDocumentReviewStreaming(
          reviewInstruction,
          documentsForReview,
          reviewFocus,
          projectContext,
          undefined // No streaming callback - report will be in download buttons
        );

        if (!result.success) {
          return { error: result.error || 'Failed to generate document review' };
        }

        // Generate report metadata - we'll store content in message metadata
        // and generate downloads on-demand to avoid database conflicts
        const reportTitle = `${reviewFocus.replace('-', ' ')} Review Report${primaryDocumentName ? ` - ${primaryDocumentName}` : ''}`;
        const reportDate = new Date().toISOString().split('T')[0];

        // Generate a unique report ID for this session
        const reportId = `report-${Date.now()}`;

        console.log('✅ Document review report generated:', reportId);

        // Extract a brief summary from the report (first few paragraphs or executive summary)
        const htmlText = result.htmlContent || result.plainText || '';
        const summaryMatch = htmlText.match(/<h2[^>]*>Executive Summary<\/h2>\s*<p>(.*?)<\/p>/i);
        const briefSummary = summaryMatch
          ? summaryMatch[1].substring(0, 300) + '...'
          : htmlText.substring(0, 300).replace(/<[^>]*>/g, '') + '...';

        // Prepare download URL for Word format only
        const baseUrl = `/api/projects/${projectId}/reports/${reportId}`;

        return {
          success: true,
          reportReady: true,
          reportId: reportId,
          reportTitle,
          documentName: primaryDocumentName || `${documentsToReview.length} document(s)`,
          reviewFocus: reviewFocus.replace('-', ' '),
          briefSummary,
          // Include full content for storage in message metadata
          htmlContent: result.htmlContent || '',
          plainText: result.plainText || '',
          downloadUrls: {
            word: `${baseUrl}/download?format=word`,
          },
          message: `I've completed the ${reviewFocus.replace('-', ' ')} review of ${primaryDocumentName || `${documentsToReview.length} document(s)`}.\n\n${briefSummary}\n\n📄 Your detailed review report is ready for download.`
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
