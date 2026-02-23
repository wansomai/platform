// src/lib/geminiTools.ts
// Gemini Function Calling Tools for Legal Drafting

import { Type } from '@google/genai';

/**
 * Tool definitions for Gemini function calling
 * The AI will intelligently decide when to call these functions
 */

export const generateDocumentInlineTool = {
  name: "generateDocumentInline",
  description: `Generates a legal document inline in the chat for quick review and download.

  **WHEN TO USE**: Use this for most document requests - it's faster and keeps the user in flow.
  - Simple documents (NDAs, letters, memos, simple contracts)
  - Documents under 5 pages
  - When user wants quick turnaround
  - When user hasn't opened canvas editor

  **WHEN NOT TO USE**: Use draftNewDocument for canvas instead when:
  - Document is complex (10+ pages)
  - User explicitly asks to "open in editor" or "work in canvas"
  - Document requires extensive manual editing
  - User is already in canvas mode

  The generated document will appear as a clickable card in chat with:
  - Preview of the content
  - Download button
  - Click to open in editor

  **CRITICAL**: Only call when you have ALL required information.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      documentType: {
        type: Type.STRING,
        description: "Type of legal document (e.g., 'Non-Disclosure Agreement', 'Employment Contract', 'Letter')",
      },
      title: {
        type: Type.STRING,
        description: "Clear, descriptive title for the document (e.g., 'Mutual NDA - Vendor Partnership', 'Employment Offer - Senior Developer')"
      },
      parties: {
        type: Type.ARRAY,
        description: "All parties with complete legal names and roles",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Full legal name of the party"
            },
            role: {
              type: Type.STRING,
              description: "Role in the agreement"
            }
          },
          required: ["name", "role"]
        }
      },
      terms: {
        type: Type.OBJECT,
        description: "Key terms and conditions specific to this document type",
      },
      suggestedFormat: {
        type: Type.STRING,
        description: "Suggested download format based on purpose: 'PDF' for final/read-only docs (NDAs, letters, notices), 'DOCX' for editable/working docs (drafts, templates), 'MD' for analysis/notes",
        enum: ['PDF', 'DOCX', 'MD']
      },
      formatReason: {
        type: Type.STRING,
        description: "Brief explanation for the format choice (e.g., 'as DOCX so you can edit terms', 'as PDF ready for signature')"
      },
      additionalContext: {
        type: Type.STRING,
        description: "Any additional context or special requirements"
      }
    },
    required: ["documentType", "title", "parties", "terms", "suggestedFormat"]
  }
};

export const draftNewDocumentTool = {
  name: "draftNewDocument",
  description: `Creates a BRAND NEW legal document in the canvas editor when no document currently exists there.

  **WHEN TO USE**: Only for creating a NEW document from scratch:
  - Canvas editor is empty (no existing document)
  - User explicitly asks to create a new document in canvas
  - Complex documents (10+ pages) that need canvas editing

  **⚠️ CRITICAL — DO NOT USE when a canvas document is already open.**
  If the user is asking to modify, edit, update, or change any part of an existing canvas document, use editCanvasDocument instead. This tool replaces the entire canvas content.

  **DEFAULT BEHAVIOR**: For most document requests, use generateDocumentInline instead — it's faster and better UX.

  CRITICAL: Only call this function when you have ALL required information to create a complete, professional legal document.

  Required information varies by document type:
  - NDAs: All party names, confidentiality scope, duration, jurisdiction
  - Employment Contracts: Employer, employee, position, salary, start date, benefits, termination terms
  - Service Agreements: All parties, services description, payment terms, duration, deliverables
  - Lease Agreements: Landlord, tenant, property address, rent amount, duration, deposit

  If ANY critical information is missing, DO NOT call this function. Instead, ask the user for the missing information in your regular response.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      documentType: {
        type: Type.STRING,
        description: "Type of legal document to create (e.g., 'Non-Disclosure Agreement', 'Employment Contract', 'Service Agreement', 'Lease Agreement')",
      },
      parties: {
        type: Type.ARRAY,
        description: "All parties involved in the agreement with their complete legal names and roles",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Full legal name of the party"
            },
            role: {
              type: Type.STRING,
              description: "Role in the agreement (e.g., 'Disclosing Party', 'Employer', 'Service Provider', 'Landlord')"
            }
          },
          required: ["name", "role"]
        }
      },
      terms: {
        type: Type.OBJECT,
        description: "Key terms and conditions specific to this document type. Structure varies by document type.",
      },
      additionalContext: {
        type: Type.STRING,
        description: "Any additional context or special requirements for this document"
      }
    },
    required: ["documentType", "parties", "terms"]
  }
};

