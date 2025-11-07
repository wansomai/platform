// src/lib/geminiTools.ts
// Gemini Function Calling Tools for Legal Drafting

import { Type } from '@google/genai';

/**
 * Tool definitions for Gemini function calling
 * The AI will intelligently decide when to call these functions
 */

export const draftNewDocumentTool = {
  name: "draftNewDocument",
  description: `Creates a new legal document in the canvas editor.

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
  description: `Modifies the existing legal document currently open in the canvas editor.

  Use this when the user requests changes to the current document, such as:
  - Adding new clauses or sections
  - Modifying existing terms
  - Removing or replacing content
  - Updating party names or details

  Be specific in your changeDescription about what to modify.`,

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
 * All available tools for legal drafting mode
 */
export const legalDraftingTools = [
  draftNewDocumentTool,
  editCanvasDocumentTool,
  searchProjectDocumentsTool,
  reviewDocumentTool
];

/**
 * Tool declarations formatted for Gemini API
 */
export const getToolDeclarations = () => {
  return legalDraftingTools.map(tool => ({
    functionDeclarations: [{
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }]
  }));
};
