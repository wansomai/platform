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
  description: `Creates a BRAND NEW legal document as a separate canvas document tab.

  Each call creates an ADDITIONAL document alongside any existing ones — it does NOT replace or modify the currently open document.
  The user can have multiple document tabs open simultaneously.

  **✅ ALWAYS use this tool when**:
  - User asks to CREATE, DRAFT, or WRITE any document (e.g. "draft an NDA", "create an employment contract", "I need a service agreement", "write a letter of demand")
  - User wants a document DIFFERENT from the currently open one — even if a canvas document is already open
  - User says "draft a new X", "create another Y", "I need a Z", "write a document for…"
  - Canvas is empty and user asks to create any document
  - **A canvas document is already open and user asks to draft a DIFFERENT document** → still use this tool, creating a NEW tab

  **❌ DO NOT USE when**:
  - The user explicitly wants to modify, edit, update, or change ANY document that already exists in this conversation (whether open in canvas OR previously generated inline as a document card) → use editCanvasDocument
  - The user says "update this", "edit this clause", "change the date", "fix the name", "modify the petition" — ANY change to an existing document → use editCanvasDocument
  - A document was just generated inline in this conversation (as a document card) and the user is asking to change or refine it → use editCanvasDocument (NOT this tool)

  **DEFAULT BEHAVIOR**: For most document requests outside canvas, use generateDocumentInline instead — it's faster and better UX.

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
  description: `Applies a single targeted change to an existing legal document — whether it is open in the canvas editor OR was previously generated inline in this conversation as a document card.

  **✅ USE THIS TOOL when the user wants to CHANGE, MODIFY, UPDATE, or EDIT any document that already exists**, such as:
  - Changing a date, name, number, or any specific value ("change the effective date to…", "change the date to today's date")
  - Adding a new clause or section to the SAME document
  - Removing or replacing content in the SAME document
  - Updating party names, addresses, or details in the SAME document
  - Modifying existing terms or conditions in the SAME document
  - Any refinement to a document JUST generated inline in this conversation (document card in chat)

  **CRITICAL: If a document was generated inline earlier in this conversation and the user asks to change ANYTHING about it — use this tool even if the canvas is not yet open.**

  **❌ NEVER use this tool when**:
  - The user wants to CREATE a brand-new document that is DIFFERENT in type, parties, or purpose from anything already generated
  - The user says "draft a new X", "create a Y", "I need a Z" (clearly a new separate document) → use draftNewDocument

  **CRITICAL distinction**:
  - "Change the date", "Update the party name", "Fix the address", "Edit clause 3" → editCanvasDocument (modifying existing)
  - "Draft a new NDA for different parties", "I need an employment contract" → draftNewDocument (entirely new document)

  In changeDescription, describe the specific change precisely (e.g. "Change the petition date to 21 March 2026").
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

