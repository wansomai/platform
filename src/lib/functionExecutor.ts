// src/lib/functionExecutor.ts
// Executes Gemini function calls for legal drafting

import prisma from '@/lib/prisma';
import { AIDocumentService, ProjectContext } from '@/services/aiDocumentService';
import { GoogleCalendarService } from '@/services/googleCalendarService';
import { GmailService } from '@/services/gmailService';
import { executeAssociateCall } from './associateExecutor';
import { RAGService } from '@/services/ragService';
import { Jurisdiction } from '@/types/legalKnowledge';

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
  streamCallback?: (event: any) => void,
  userId?: string,
  currentCanvasHtml?: string
): Promise<any> {
  try {
    switch (functionCall.name) {
      case 'generateDocumentInline': {
        const { documentType, title, parties, terms, suggestedFormat, formatReason, additionalContext } = functionCall.args as any;

        // Create a detailed drafting request
        const partiesText = Array.isArray(parties) ? parties.map((p: any) => `- ${p.name} (${p.role})`).join('\n') : 'Not specified';
        const termsText = typeof terms === 'object' ? JSON.stringify(terms, null, 2) : terms;

        const draftingRequest = `Create a ${documentType} with the following details:

Title: ${title}

Parties:
${partiesText}

Terms: ${termsText}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}`;

        // Retrieve relevant legal knowledge using RAG
        let ragResults;
        try {
          const projectJurisdiction = project?.knowledgeBase?.settings?.jurisdiction as Jurisdiction | undefined;
          ragResults = await RAGService.autoMatch(
            {
              jurisdiction: projectJurisdiction,
              practiceAreas: project?.knowledgeBase?.settings?.practiceAreas
            },
            `${documentType}: ${title}`
          );
          console.log(`RAG retrieved ${ragResults.chunks.length} relevant chunks for document generation`);
        } catch (error) {
          console.error('RAG retrieval failed, continuing without RAG context:', error);
        }

        // Build project context with RAG results
        const projectContext: ProjectContext = {
          jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
          instructions: project?.knowledgeBase?.instructions || '',
          documents: conversationDocuments.map((doc: any) => ({
            title: doc.document.title,
            content: doc.document.content?.content || ''
          })),
          conversationHistory: recentMessages || [],
          ragContext: ragResults  // Include RAG context
        };

        // Send initial status
        if (streamCallback) {
          streamCallback({
            type: 'status',
            status: 'generating_inline_document',
            message: `Generating ${documentType}...`,
          });
        }

        // Generate the document
        const result = await AIDocumentService.generateDocument(
          draftingRequest,
          projectContext
        );

        if (!result.success) {
          return { error: result.error || 'Failed to generate document' };
        }

        // Return document metadata for inline display
        return {
          success: true,
          documentGenerated: true,
          document: {
            title: title,
            format: suggestedFormat,
            htmlContent: result.htmlContent || '',
          },
          message: `I've created your ${documentType} ${formatReason ? formatReason : ''}.`,
          formatReason
        };
      }

      case 'draftNewDocument': {
        const { documentType, parties, terms, additionalContext } = functionCall.args as any;

        // Create a detailed drafting request
        const partiesText = Array.isArray(parties) ? parties.map((p: any) => `- ${p.name} (${p.role})`).join('\n') : 'Not specified';
        const termsText = typeof terms === 'object' ? JSON.stringify(terms, null, 2) : terms;

        const draftingRequest = `Create a ${documentType} with the following details:

Parties:
${partiesText}

Terms: ${termsText}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}`;

        // Retrieve relevant legal knowledge using RAG
        let ragResults;
        try {
          const projectJurisdiction = project?.knowledgeBase?.settings?.jurisdiction as Jurisdiction | undefined;
          ragResults = await RAGService.autoMatch(
            {
              jurisdiction: projectJurisdiction,
              practiceAreas: project?.knowledgeBase?.settings?.practiceAreas
            },
            `${documentType}`
          );
          console.log(`RAG retrieved ${ragResults.chunks.length} relevant chunks for canvas document generation`);
        } catch (error) {
          console.error('RAG retrieval failed, continuing without RAG context:', error);
        }

        // Build project context with RAG results
        const projectContext: ProjectContext = {
          jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
          instructions: project?.knowledgeBase?.instructions || '',
          documents: conversationDocuments.map((doc: any) => ({
            title: doc.document.title,
            content: doc.document.content?.content || ''
          })),
          conversationHistory: recentMessages || [],
          ragContext: ragResults  // Include RAG context
        };

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

        if (!canvasDocument && !currentCanvasHtml) {
          return { error: 'No canvas document exists to edit. Please create a document first.' };
        }

        // Use live editor HTML if available (preserves unsaved manual edits),
        // fall back to the last-saved DB version
        const htmlToEdit = currentCanvasHtml || canvasDocument?.htmlContent || '';

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

        // Send initial status
        if (streamCallback) {
          streamCallback({
            type: 'canvas_status',
            status: 'editing_document',
            message: 'Updating document...',
            conversationId: projectId
          });
        }

        // Edit document with streaming — route partial updates to the overlay preview
        const result = await AIDocumentService.editDocumentStreaming(
          editRequest,
          htmlToEdit,
          projectContext,
          (partialContent, section) => {
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

        // Do NOT write to DB — send a suggestion event so the user can review the diff
        if (streamCallback) {
          streamCallback({
            type: 'canvas_suggestion',
            conversationId: projectId,
            content: `I've suggested the following change: ${changeDescription}. Review the highlighted changes in the canvas and click **Accept** or **Reject**.`,
            suggestedHtml: result.htmlContent || result.plainText || '',
            originalHtml: htmlToEdit,
            changeDescription,
            actionType: 'editing'
          });
        }

        return {
          success: true,
          message: `Suggested changes for "${changeDescription}" are ready for review in the canvas editor.`
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

        return {
          success: true,
          results: searchResults,
          message: searchResults.length > 0
            ? `Found ${searchResults.length} relevant document(s).`
            : 'No matches found in the attached documents.'
        };
      }

      case 'searchLegalKnowledge': {
        const { query, documentType } = functionCall.args as any;

        try {
          // Use RAG service to search legal knowledge base
          const projectJurisdiction = project?.knowledgeBase?.settings?.jurisdiction as Jurisdiction | undefined;

          const ragResults = await RAGService.retrieve({
            query,
            jurisdiction: projectJurisdiction,
            documentTypes: documentType ? [documentType] : ['TEMPLATE'],
            topK: 5,
            minSimilarityScore: 0.6
          });

          if (ragResults.chunks.length === 0) {
            return {
              success: true,
              found: false,
              templates: [],
              message: `No templates found for "${query}". You'll need to create this document from scratch.`,
              suggestion: 'Ask the user for all necessary details to draft the document.'
            };
          }

          // Group by source document and format results
          const templatesMap = new Map<string, any>();
          for (const chunk of ragResults.chunks) {
            const key = chunk.legalKnowledge.id;
            if (!templatesMap.has(key)) {
              templatesMap.set(key, {
                id: chunk.legalKnowledge.id,
                title: chunk.legalKnowledge.title,
                type: chunk.legalKnowledge.type,
                jurisdiction: chunk.legalKnowledge.jurisdiction,
                relevanceScore: chunk.score,
                excerpts: []
              });
            }
            templatesMap.get(key).excerpts.push({
              section: chunk.sectionTitle || 'Content',
              text: chunk.chunkText.substring(0, 500) + '...'
            });
          }

          const templates = Array.from(templatesMap.values());

          return {
            success: true,
            found: true,
            templates,
            message: `Found ${templates.length} relevant template(s) in the knowledge base.`,
            suggestion: templates.length > 0
              ? `Use "${templates[0].title}" as a reference. You only need to ask for: party names and any specific terms they want to customize.`
              : undefined
          };
        } catch (error: any) {
          console.error('Legal knowledge search failed:', error);
          return {
            success: false,
            found: false,
            templates: [],
            message: 'Could not search legal knowledge base. Proceeding without template reference.',
            error: error.message
          };
        }
      }

      case 'reviewDocument': {
        const { documentIds, reviewFocus, specificInstructions } = functionCall.args as any;

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

      case 'createCalendarEvent': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Calendar features.' };
        }

        const { summary, description, startDateTime, endDateTime, attendees, location, timeZone } = functionCall.args as any;

        try {
          const event = await GoogleCalendarService.createEvent(userId, {
            summary,
            description,
            startDateTime,
            endDateTime,
            attendees,
            location,
            timeZone
          });

          if (!event) {
            return { error: 'Failed to create calendar event. Please check your Google Calendar connection.' };
          }

          const formattedStart = new Date(startDateTime).toLocaleString();
          const formattedEnd = new Date(endDateTime).toLocaleString();

          return {
            success: true,
            event: {
              id: event.id,
              summary: event.summary,
              description: event.description,
              start: formattedStart,
              end: formattedEnd,
              location: event.location,
              attendees: event.attendees?.map(a => a.email),
              link: event.htmlLink
            },
            message: `Successfully created calendar event "${summary}" on ${formattedStart}.${event.htmlLink ? `\n\nView event: ${event.htmlLink}` : ''}`
          };
        } catch (error: any) {
          console.error('❌ Error creating calendar event:', error);
          return { error: error.message || 'Failed to create calendar event' };
        }
      }

      case 'searchCalendarEvents': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Calendar features.' };
        }

        const { startDate, endDate, query, maxResults } = functionCall.args as any;

        try {
          const events = await GoogleCalendarService.searchEvents(userId, {
            startDate,
            endDate,
            query,
            maxResults
          });

          if (events.length === 0) {
            return {
              success: true,
              events: [],
              message: query
                ? `No events found matching "${query}" between ${new Date(startDate).toLocaleDateString()} and ${new Date(endDate).toLocaleDateString()}.`
                : `No events found between ${new Date(startDate).toLocaleDateString()} and ${new Date(endDate).toLocaleDateString()}.`
            };
          }

          const formattedEvents = events.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: new Date(event.start.dateTime).toLocaleString(),
            end: new Date(event.end.dateTime).toLocaleString(),
            location: event.location,
            attendees: event.attendees?.map(a => a.email),
            link: event.htmlLink
          }));

          return {
            success: true,
            events: formattedEvents,
            message: `Found ${events.length} event(s) in your calendar.`
          };
        } catch (error: any) {
          console.error('❌ Error searching calendar events:', error);
          return { error: error.message || 'Failed to search calendar events' };
        }
      }

      case 'updateCalendarEvent': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Calendar features.' };
        }

        const { eventId, updates } = functionCall.args as any;

        try {
          const updatedEvent = await GoogleCalendarService.updateEvent(userId, eventId, updates);

          if (!updatedEvent) {
            return { error: 'Failed to update calendar event. Event may not exist.' };
          }

          return {
            success: true,
            event: {
              id: updatedEvent.id,
              summary: updatedEvent.summary,
              description: updatedEvent.description,
              start: new Date(updatedEvent.start.dateTime).toLocaleString(),
              end: new Date(updatedEvent.end.dateTime).toLocaleString(),
              location: updatedEvent.location,
              attendees: updatedEvent.attendees?.map(a => a.email),
              link: updatedEvent.htmlLink
            },
            message: `Successfully updated calendar event "${updatedEvent.summary}".${updatedEvent.htmlLink ? `\n\nView event: ${updatedEvent.htmlLink}` : ''}`
          };
        } catch (error: any) {
          console.error('❌ Error updating calendar event:', error);
          return { error: error.message || 'Failed to update calendar event' };
        }
      }

      case 'getCalendarAvailability': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Calendar features.' };
        }

        const { startDateTime, endDateTime, timeZone } = functionCall.args as any;

        try {
          const availability = await GoogleCalendarService.getAvailability(userId, {
            startDateTime,
            endDateTime,
            timeZone
          });

          const formatTimeRange = (start: string, end: string) => {
            const startDate = new Date(start);
            const endDate = new Date(end);
            return `${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`;
          };

          return {
            success: true,
            availability: {
              busyTimes: availability.busyTimes.map(bt => ({
                start: new Date(bt.start!).toLocaleString(),
                end: new Date(bt.end!).toLocaleString(),
                range: formatTimeRange(bt.start!, bt.end!)
              })),
              freeTimes: availability.freeTimes.map(ft => ({
                start: new Date(ft.start).toLocaleString(),
                end: new Date(ft.end).toLocaleString(),
                range: formatTimeRange(ft.start, ft.end)
              }))
            },
            message: availability.busyTimes.length === 0
              ? `You're completely free between ${new Date(startDateTime).toLocaleString()} and ${new Date(endDateTime).toLocaleString()}.`
              : `You have ${availability.busyTimes.length} busy period(s) and ${availability.freeTimes.length} free period(s) in the requested time range.`
          };
        } catch (error: any) {
          console.error('❌ Error checking calendar availability:', error);
          return { error: error.message || 'Failed to check calendar availability' };
        }
      }

      case 'searchEmails': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Gmail features.' };
        }

        const { query, maxResults } = functionCall.args as any;

        try {
          const emails = await GmailService.searchEmails(userId, {
            query,
            maxResults
          });

          if (emails.length === 0) {
            return {
              success: true,
              emails: [],
              message: `No emails found matching "${query}".`
            };
          }

          const formattedEmails = emails.map(email => ({
            id: email.id,
            from: email.from,
            subject: email.subject,
            snippet: email.snippet,
            date: email.date,
            labels: email.labels
          }));

          return {
            success: true,
            emails: formattedEmails,
            message: `Found ${emails.length} email(s) matching your search.`
          };
        } catch (error: any) {
          console.error('❌ Error searching emails:', error);
          return { error: error.message || 'Failed to search emails' };
        }
      }

      case 'readEmail': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Gmail features.' };
        }

        const { emailId } = functionCall.args as any;

        try {
          const email = await GmailService.readEmail(userId, emailId);

          return {
            success: true,
            email: {
              id: email.id,
              from: email.from,
              to: email.to,
              subject: email.subject,
              body: email.body,
              date: email.date,
              labels: email.labels
            },
            message: `Email from ${email.from} - Subject: ${email.subject}`
          };
        } catch (error: any) {
          console.error('❌ Error reading email:', error);
          return { error: error.message || 'Failed to read email' };
        }
      }

      case 'draftEmail': {
        if (!userId) {
          return { error: 'User not authenticated. Please sign in to use Gmail features.' };
        }

        const { to, subject, body, cc, bcc } = functionCall.args as any;

        try {
          const result = await GmailService.draftEmail(userId, {
            to,
            subject,
            body,
            cc,
            bcc
          });

          return {
            success: true,
            draftId: result.draftId,
            message: `Draft email created successfully.\n\nTo: ${to.join(', ')}\nSubject: ${subject}\n\nThe draft has been saved in your Gmail Drafts folder. You can review and send it from Gmail.`
          };
        } catch (error: any) {
          console.error('❌ Error creating draft email:', error);
          return { error: error.message || 'Failed to create draft email' };
        }
      }

      case 'fetchLegalDocument': {
        const { url } = functionCall.args as any;

        try {
          const { fetchLegalDocument } = await import('@/lib/legalScraper');

          console.log(`[functionExecutor] fetchLegalDocument: ${url}`);

          const result = await fetchLegalDocument(url);

          if (result.error && !result.text) {
            return {
              success: false,
              error: result.error,
              INSTRUCTION: [
                `⛔ DO NOT mention errors, timeouts, or any technical failure to the user.`,
                `The precise document could not be opened. Instead, construct a response using ONLY the search results already returned by the previous searchAfricanLegalSources call.`,
                `Format your response as follows:`,
                `1. State: "I found the following sources related to your query. Here are the closest matches available from the official platform:"`,
                `2. List every case and legislation result from the prior search as a numbered, linked list — use the exact [title](url) links already retrieved. Include the court and date where available.`,
                `3. Add a "⚖️ Legal Sources" section at the end with the same numbered links and a one-line description of each.`,
                `4. At the bottom, add: "For the exact document, you can search directly at [platform search URL from prior results]."`,
                `⛔ NEVER invent, reconstruct, or guess any URL. Only use links from the prior searchAfricanLegalSources result.`,
              ].join(' '),
            };
          }

          const docTitle = result.title || 'Legal Document';
          const prebuiltLink = `[${docTitle}](${url})`;
          return {
            success: true,
            url,
            title: docTitle,
            text: result.text,
            wordCount: result.wordCount,
            truncated: result.truncated || false,
            INSTRUCTION: [
              `Full document text retrieved.`,
              `Title: ${docTitle}`,
              `Length: ${result.wordCount} words${result.truncated ? ' (truncated at 12 000 words)' : ''}.`,
              `READY-TO-USE LINK — copy this exactly: ${prebuiltLink}`,
              'Use this link whenever you mention this case — inline in your analysis AND in the ⚖️ Legal Sources section.',
              'Use the text above to write a clear, structured summary covering: parties, facts, legal issues, holdings/ratio, and outcome.',
              '⛔ Do NOT add any URLs other than the one above.',
            ].join('\n'),
          };
        } catch (error: any) {
          console.error('❌ Error fetching legal document:', error);
          return {
            success: false,
            INSTRUCTION: [
              `⛔ DO NOT mention errors, timeouts, or any technical failure to the user.`,
              `The precise document could not be opened. Instead, construct a response using ONLY the search results already returned by the previous searchAfricanLegalSources call.`,
              `Format your response as follows:`,
              `1. State: "I found the following sources related to your query. Here are the closest matches available from the official platform:"`,
              `2. List every case and legislation result from the prior search as a numbered, linked list — use the exact [title](url) links already retrieved. Include the court and date where available.`,
              `3. Add a "⚖️ Legal Sources" section at the end with the same numbered links and a one-line description of each.`,
              `4. At the bottom, add: "For the exact document, you can search directly at [platform search URL from prior results]."`,
              `⛔ NEVER invent, reconstruct, or guess any URL. Only use links from the prior searchAfricanLegalSources result.`,
            ].join(' '),
            error: error.message || 'Failed to fetch document',
          };
        }
      }

      case 'searchAfricanLegalSources': {
        const { query, jurisdiction, maxResults } = functionCall.args as any;

        /**
         * Score how relevant a result title is to the search query.
         * Returns 0–1: 1 = exact match, 0 = no query terms found.
         * Ignores common stop-words so "Land Act" doesn't match every
         * document that merely contains "of" or "the".
         */
        const STOP_WORDS = new Set(['of','the','a','an','in','on','at','to','and','or','for','v','vs','act','law']);
        function scoreRelevance(title: string, q: string): number {
          const t = title.toLowerCase();
          const ql = q.toLowerCase();
          if (t === ql) return 1.0;
          if (t.startsWith(ql)) return 0.95;
          if (t.includes(ql)) return 0.85;
          const terms = ql.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
          if (terms.length === 0) return t.includes(ql) ? 0.5 : 0;
          const hits = terms.filter(w => t.includes(w)).length;
          return hits / terms.length;
        }

        function filterForPreview<T extends { title: string }>(results: T[], q: string, cap = 5): T[] {
          const scored = results.map(r => ({ r, score: scoreRelevance(r.title, q) }));
          scored.sort((a, b) => b.score - a.score);
          const relevant = scored.filter(s => s.score >= 0.5);
          const top = relevant.length > 0 ? relevant.slice(0, cap) : scored.slice(0, 3);
          return top.map(s => s.r);
        }

        // Assembled is declared OUTSIDE try-catch so partial streamed results
        // are accessible in the catch block when the source times out mid-stream.
        const assembled = {
          platform:          '',
          platformName:      '',
          jurisdiction:      jurisdiction as string,
          platformSearchUrl: '',
          legalSources:      [] as import('@/lib/legalScraper').SearchResult[],
          researchSources:   [] as import('@/lib/legalScraper').SearchResult[],
          fromCache:         false,
        };

        try {
          const { streamAfricanLegalSources } = await import('@/lib/legalScraper');

          console.log(`[functionExecutor] searchAfricanLegalSources (stream): "${query}" in ${jurisdiction}`);

          const sendStatus = (msg: string) =>
            streamCallback?.({ type: 'status', status: 'executing_functions', message: msg });

          for await (const event of streamAfricanLegalSources(query, {
            jurisdictionHint: jurisdiction,
            maxResults: typeof maxResults === 'number' ? Math.min(maxResults, 10) : 8,
          })) {
            console.log(`[searchAfricanLegalSources:stream] event=${event.event}`, JSON.stringify(event));

            if (event.event === 'platform') {
              assembled.platform          = event.platform;
              assembled.platformName      = event.platformName;
              assembled.platformSearchUrl = event.platformSearchUrl;
              sendStatus(`Searching ${event.platformName}...`);
            } else if (event.event === 'legal') {
              assembled.legalSources = event.results;
              // If results come from a different platform than announced (scraper fallback), update platform info
              if (event.results.length > 0 && event.results[0].platform !== assembled.platform) {
                assembled.platform     = event.results[0].platform;
                assembled.platformName = event.results[0].platformName;
              }
              const count = event.results.length;
              console.log(`[searchAfricanLegalSources:stream] legal results (${count}):`, event.results.map(r => r.title));
              if (count > 0) {
                const previewResults = filterForPreview(event.results, query);
                streamCallback?.({
                  type: 'search_preview',
                  results: previewResults.map(r => ({
                    title:    r.title,
                    url:      r.url,
                    date:     r.date || null,
                    platform: r.platformName,
                  })),
                });
              }
              sendStatus(
                count > 0
                  ? `Found ${count} case${count !== 1 ? 's' : ''} from ${assembled.platformName || 'legal database'}...`
                  : `No cases found on ${assembled.platformName || 'legal database'}`,
              );
            } else if (event.event === 'research') {
              assembled.researchSources = event.results;
              const count = event.results.length;
              console.log(`[searchAfricanLegalSources:stream] research results (${count}):`, event.results.map(r => r.title));
              if (count > 0) {
                const previewResults = filterForPreview(event.results, query);
                // Append legislation results to the preview (replacing any previous preview)
                streamCallback?.({
                  type: 'search_preview',
                  results: [
                    ...assembled.legalSources.length > 0
                      ? filterForPreview(assembled.legalSources, query).map(r => ({
                          title: r.title, url: r.url, date: r.date || null, platform: r.platformName,
                        }))
                      : [],
                    ...previewResults.map(r => ({
                      title: r.title, url: r.url, date: r.date || null, platform: r.platformName,
                    })),
                  ],
                });
                sendStatus(`Found ${count} legislation result${count !== 1 ? 's' : ''}...`);
              }
            } else if (event.event === 'done') {
              assembled.fromCache = event.fromCache;
              console.log(`[searchAfricanLegalSources:stream] done. fromCache=${event.fromCache}, legal=${assembled.legalSources.length}, research=${assembled.researchSources.length}`);
              sendStatus('Compiling legal sources...');
            }
          }

          const response = assembled;

          const hasLegal    = response.legalSources.length > 0;
          const hasResearch = response.researchSources.length > 0;

          // ── Format Legal Sources (from scraper — specific case pages) ───
          // Workaround: scraper sometimes puts the date string in the court field.
          // Detect ISO-date-shaped court values and null them out until backend is fixed.
          const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
          const legalFormatted = response.legalSources.map((r, i) => ({
            rank:     i + 1,
            title:    r.title,
            url:      r.url,               // exact scraped URL — copy verbatim
            court:    r.court && !ISO_DATE.test(r.court) ? r.court : null,
            date:     r.date  && !ISO_DATE.test(r.date)  ? null    : (r.date || null),
            snippet:  r.snippet || null,
            fullText: r.docContent ? r.docContent.slice(0, 4000) : null,
            platform: r.platformName,
          }));

          // ── Format Research Sources (legislation / acts from same LII platform) ──
          const researchFormatted = response.researchSources.map((r, i) => ({
            rank:    i + 1,
            title:   r.title,
            url:     r.url,
            source:  r.platformName,
            snippet: r.snippet || null,
          }));

          if (!hasLegal && !hasResearch) {
            return {
              success: false,
              legalSourcesFound: 0,
              platform: response.platformName,
              platformSearchUrl: response.platformSearchUrl,
              INSTRUCTION: [
                `⛔ DO NOT mention errors, technical failures, or that "no results were found" in those words.`,
                `The search on ${response.platformName} did not return any results for this query.`,
                `Tell the user: "The search did not return any matching sources on ${response.platformName} for this query."`,
                `Then provide a direct search link: [Search ${response.platformName} manually](${response.platformSearchUrl})`,
                `⛔ You MUST NOT generate, invent, or hallucinate any case names, URLs, or citations.`,
                `⛔ Do NOT cite any URL, case, or statute from your training data as a substitute.`,
                `You may briefly explain the legal concept in general terms, but make clear that no live sources were retrieved for this specific query.`,
              ].join(' '),
            };
          }

          return {
            success: true,
            jurisdiction,
            platform: response.platformName,
            platformSearchUrl: response.platformSearchUrl,
            fromCache: response.fromCache,

            // ── LEGAL SOURCES — scraped from official LII platform ──────
            legalSources: legalFormatted,
            legalSourcesCount: legalFormatted.length,

            // ── RESEARCH SOURCES — Google CSE broader context ───────────
            researchSources: researchFormatted,
            researchSourcesCount: researchFormatted.length,

            INSTRUCTION: (() => {
              const legalLinks = legalFormatted.map((r, i) =>
                `  ${i + 1}. [${r.title}](${r.url})${r.court ? ` — ${r.court}` : ''}${r.date ? `, ${r.date}` : ''}`
              ).join('\n');
              const researchLinks = researchFormatted.map((r, i) =>
                `  ${i + 1}. [${r.title}](${r.url}) — ${r.source || response.platformName}`
              ).join('\n');
              return [
                `ALL sources retrieved live from: ${response.platformName} — ${response.platformSearchUrl}`,
                'This is the ONLY authoritative source for this jurisdiction. Do NOT cite any other website.',
                '',
                '── READY-TO-USE LINKS (copy these exactly — do not retype or reconstruct) ──',
                '',
                `CASE LAW (${legalFormatted.length} judgment(s)):`,
                legalLinks || '  (none)',
                '',
                `LEGISLATION (${researchFormatted.length} act(s)/statute(s)):`,
                researchLinks || '  (none)',
                '',
                '── HOW TO USE ──',
                '',
                'STEP 1 — INLINE CITATIONS: Every time you mention a case or statute in your prose, embed its ready-to-use link right there in the sentence.',
                'Example: "Under the [Land Act, 2012](https://...), a holder of title must..."',
                'NEVER write a case or statute name as plain text — always use the pre-built link from above.',
                '',
                'STEP 2 — ⚖️ LEGAL SOURCES SECTION: At the end of your response, add a "⚖️ Legal Sources" heading and paste the numbered links from above, adding a one-line summary for each case.',
                '',
                '⛔ RULES — NEVER BREAK:',
                '• Only use the links listed above — NEVER construct, guess, or recall any URL.',
                '• NEVER write a bare URL — always use the [text](url) format.',
                '• If a case or statute you want to mention is NOT in the lists above, call searchAfricanLegalSources again with its exact citation before including it.',
                '• NEVER list a source in ⚖️ Legal Sources without a live link from these results.',
                `• If a dedicated search still returns nothing, tell the user: "I could not retrieve a live link — search manually at ${response.platformSearchUrl}"`,
              ].join('\n');
            })(),
          };
        } catch (error: any) {
          console.error('❌ Error searching African legal sources:', error);

          // If partial results were streamed before the timeout/error, use them
          // rather than returning a hard failure. Format them as a "closest match"
          // response so the AI can still present useful sources to the user.
          const hasPartialLegal    = assembled.legalSources.length > 0;
          const hasPartialResearch = assembled.researchSources.length > 0;

          if (hasPartialLegal || hasPartialResearch) {
            const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
            const legalFormatted = assembled.legalSources.map((r, i) => ({
              rank:     i + 1,
              title:    r.title,
              url:      r.url,
              court:    r.court && !ISO_DATE.test(r.court) ? r.court : null,
              date:     r.date  && !ISO_DATE.test(r.date)  ? null    : (r.date || null),
              snippet:  r.snippet || null,
              fullText: r.docContent ? r.docContent.slice(0, 4000) : null,
              platform: r.platformName,
            }));
            const researchFormatted = assembled.researchSources.map((r, i) => ({
              rank:    i + 1,
              title:   r.title,
              url:     r.url,
              source:  r.platformName,
              snippet: r.snippet || null,
            }));

            const legalLinks = legalFormatted.map((r, i) =>
              `  ${i + 1}. [${r.title}](${r.url})${r.court ? ` — ${r.court}` : ''}${r.date ? `, ${r.date}` : ''}`
            ).join('\n');
            const researchLinks = researchFormatted.map((r, i) =>
              `  ${i + 1}. [${r.title}](${r.url}) — ${r.source || assembled.platformName}`
            ).join('\n');

            return {
              success: true,
              partial: true,
              jurisdiction,
              platform: assembled.platformName || 'legal database',
              platformSearchUrl: assembled.platformSearchUrl,
              legalSources: legalFormatted,
              legalSourcesCount: legalFormatted.length,
              researchSources: researchFormatted,
              researchSourcesCount: researchFormatted.length,
              INSTRUCTION: [
                `The search for "${query}" on ${assembled.platformName || 'the legal database'} did not return an exact match, but the following related sources were retrieved.`,
                'Use ONLY the sources listed below — do NOT invent, guess, or hallucinate any additional URLs or citations.',
                '',
                'Tell the user: "I did not find an exact match for your query, but here are the closest results retrieved from the official source:"',
                '',
                '⛔ DO NOT mention timeouts, technical errors, or any system failure to the user. Never say phrases like "I was unable to retrieve" or "due to a technical issue". Just present what was found.',
                '',
                '── PARTIAL RESULTS — use these verbatim ──',
                '',
                `CASE LAW (${legalFormatted.length} judgment(s)):`,
                legalLinks || '  (none)',
                '',
                `LEGISLATION (${researchFormatted.length} act(s)/statute(s)):`,
                researchLinks || '  (none)',
                '',
                '── HOW TO PRESENT ──',
                'STEP 1 — Present the results as the closest matches found for the query. Do not explain why an exact result is missing.',
                'STEP 2 — Link each result using its ready-to-use link. NEVER rewrite or reconstruct URLs.',
                `STEP 3 — Direct the user to search manually at: ${assembled.platformSearchUrl || 'https://africanlii.org'} if they need a more specific result.`,
                '⛔ NEVER list a source without a live link from the results above.',
              ].join('\n'),
            };
          }

          return {
            success: false,
            legalSourcesFound: 0,
            INSTRUCTION: [
              '⚠️ The legal search tool failed with a technical error and no results were retrieved.',
              'You MUST NOT generate, guess, or hallucinate any URLs or case citations.',
              'Tell the user the search failed and direct them to https://africanlii.org to search manually.',
            ].join(' '),
            error: error.message || 'Failed to search legal sources',
          };
        }
      }

      default: {
        // Check if this is an associate tool call (starts with "use")
        if (functionCall.name.startsWith('use')) {
          return await executeAssociateCall(
            functionCall,
            projectId,
            project,
            conversationDocuments,
            recentMessages,
            streamCallback,
            userId
          );
        }

        // googleSearch is a built-in Gemini capability the model sometimes calls
        // even when Google Search grounding is not configured. Return a clear
        // message so the model knows to respond from its own knowledge instead.
        if (functionCall.name === 'googleSearch') {
          console.log('[functionExecutor] googleSearch called but web search is not enabled — returning fallback');
          return {
            error: 'Web search is not enabled for this workspace. Please answer from your training knowledge and any documents provided.',
            suggestion: 'Respond based on your legal knowledge without web search.'
          };
        }

        console.error('❌ Unknown function:', functionCall.name);
        return { error: `Unknown function: ${functionCall.name}` };
      }
    }
  } catch (error: any) {
    console.error('❌ Error executing function:', error);
    return { error: error.message || 'Failed to execute function' };
  }
}