export const editCanvasDocumentTool = {
  name: "editCanvasDocument",
  description: `Applies targeted edits to the existing legal document open in the canvas editor.

  **ALWAYS use this tool when a canvas document is open and the user asks for ANY modification**, including:
  - Changing a date, name, number, or any specific value ("change the effective date to…")
  - Adding a new clause or section
  - Removing or replacing content
  - Updating party names, addresses, or details
  - Modifying existing terms or conditions
  - Any other change, no matter how small

  **NEVER use draftNewDocument for edits** — that tool replaces the entire canvas content with a new document.

  In changeDescription, describe the specific change precisely (e.g. "Change the effective date from [current] to 10 March 2025").
  In targetSection, name the section/clause where the change is located if known (e.g. "Effective Date", "Payment Terms").`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      changeDescription: {
        type: Type.STRING,
        description: "Clear, detailed description of what changes to make to the document"
      },
      targetSection: {
        type: Type.STRING,
        description: "Optional: specific section or clause to modify (e.g., 'Confidentiality Obligations', 'Payment Terms')"
      }
    },
    required: ["changeDescription"]
  }
};

export const searchProjectDocumentsTool = {
  name: "searchProjectDocuments",
  description: `Search through documents attached to this project for specific information.

  Use this when you need to:
  - Find specific clauses or terms in reference documents
  - Look up precedents or examples
  - Verify information from uploaded contracts
  - Extract data from existing legal documents

  The search will return relevant excerpts from all attached documents.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "What to search for in the project documents"
      }
    },
    required: ["query"]
  }
};

export const reviewDocumentTool = {
  name: "reviewDocument",
  description: `Conducts a comprehensive legal review of one or more documents in the project.

  Use this when the user wants to:
  - Review documents for legal compliance or regulatory issues
  - Identify potential risks, liabilities, or problematic clauses
  - Analyze document clarity, readability, or structure
  - Check consistency across multiple documents
  - Perform clause-by-clause analysis
  - Get a general assessment of document quality

  CONTEXT AWARENESS:
  - If the user says "review this", "review this document", "what are the risks here", they are referring to the PRIMARY document currently in focus (either the previewed document or the canvas document - the system will determine this automatically).
  - If the user specifies a document by name (e.g., "review the NDA"), look for that specific document.
  - If the user says "review all documents" or "review my documents", review all project documents.

  Before calling this function, ensure you know:
  1. What they want you to focus on in the review (compliance, risks, clarity, specific clauses, etc.)
  2. Any specific instructions (e.g., jurisdiction for compliance, specific terms to focus on)

  The document selection will be handled automatically based on context.
  A downloadable review report will always be generated for the user.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      documentIds: {
        type: Type.ARRAY,
        description: "Array of document IDs to review. Special values: 'primary' (review the primary document in focus - canvas or preview), 'all' (review all project documents). Otherwise, use actual document IDs from the project.",
        items: {
          type: Type.STRING
        }
      },
      reviewFocus: {
        type: Type.STRING,
        description: "Primary focus of the review. Options: 'compliance' (legal/regulatory compliance), 'risk-assessment' (identify liabilities and risks), 'clarity' (readability and language), 'clause-analysis' (detailed clause review), 'consistency-check' (across multiple documents), 'custom' (user-defined focus)"
      },
      specificInstructions: {
        type: Type.STRING,
        description: "Additional specific instructions such as: jurisdiction for compliance review, specific clauses to examine, particular concerns to address, industry-specific requirements, etc."
      }
    },
    required: ["documentIds", "reviewFocus"]
  }
};

