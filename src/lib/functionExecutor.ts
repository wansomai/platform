// src/lib/functionExecutor.ts
// Executes Gemini function calls for legal drafting

import prisma from '@/lib/prisma';
import { AIDocumentService, ProjectContext } from '@/services/aiDocumentService';
import { GoogleCalendarService } from '@/services/googleCalendarService';
import { GmailService } from '@/services/gmailService';
import { executeAssociateCall } from './associateExecutor';

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
  userId?: string
): Promise<any> {
  try {
    switch (functionCall.name) {
      case 'generateDocumentInline': {
        const { documentType, title, parties, terms, suggestedFormat, formatReason, additionalContext } = functionCall.args as any;

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

Title: ${title}

Parties:
${partiesText}

Terms: ${termsText}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}`;

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

        console.error('❌ Unknown function:', functionCall.name);
        return { error: `Unknown function: ${functionCall.name}` };
      }
    }
  } catch (error: any) {
    console.error('❌ Error executing function:', error);
    return { error: error.message || 'Failed to execute function' };
  }
}