export const searchLegalKnowledgeTool = {
  name: "searchLegalKnowledge",
  description: `Search the legal knowledge base for templates, precedents, and reference documents.

  **WHEN TO USE**:
  - ONLY when user explicitly asks to draft, create, or generate a legal document
  - Examples: "Draft an NDA", "Create employment contract", "Generate a lease agreement"

  **DO NOT USE FOR**:
  - General questions or greetings ("hi", "hello", "how are you")
  - Questions about law or legal concepts
  - Anything that is NOT a request to create/draft a document

  **WORKFLOW when drafting documents**:
  1. User asks to draft a specific document type
  2. Search for relevant templates
  3. If found: Use template as reference, ask for minimal details
  4. If not found: Create from scratch, ask for full details`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Search query describing the document type or content needed (e.g., 'NDA template', 'employment contract Kenya', 'service agreement')"
      },
      documentType: {
        type: Type.STRING,
        description: "Optional: Filter by type - TEMPLATE, CASE_LAW, STATUTE, REGULATION, LEGAL_OPINION, PRACTICE_GUIDE",
        enum: ['TEMPLATE', 'CASE_LAW', 'STATUTE', 'REGULATION', 'LEGAL_OPINION', 'PRACTICE_GUIDE']
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
 * Core document tools - ALWAYS available (no toggle needed)
 * These are fundamental legal features users expect without configuration
 */
export const coreDocumentTools = [
  searchLegalKnowledgeTool,    // Search internal templates before drafting
  generateDocumentInlineTool,  // PRIMARY: Generate documents inline in chat
  reviewDocumentTool,          // Review and analyze documents
  searchProjectDocumentsTool   // Search uploaded documents
  // NOTE: editCanvasDocumentTool and batchEditCanvasDocumentTool are added separately
  // via documentEditTools — they are always available so users can edit inline docs
];

export const batchEditCanvasDocumentTool = {
  name: "batchEditCanvasDocument",
  description: `Applies multiple targeted edits to an existing document (open in canvas OR previously generated inline in chat) one by one, in sequence.

  **USE THIS instead of editCanvasDocument whenever the user requests 2 or more changes at once** to a document that already exists.
  Each edit in the array is applied to the result of the previous edit, so all changes build correctly on each other.

  This works on BOTH documents currently open in the canvas editor AND documents generated inline earlier in this conversation.

  Examples of when to use this:
  - "Change the effective date to March 1, update the notice period to 30 days, and add a force majeure clause"
  - "Fix the party names, correct the payment terms, and update the governing law"
  - Any message that contains multiple distinct document changes

  For a SINGLE change, use editCanvasDocument instead.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      edits: {
        type: Type.ARRAY,
        description: "Ordered list of individual edits to apply in sequence. Each edit is one specific, atomic change.",
        items: {
          type: Type.OBJECT,
          properties: {
            changeDescription: {
              type: Type.STRING,
              description: "Clear description of this single specific change (e.g. 'Change the effective date to 1 March 2025')"
            },
            targetSection: {
              type: Type.STRING,
              description: "Optional: the section or clause where this change should be applied (e.g. 'Payment Terms', 'Effective Date')"
            }
          },
          required: ["changeDescription"]
        }
      }
    },
    required: ["edits"]
  }
};

/**
 * Document editing tools - ALWAYS available.
 * These handle edits to documents whether they are open in the canvas editor
 * or were generated inline as document cards in the chat.
 * Must be always-on because users can ask to edit an inline doc before opening canvas.
 */
export const documentEditTools = [
  editCanvasDocumentTool,         // Edit any existing document (single change)
  batchEditCanvasDocumentTool,    // Edit any existing document (multiple changes)
];

/**
 * Canvas creation tools - Only available when Canvas Mode is enabled.
 * draftNewDocument creates a brand-new canvas document tab — only useful
 * once the user is in canvas mode.
 */
export const canvasTools = [
  draftNewDocumentTool,           // Create new canvas document tab (canvas mode only)
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

// ── Pan-African Legal Search Tool ──────────────────────────────────────────

export const searchAfricanLegalSourcesTool = {
  name: "searchAfricanLegalSources",
  description: `Search official African LII (Legal Information Institute) databases for cases,
  judgments, statutes, and acts. Results come EXCLUSIVELY from the official LII platform
  for the requested jurisdiction — no other websites.

  LII PLATFORM MAP (each jurisdiction has exactly one official LII):
  • Kenya          → Kenya Law          (new.kenyalaw.org)
  • Ghana          → GhaLII             (ghalii.org)
  • Nigeria        → NigeriaLII         (nigerialii.org)
  • South Africa   → SAFLII / AfricanLII (saflii.org / africanlii.org/za)
  • Uganda         → ULII               (ulii.org)
  • Tanzania       → TanzLII            (tanzlii.org)
  • Zimbabwe       → ZimLII             (zimlii.org)
  • Malawi         → MalawiLII          (malawilii.org)
  • Namibia        → NamibiaLII         (namibialii.org)
  • Lesotho        → LesothoLII         (lesotholii.org)
  • Eswatini       → SwaziLII           (swazilii.org)
  • Seychelles     → SeyLII             (seylii.org)
  • Mauritius      → MauritiusLII       (mauritiuslii.org)
  • Ethiopia       → EthiopiaLII        (ethiopialii.org)
  • OHADA / Francophone West Africa → OHADA/CCJA (ohadalex.org)
  • Pan-African / multiple countries  → AfricanLII (africanlii.org)

  RETURNS:
  legalSources[]   — cases and judgments from the jurisdiction's LII
  researchSources[] — legislation and acts from the same jurisdiction's LII

  WHEN TO CALL: Any time the user asks about a case, judgment, statute, act, or law
  from any African country. This is THE ONLY tool for legal sources — call it BEFORE
  citing anything. This applies in ALL modes including Deep Search / web search mode.
  NEVER use searchAgent or web search for legal cases or legislation.

  ⚠️ ABSOLUTE RULES — NEVER BREAK THESE:
  1. EVERY URL you show the user MUST come verbatim from legalSources[].url or researchSources[].url.
  2. NEVER generate, guess, reconstruct, or use any URL from your training data or Google Search.
  3. NEVER cite a source that is not in the tool's returned arrays.
  4. If legalSources[] is empty: tell the user no live results were found and direct them
     to the platform URL in platformSearchUrl. Do NOT invent case names or links.
  5. Copy each URL character-for-character — do not shorten, modify, or paraphrase it.
  6. In Deep Search mode: searchAgent is for non-legal queries only. ALL legal URLs must come from this tool.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Specific legal search query — case name, legal topic, statute, or legal question. Be precise (e.g., 'breach of contract damages' or 'land acquisition compensation Kenya')."
      },
      jurisdiction: {
        type: Type.STRING,
        description: "The African country or jurisdiction. Use the country name exactly (e.g., 'Kenya', 'South Africa', 'Nigeria', 'Ghana', 'Uganda', 'Tanzania', 'Zimbabwe', 'Malawi', 'Namibia', 'Lesotho', 'Eswatini', 'Seychelles', 'Mauritius', 'Ethiopia', 'OHADA'). Extract from user message or workspace jurisdiction."
      },
      maxResults: {
        type: Type.NUMBER,
        description: "Maximum number of results to return (default 8, max 20)."
      }
    },
    required: ["query", "jurisdiction"]
  }
};

// ── Fetch Legal Document Tool ─────────────────────────────────────────────────

export const fetchLegalDocumentTool = {
  name: "fetchLegalDocument",
  description: `Fetch the full text of a legal document (case judgment or statute) from an official LII platform URL.

  WHEN TO USE:
  - After searchAfricanLegalSources returns a URL, call this to read the full document.
  - When a user asks to summarise, analyse, explain holdings, or discuss the details of a specific case or statute.
  - When the snippet from search results is not enough to answer the question.

  HOW TO USE:
  1. First call searchAfricanLegalSources to get the official URL.
  2. Then call fetchLegalDocument with that URL to get the full text.
  3. Use the returned text to write your summary or analysis.

  ⚠️ RULES:
  - Only provide URLs that came from searchAfricanLegalSources results (legalSources[].url or researchSources[].url).
  - NEVER pass a URL you constructed or recalled from memory.
  - If the document returns an error, tell the user and suggest they open the URL directly.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The exact URL of the legal document from an official LII platform. Must come verbatim from a previous searchAfricanLegalSources result."
      }
    },
    required: ["url"]
  }
};

/** Legal research tools — always available for African jurisdiction queries */
export const africanLegalSearchTools = [
  searchAfricanLegalSourcesTool,
  fetchLegalDocumentTool,
];