/**
 * Google Calendar Tools
 */

export const createCalendarEventTool = {
  name: "createCalendarEvent",
  description: `Creates a new event in the user's Google Calendar.

  Use this when the user wants to:
  - Schedule a meeting or appointment
  - Create a reminder for a task or deadline
  - Set up a recurring event
  - Block time on their calendar

  Ensure you have all required information before calling this function.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Title/summary of the event (e.g., 'Client Meeting', 'Court Hearing')"
      },
      description: {
        type: Type.STRING,
        description: "Detailed description of the event (optional)"
      },
      startDateTime: {
        type: Type.STRING,
        description: "Start date and time in ISO 8601 format (e.g., '2024-03-20T14:00:00-07:00')"
      },
      endDateTime: {
        type: Type.STRING,
        description: "End date and time in ISO 8601 format (e.g., '2024-03-20T15:00:00-07:00')"
      },
      attendees: {
        type: Type.ARRAY,
        description: "List of attendee email addresses (optional)",
        items: {
          type: Type.STRING
        }
      },
      location: {
        type: Type.STRING,
        description: "Location of the event (optional)"
      },
      timeZone: {
        type: Type.STRING,
        description: "Timezone for the event (e.g., 'America/Los_Angeles'). Defaults to user's timezone."
      }
    },
    required: ["summary", "startDateTime", "endDateTime"]
  }
};

export const searchCalendarEventsTool = {
  name: "searchCalendarEvents",
  description: `Searches for events in the user's Google Calendar.

  Use this when the user wants to:
  - Find events within a specific date range
  - Check their schedule for a particular day
  - Look up past or upcoming meetings
  - Search for events by keyword

  Returns a list of matching events with details.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      startDate: {
        type: Type.STRING,
        description: "Start of date range to search in ISO 8601 format (e.g., '2024-03-20T00:00:00Z')"
      },
      endDate: {
        type: Type.STRING,
        description: "End of date range to search in ISO 8601 format (e.g., '2024-03-27T23:59:59Z')"
      },
      query: {
        type: Type.STRING,
        description: "Optional search query to filter events by title or description"
      },
      maxResults: {
        type: Type.NUMBER,
        description: "Maximum number of events to return (default: 10, max: 50)"
      }
    },
    required: ["startDate", "endDate"]
  }
};

export const updateCalendarEventTool = {
  name: "updateCalendarEvent",
  description: `Updates an existing event in the user's Google Calendar.

  Use this when the user wants to:
  - Reschedule a meeting
  - Change event details (title, location, description)
  - Add or remove attendees
  - Modify event duration

  You must first search for the event to get its ID, then update it.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: {
        type: Type.STRING,
        description: "The ID of the event to update (obtained from searchCalendarEvents)"
      },
      updates: {
        type: Type.OBJECT,
        description: "Fields to update. Only include fields that need to be changed.",
        properties: {
          summary: {
            type: Type.STRING,
            description: "New title/summary for the event"
          },
          description: {
            type: Type.STRING,
            description: "New description"
          },
          startDateTime: {
            type: Type.STRING,
            description: "New start time in ISO 8601 format"
          },
          endDateTime: {
            type: Type.STRING,
            description: "New end time in ISO 8601 format"
          },
          location: {
            type: Type.STRING,
            description: "New location"
          },
          attendees: {
            type: Type.ARRAY,
            description: "New list of attendee email addresses",
            items: {
              type: Type.STRING
            }
          }
        }
      }
    },
    required: ["eventId", "updates"]
  }
};

export const getCalendarAvailabilityTool = {
  name: "getCalendarAvailability",
  description: `Checks the user's availability (free/busy times) in Google Calendar.

  Use this when the user wants to:
  - Find available time slots for scheduling
  - Check if they're free at a specific time
  - Identify busy periods in their calendar
  - Suggest meeting times

  Returns free and busy time blocks within the specified range.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      startDateTime: {
        type: Type.STRING,
        description: "Start of time range to check in ISO 8601 format (e.g., '2024-03-20T09:00:00-07:00')"
      },
      endDateTime: {
        type: Type.STRING,
        description: "End of time range to check in ISO 8601 format (e.g., '2024-03-20T17:00:00-07:00')"
      },
      timeZone: {
        type: Type.STRING,
        description: "Timezone for the query (e.g., 'America/Los_Angeles'). Defaults to user's timezone."
      }
    },
    required: ["startDateTime", "endDateTime"]
  }
};

/**
 * All available tools for legal drafting mode
 */
/**
 * Core document tools - ALWAYS available (no toggle needed)
 * These are fundamental legal features users expect without configuration
 */
export const coreDocumentTools = [
  generateDocumentInlineTool, // PRIMARY: Generate documents inline in chat
  reviewDocumentTool,          // Review and analyze documents
  searchProjectDocumentsTool   // Search uploaded documents
];

/**
 * Canvas-specific tools - Only available when Canvas Mode is enabled
 * These are power-user features for complex document editing
 */
export const canvasTools = [
  draftNewDocumentTool,    // Write complex documents to canvas
  editCanvasDocumentTool   // Edit canvas documents
];

/**
 * All available Google Calendar tools
 */
export const googleCalendarTools = [
  createCalendarEventTool,
  searchCalendarEventsTool,
  updateCalendarEventTool,
  getCalendarAvailabilityTool
];

/**
 * Gmail Tools
 */

export const searchEmailsTool = {
  name: "searchEmails",
  description: `Searches the user's Gmail inbox for emails matching criteria.

  Use this when the user wants to:
  - Find emails from a specific person
  - Search for emails with specific keywords or subjects
  - Find recent emails
  - Look for unread messages

  Returns a list of matching emails with sender, subject, snippet, and date.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Search query (e.g., 'from:john@example.com', 'subject:meeting', 'is:unread', 'contract'). Supports Gmail search operators."
      },
      maxResults: {
        type: Type.NUMBER,
        description: "Maximum number of emails to return (default: 10, max: 50)"
      }
    },
    required: ["query"]
  }
};

export const readEmailTool = {
  name: "readEmail",
  description: `Reads the full content of a specific email by ID.

  Use this when the user wants to:
  - Read the full content of an email found in search
  - See email details including body, attachments, etc.
  - Get complete information about a specific message

  You must first search for emails to get their IDs, then read them.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      emailId: {
        type: Type.STRING,
        description: "The ID of the email to read (obtained from searchEmails)"
      }
    },
    required: ["emailId"]
  }
};

export const draftEmailTool = {
  name: "draftEmail",
  description: `Creates a draft email in the user's Gmail account.

  Use this when the user wants to:
  - Prepare an email to send later
  - Draft a response to someone
  - Create an email template

  The draft is saved in Gmail's Drafts folder and can be edited/sent later by the user.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      to: {
        type: Type.ARRAY,
        description: "Recipient email addresses",
        items: {
          type: Type.STRING
        }
      },
      subject: {
        type: Type.STRING,
        description: "Email subject line"
      },
      body: {
        type: Type.STRING,
        description: "Email body content (plain text or HTML)"
      },
      cc: {
        type: Type.ARRAY,
        description: "CC recipient email addresses (optional)",
        items: {
          type: Type.STRING
        }
      },
      bcc: {
        type: Type.ARRAY,
        description: "BCC recipient email addresses (optional)",
        items: {
          type: Type.STRING
        }
      }
    },
    required: ["to", "subject", "body"]
  }
};

/**
 * All available Gmail tools
 */
export const gmailTools = [
  searchEmailsTool,
  readEmailTool,
  draftEmailTool
];
