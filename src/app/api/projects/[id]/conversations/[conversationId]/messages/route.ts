// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { GoogleGenAI } from '@google/genai';

import { canSendMessage } from '@/lib/subscription';
import { getJurisdictionById, getJurisdictionInstructions, getJurisdictionByCountryCode } from '@/lib/jurisdictions';
import { coreDocumentTools, canvasTools, documentEditTools, editCanvasDocumentTool, googleCalendarTools, gmailTools, africanLegalSearchTools } from '@/lib/geminiTools';
import { executeFunctionCall } from '@/lib/functionExecutor';
import { generateProjectAssociateTools, getAssociateToolDeclarations } from '@/lib/associateTools';
import { resolveAndValidateSources } from '@/lib/url-resolve';
import { extractMissingDocumentContents } from '@/lib/documentContentFallback';

// Set a reasonable timeout
export const maxDuration = 120;

// Domains that must never appear as web search sources
const BLOCKED_SEARCH_DOMAINS: string[] = ['jibudocs.com'];

// ── Intent classification via Gemini ──────────────────────────────────────────
// Asks Gemini directly to classify every message. No keyword regexes.
// Returns:
//   'edit'      → user wants to modify the existing canvas document
//   'draft_new' → user wants a brand-new document generated from scratch
//   'research'  → question, legal lookup, or information request
async function classifyMessageIntent(
  content: string,
  canvasDocumentExists: boolean,
  recentMessages: Array<{ role: string; content: string }>
): Promise<'edit' | 'draft_new' | 'research'> {
  const recentCtx = recentMessages
    .slice(-4)
    .map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content.slice(0, 200)}`)
    .join('\n');

  const prompt = `You are a routing classifier for a legal AI workspace.
A document editor (canvas) may be open. Classify the user's message into exactly one of three intents.

Canvas document open: ${canvasDocumentExists ? 'YES' : 'NO'}
${recentCtx ? `Recent conversation:\n${recentCtx}\n` : ''}
User message:
"""
${content.slice(0, 800)}
"""

THE THREE INTENTS:

1. edit
   The user wants to CHANGE or UPDATE the document that is already open.
   Signs: action verbs targeting the document — "change the date", "update the name",
   "fix clause 3", "sign the affidavit", "add a signature block", "remove section 5",
   "make it more formal", "bold the headings", "date the petition", "set effective date to X".

2. draft_new
   The user wants to GENERATE a completely NEW document from scratch.
   Signs: "draft a new NDA", "create an employment contract", "write a lease agreement",
   "generate a petition for X", "prepare a will for Y".
   ALSO: if the message consists of structured document content (markdown headings like
   ## Parties, bullet points with Petitioner/Respondent/Plaintiff/Defendant fields,
   or a form-style layout) and there is NO explicit edit instruction → this is draft_new,
   the user is providing the data/parties for a new document to be generated.

3. research
   The user is asking a question or requesting information. No document will be changed.
   Signs: questions ("what does this mean?", "is this enforceable?"), requests for
   information ("tell me about the Marriage Act", "I would like to know more about X",
   "explain consideration", "find cases about Y", "summarize the law on Z"),
   or legal research tasks. A message is research if it ends with "?" or starts with
   "what", "how", "why", "when", "who", "explain", "tell me", "I want to know", etc.

DECISION RULES:
- If the message is a question or asks for information → research (even if canvas is open)
- If the message gives an instruction to change the open document → edit
- If the message provides document data/parties/content for generation → draft_new
- If truly ambiguous between edit and research → research (safer: no document will be mutated)

Respond with ONLY one word: edit, draft_new, or research`;

  try {
    const classificationResult = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0, maxOutputTokens: 10 }
    });
    const text = (classificationResult.text ?? '').trim().toLowerCase();
    console.log('[intent-classifier] gemini →', text);
    if (text.startsWith('edit')) return 'edit';
    if (text.startsWith('draft')) return 'draft_new';
    return 'research';
  } catch (err) {
    console.error('[intent-classifier] Error, defaulting to research:', err);
    return 'research';
  }
}


// Initialize Gemini with the new API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Default settings if none exist
type JurisdictionObject = {
  id?: string;
  name: string;
  country: string;
  state?: string;
  legalSystem?: string;
  citationStyle?: string;
};
type JurisdictionType = JurisdictionObject | string | undefined;

// Narrow JurisdictionType to the object form (filters out legacy string values)
function asJurisdictionObject(j: JurisdictionType): JurisdictionObject | undefined {
  if (typeof j === 'object' && j !== null) return j;
  return undefined;
}

const DEFAULT_SETTINGS: {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  model: string;
  googleCalendar?: boolean;
  gmail?: boolean;
  temperature: number;
  canvasMode: boolean;  // Renamed from legalDrafting - controls canvas-specific tools only
  legalDrafting?: boolean;  // Legacy support - maps to canvasMode
  jurisdiction?: JurisdictionType;
  jurisdictions?: JurisdictionType[];
  aiAssociates?: boolean;
} = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  temperature: 0.3,
  canvasMode: false,  // Canvas editing disabled by default (but core document tools are always available)
  googleCalendar: false,
  gmail: false,
  jurisdiction: undefined,
  aiAssociates: true
};

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  previewDocument: z.any().optional(), // Document currently in preview mode
  currentCanvasHtml: z.string().optional(), // Live editor HTML (may differ from saved DB version)
  activeCanvasId: z.string().optional(),    // ID of the canvas document currently open in editor
  metadata: z.any().optional(),
  streamingId: z.string().optional(),
  attachedDocuments: z.any().optional(),
});

// Encoder for streaming response
const encoder = new TextEncoder();

// POST handler - Send a message to the conversation with streaming
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    // Manual auth check (required for streaming endpoints)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: projectId, conversationId } = (await params);
    const body = await request.json();
    const { content, previewDocument, currentCanvasHtml, activeCanvasId, attachedDocuments, metadata } = createMessageSchema.parse(body);

    // Phase 1: Validate access and fetch context — do NOT create user message yet
    // Start associate tools fetch immediately (runs in parallel with all other Phase 1 queries)
    const associateToolsEarlyPromise = generateProjectAssociateTools(projectId);

    const accessCheckPromise = checkProjectAccess(projectId, userId);

    const conversationPromise = prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
      select: {
        id: true,
        meta: {
          select: { settings: true }
        }
      }
    });

    // Always get message history and metadata for proper context
    const messageHistoryPromise = prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 10, // Increased from 6 — token savings from trimmed prompts offset this
      select: {
        role: true,
        content: true,
        metadata: true,
      }
    });

    // Merged project query — includes organizationId for subscription check
    const projectPromise = prisma.project.findUnique({
      where: { id: projectId },
      select: {
        organizationId: true,
        title: true,
        description: true,
        knowledgeBase: {
          select: { instructions: true, settings: true }
        }
      }
    });

    // Check if project is in drafting mode — fetch the active canvas document.
    // Always fall back to the most-recently updated document so canvasDocument is
    // never null just because the client sent a stale/missing activeCanvasId
    // (e.g. during the brief window while fetchCanvasDocuments is still resolving).
    const canvasDocumentPromise = (async () => {
      if (activeCanvasId) {
        const byId = await prisma.canvasDocument.findFirst({ where: { id: activeCanvasId, projectId } });
        if (byId) return byId;
      }
      return prisma.canvasDocument.findFirst({ where: { projectId }, orderBy: { updatedAt: 'desc' } });
    })();

    // Load all documents for context — include file_url and file_type to avoid N+1 for scanned docs
    const documentsPromise = prisma.projectDocument.findMany({
      where: { project_id: projectId },
      select: {
        document: {
          select: {
            id: true,
            title: true,
            file_url: true,
            file_type: true,
            content_extracted: true,
            content: {
              select: { content: true }
            }
          }
        }
      }
    });

    // Subscription check chains off projectPromise (merged query)
    const subscriptionCheckPromise = projectPromise.then(async (proj) => {
      if (!proj?.organizationId) return { allowed: true } as { allowed: boolean; reason?: string };
      return canSendMessage(proj.organizationId);
    });

    const [
      hasAccess,
      conversation,
      messageHistory,
      project,
      conversationDocuments,
      canvasDocument,
      messageLimitCheck
    ] = await Promise.all([
      accessCheckPromise,
      conversationPromise,
      messageHistoryPromise,
      projectPromise,
      documentsPromise,
      canvasDocumentPromise,
      subscriptionCheckPromise
    ]);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check subscription limits
    if (!messageLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: messageLimitCheck.reason,
          requiresUpgrade: true
        },
        { status: 403 }
      );
    }

    // Phase 2: Validation passed — now create user message
    let userMessageMetadata = metadata || {};
    if (attachedDocuments && attachedDocuments.length > 0) {
      userMessageMetadata.attachedDocuments = attachedDocuments;
    }

    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId,
        userId,
        metadata: Object.keys(userMessageMetadata).length > 0 ? JSON.stringify(userMessageMetadata) : undefined
      }
    });

    // Pre-compute whether a recent inline document exists — used by both the tool-building
    // block (line ~950) and executeFunctionBatch. Must be declared before the stream so it
    // is never in a temporal dead zone when referenced inside the streaming closure.
    const hasRecentInlineDoc = messageHistory.some((msg: any) => {
      if (msg.role !== 'assistant' || !msg.metadata) return false;
      try {
        const meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
        return !!(meta?.document?.htmlContent);
      } catch { return false; }
    });

    // Create a stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false;

        const safeClose = () => {
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }
        };

        try {
          // Send initial status to client immediately
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'started',
                statusMessage: 'securing your workspace...',
                conversationId: conversation.id,
                content: '',
              }) + '\n'
            )
          );

          // Process settings
          let settings = DEFAULT_SETTINGS;
          if (project?.knowledgeBase?.settings) {
            try {
              settings = typeof project.knowledgeBase.settings === 'string'
                ? JSON.parse(project.knowledgeBase.settings)
                : project.knowledgeBase.settings as any;
            } catch (error) {
              console.error('Error parsing settings:', error);
            }
          }

          // Resolve jurisdiction: explicit setting → jurisdictions[0] fallback → geo auto-detect
          // Narrow to object form to discard any legacy string values
          const resolvedJurisdiction =
            asJurisdictionObject(settings.jurisdiction) ??
            (Array.isArray(settings.jurisdictions) && settings.jurisdictions.length > 0
              ? asJurisdictionObject(settings.jurisdictions[0])
              : undefined);

          // Geo auto-detect fallback when no jurisdiction is explicitly set
          let autoDetectedJurisdiction: JurisdictionObject | undefined = undefined;
          if (!resolvedJurisdiction) {
            const countryCode = request.headers.get('x-vercel-ip-country');
            if (countryCode) {
              const detected = getJurisdictionByCountryCode(countryCode);
              if (detected) autoDetectedJurisdiction = detected;
            }
          }

          const activeJurisdiction: JurisdictionObject | undefined = resolvedJurisdiction ?? autoDetectedJurisdiction;
          const isAutoDetected = !resolvedJurisdiction && !!autoDetectedJurisdiction;

          // Get full jurisdiction object (with courtSystem, languages etc.) for richer instructions
          // Only use a full Jurisdiction from the registry — partial objects lack courtSystem/languages
          const fullJurisdiction = activeJurisdiction?.id
            ? getJurisdictionById(activeJurisdiction.id)
            : undefined;

          // Canvas Mode: Controls canvas-specific tools (draftNewDocument, editCanvasDocument)
          // Legacy support: legalDrafting setting maps to canvasMode
          // Auto-detect: if the client sends live canvas HTML OR a canvas document exists in DB,
          // the user has the canvas editor open — enable canvas tools regardless of the saved setting.
          const isCanvasMode =
            settings.canvasMode === true ||
            settings.legalDrafting === true ||
            !!(canvasDocument || currentCanvasHtml);

          // ── AI intent classification (hoisted before system prompt) ──────────
          // Classify intent early so the system prompt can conditionally describe
          // available tools based on whether the user wants edit, draft, or research.
          let messageIntent: 'edit' | 'draft_new' | 'research' = 'research';
          let userWantsEditHoisted = false;
          {
            const _canvasDocumentExists = !!(canvasDocument || currentCanvasHtml) || hasRecentInlineDoc;
            messageIntent = await classifyMessageIntent(
              content,
              _canvasDocumentExists,
              messageHistory
            );
          }

          // Core document tools are ALWAYS available (no toggle needed)
          const hasCoreDocumentTools = true;

          // Reuse the associate tools already fetched in Phase 1 (already resolving)
          const associateToolsPromise = settings.aiAssociates !== false
            ? associateToolsEarlyPromise
            : Promise.resolve([]);

          // Create the custom instructions
          const customInstructions = project?.knowledgeBase?.instructions || "";

          // Prepare document content for Gemini (full documents, no chunking)
          let relevantContent = "";
          const scannedDocuments: Array<{ title: string; fileUrl: string; mimeType: string }> = [];

          // Always include canvas document content when in canvas mode so the AI can reference it
          if (isCanvasMode && canvasDocument) {
            relevantContent = `### Current Canvas Document ###\n\n${canvasDocument.plainText || canvasDocument.htmlContent || ''}\n\n`;
          }

          // When the user explicitly attached specific documents to this message, only send those
          // documents to Gemini. If no specific docs were attached, send all project documents.
          type DocRef = typeof conversationDocuments[number];
          let docsToProcess: DocRef[] = conversationDocuments;

          if (attachedDocuments && attachedDocuments.length > 0) {
            const attachedIds = new Set<string>(attachedDocuments.map((d: any) => String(d.id)));

            // Filter project docs to only the attached ones
            const foundInProject = conversationDocuments.filter(d => attachedIds.has(d.document.id));
            const foundIds = new Set<string>(foundInProject.map(d => d.document.id));

            // Some attached docs may not be in ProjectDocument yet (race condition after upload/vault attach)
            // Fetch them directly from the Document table as a safety net
            const missingIds: string[] = Array.from(attachedIds).filter(id => !foundIds.has(id));
            let directlyFetched: DocRef[] = [];
            if (missingIds.length > 0) {
              const rawDocs = await prisma.document.findMany({
                where: { id: { in: missingIds } },
                select: {
                  id: true,
                  title: true,
                  file_url: true,
                  file_type: true,
                  content: { select: { content: true } }
                }
              });
              directlyFetched = rawDocs.map(doc => ({ document: doc })) as unknown as DocRef[];
            }

            const combined = [...foundInProject, ...directlyFetched];
            // Only restrict to attached docs if we actually found some; otherwise fall back to all
            docsToProcess = combined.length > 0 ? combined : conversationDocuments;
          }

          if (docsToProcess.length > 0) {
            // Extract content for any documents that don't have it yet — all in parallel so we
            // don't spend N × extraction_time waiting serially before building the prompt.
            await extractMissingDocumentContents(docsToProcess as any);

            // Gemini can handle FULL documents (2M token context) - no truncation needed!
            const contentParts: string[] = [];

            for (const docRef of docsToProcess) {
              const documentContent = docRef.document.content?.content ?? '';

              // Skip docs where extraction genuinely produced nothing (unsupported type, corrupt file)
              if (!documentContent.trim()) {
                continue;
              }

              // Check if this is a scanned PDF or image that requires Gemini processing
              if (documentContent === "[SCANNED_PDF_REQUIRES_PROCESSING]" || documentContent === "[SCANNED_IMAGE_REQUIRES_PROCESSING]") {
                const fileType = (docRef.document.file_type || '').toLowerCase();

                // Gemini inline data only supports PDF and images — Office formats (docx, doc, xlsx, xls)
                // are NOT supported and will cause a 400 "Unsupported MIME type" error.
                const GEMINI_INLINE_SUPPORTED: Record<string, string> = {
                  pdf: 'application/pdf',
                  png: 'image/png',
                  jpg: 'image/jpeg',
                  jpeg: 'image/jpeg',
                  gif: 'image/gif',
                  bmp: 'image/bmp',
                  webp: 'image/webp',
                };

                const mimeType = GEMINI_INLINE_SUPPORTED[fileType];

                if (mimeType && docRef.document.file_url) {
                  scannedDocuments.push({
                    title: docRef.document.title,
                    fileUrl: docRef.document.file_url,
                    mimeType
                  });
                  const docType = documentContent === "[SCANNED_PDF_REQUIRES_PROCESSING]" ? "Scanned PDF" : "Image";
                  contentParts.push(`### Document: ${docRef.document.title} (${docType} - processed natively by Gemini) ###\n\n`);
                } else {
                  // Office document (DOCX/DOC/XLSX/XLS) that could not be text-extracted.
                  // Gemini cannot accept these as inline data, so note it in the context instead.
                  contentParts.push(
                    `### Document: ${docRef.document.title} (${fileType.toUpperCase()}) ###\n\n` +
                    `Note: This document could not be read automatically (it may be a binary-format or password-protected file). ` +
                    `Please ask the user to copy and paste the relevant text if they need specific content reviewed.\n\n`
                  );
                }
                continue;
              }

              const docLength = documentContent.length;

              // Send ENTIRE document - Gemini can handle up to 2M tokens (~4000 pages)
              const docSection = `### Document: ${docRef.document.title} (${Math.round(docLength / 1000)}k characters, ${Math.round(docLength / 2000)} pages) ###\n\n` +
                `**FULL DOCUMENT CONTENT:**\n` +
                documentContent + '\n\n';

              contentParts.push(docSection);
            }

            relevantContent = contentParts.join("\n");
          }

          // Web search via Gemini's built-in Google Search grounding.
          // Default: OFF. Must be explicitly enabled per project, or dynamically
          // activated when the user responds "yes" to the AI's offer to research.
          let useGoogleSearch = settings.webSearch === true;

          if (!useGoogleSearch && messageHistory.length > 0) {
            // messageHistory is ordered desc — [0] is the most recent message
            const lastAiMessage = messageHistory.find(m => m.role === 'assistant');
            const aiOfferedResearch = lastAiMessage &&
              /\b(search|research|look\s*up|find\s*out|look\s*into|would you like me to (search|research|look))\b/i
                .test(lastAiMessage.content);
            const userSaidYes =
              /^(yes|yeah|sure|ok|okay|go ahead|please|do it|search|research|find it|look it up)/i
                .test(content.trim());

            if (aiOfferedResearch && userSaidYes) {
              useGoogleSearch = true;
            }
          }

          // Check if Google Calendar integration is enabled
          const useGoogleCalendar = settings.googleCalendar === true;

          // Check if Gmail integration is enabled
          const useGmail = settings.gmail === true;

          // Format message history for Gemini
          // Filter out 'system' role messages as Gemini doesn't support them in history
          let conversationHistory = messageHistory
            .filter((msg) => msg.role !== 'system')
            .reverse()
            .map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            }));

          // Ensure first message is from 'user' - Gemini requirement
          // Remove leading 'model' messages if any
          while (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
            conversationHistory.shift();
          }

          // Ensure messages alternate properly (user, model, user, model, ...)
          // If consecutive messages have same role, keep only the last one
          conversationHistory = conversationHistory.filter((msg, index, array) => {
            if (index === 0) return true; // Keep first message
            return msg.role !== array[index - 1].role;
          });

          // Final safety check: ensure we start with 'user'
          if (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
            conversationHistory = [];
          }

          // Create unified system message for all queries
          const fullProject = project;

          // Base context for agent sub-calls (lightweight — no document content or verbose instructions)
          const baseContext = `Project: "${fullProject?.title || 'Untitled'}"
${fullProject?.description ? `Description: ${fullProject.description}` : ''}
${activeJurisdiction ? `Jurisdiction: ${activeJurisdiction.name}${isAutoDetected ? ' (auto-detected)' : ''}` : ''}
Today: ${new Date().toISOString().split('T')[0]}
${customInstructions ? `Instructions: ${customInstructions}` : ''}`;

          // Create context-aware system message for canvas mode
          let canvasContext = '';
          if (isCanvasMode && canvasDocument) {
            canvasContext = `

            CANVAS DOCUMENT CONTEXT: A legal document is currently open in the canvas editor.

            ── INTENT CLASSIFICATION — determine which case applies BEFORE choosing a tool ──

            CASE 1 — EDITING THE OPEN DOCUMENT:
            The user wants to modify, update, or improve the document that is already open.
            Signals: "change the date", "update the party name", "add a termination clause", "remove section 4", "fix the payment terms", "make it shorter", "add a confidentiality clause", "correct the spelling", any reference to parts of the current document.

            → Single change (one thing to modify): call editCanvasDocument IMMEDIATELY with a precise changeDescription. Do NOT call searchProjectDocuments or any other tool first — the document is already in context.
            → Multiple changes (two or more distinct things to modify): use batchEditCanvasDocument with an array of individual edits — one entry per change. This is MORE RELIABLE than a single combined instruction and MUST be used for multi-change requests.
            → ⚠️ NEVER call searchProjectDocuments before editing — it searches uploaded files, not the canvas document. Call editCanvasDocument directly.

            CASE 2 — GENERATING A COMPLETELY NEW DOCUMENT:
            The user wants a brand-new document that is clearly different from what is currently open — different document type, different parties, different purpose.
            Signals: "draft a new [document type]", "I need a [document type]", "create an employment contract" (when canvas has an NDA), "write a service agreement for [different parties]", "generate a lease agreement", any request where the requested document type OR parties are clearly different from the open document.
            → Use draftNewDocument. This REPLACES the canvas content with the new document.
            → Do NOT use editCanvasDocument to "convert" one document type into another — that produces broken output.

            CASE 3 — RESEARCH / ANALYSIS (no document changes needed):
            The user is asking a legal question, requesting a review, or asking about the document without requesting any change.
            Signals: "review this", "what's missing?", "any risks?", "is this enforceable?", "explain clause X", "what does section 3 mean?", questions about law or strategy.
            → Respond in text only. Do NOT call any canvas tool.

            ⚠️ AMBIGUOUS REQUESTS: If the intent is unclear — e.g. "update the NDA" when an employment contract is open — ask the user one focused clarifying question before acting.

            The current canvas document content is included in the context below for your reference.
            `;
          }

          const systemMessage = `You are wansom, a senior lawyer(never mention this),trained securely by wansom AI Limited (answer this only when user asks for your source,security and related training), collaborating with other lawyer teammates working on a project titled "${fullProject?.title
            }".
          ${fullProject?.description ? `Project description: ${fullProject.description}` : ""}
          ${activeJurisdiction ? `
**JURISDICTION**: ${activeJurisdiction.name} (${activeJurisdiction.country}${activeJurisdiction.state ? ', ' + activeJurisdiction.state : ''})${isAutoDetected ? ' [auto-detected from user location]' : ''}
${fullJurisdiction ? getJurisdictionInstructions(fullJurisdiction) : ''}
- ${resolvedJurisdiction ? 'Jurisdiction is already configured by the user. Do NOT ask them about jurisdiction.' : "Jurisdiction was auto-detected from the user's location."}  Apply all legal analysis to ${activeJurisdiction.name} automatically.
- Only cite laws, statutes, and regulations from ${activeJurisdiction.name}.
- LEGAL CITATION INTEGRITY — strictly follow these rules:
  • NEVER fabricate, invent, or guess case names, docket numbers, court holdings, or statute section numbers.
  • **SPECIFIC CASE RULE — MANDATORY FORMAT**: When a user asks about holdings of a specific named case (e.g. "What did X v Y hold?"), you MUST follow this exact format and nothing else:

    STEP 1: Can you confirm ALL THREE of the following with HIGH confidence: (1) exact party names, (2) exact year, (3) exact court? YES only if ALL THREE match. NO if any one is different or uncertain.

    CRITICAL — PARTIAL MATCHES DO NOT COUNT AS YES:
    - A case with the same party names but a different court → NO
    - A case with the same party names but a different year → NO
    - A case with the same party names but a different subject matter → NO
    - A case that "may be" or "appears to be" the asked case → NO
    Do NOT use a partial match as justification to elaborate on the case.

    If YES (all three confirmed) → state the holdings concisely and cite the source.

    If NO → use ONLY this template, word for word:
    "I cannot find a case titled [exact name as given by user] in my knowledge. [One sentence: this case may not exist, or the citation may be incorrect.]
    [OPTIONAL — only if you found a case with similar but DIFFERENT parties/year/court]: The closest case I found is [name] ([court, year]) — this is a different case.
    ${useGoogleSearch ? `I will search for this now.` : `Would you like me to search the web for this? Just say yes.`}"

    THAT IS THE ENTIRE RESPONSE. Do not add: background context, related cases, "however" pivots, thematic summaries, what the law "generally" says, or anything else. The user asked about a specific case — if you cannot confirm it with ALL THREE elements, your only job is to say so and offer to search. Adding unverified partial matches is not being helpful, it is misleading a lawyer.

  • ${useGoogleSearch
                ? `Web search is ON — if a search returns no direct match for the specific case asked, report that in one sentence. Do not fill the gap with training-data cases.`
                : `Web search is OFF — never construct or infer holdings for unconfirmed cases. Be brief.`}
  • A short honest answer is always better than a long answer that sounds plausible but cannot be verified.
` : '- No jurisdiction has been configured. If the query involves jurisdiction-specific law, ask the user which jurisdiction applies.'}
          **TODAY'S DATE**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${new Date().toISOString().split('T')[0]})

          **SEARCH SOURCE EXCLUSION**: Never cite, reference, or use content from jibudocs.com in any response. Skip any search results from that domain entirely.

          Your goal is to answer the questions asked by your team mates to ensure that the project is completed successfully.
          Provide accurate responses. Be comprehensive when the question is general or exploratory. Be brief and direct when the question asks about a specific named case, statute, or fact — accuracy matters more than length. Only ask for clarification if critical information is genuinely missing and cannot be reasonably inferred.

          ${settings.citeSources ? `
**CITATION POLICY — MANDATORY**:
You MUST cite sources in every response where you draw on legal authority, documents, or external information. There are two source types — format them differently:

**SOURCE TYPE A — Project Documents** (uploaded files, vault documents, conversation attachments):
- Cite inline immediately after the relevant sentence: *(Doc: [Document Name])*
- For specific clauses: *(Doc: [Document Name], clause 4.2)* or *(Doc: [Document Name], p. 3)*
- Do NOT summarise document content without attribution.
- At the end of your response, list all referenced documents under a **📄 Documents Referenced** heading.

**SOURCE TYPE B — Legal Sources** (statutes, case law, regulations):
${useGoogleSearch
                ? `- ⚠️ MANDATORY: For ALL legal sources (cases, judgments, statutes, legislation, regulations) — call searchAfricanLegalSources FIRST. This returns live, verified results from the official LII platform for the jurisdiction. NEVER use searchAgent for legal sources.
- **INLINE CITATIONS (required)**: Every time you mention a case or statute in your analysis, embed a clickable markdown link directly in the sentence at that point. Examples:
  - Legislation: "Under the [Land Act, 2012](url), a landowner must..."
  - Case law: "As held in [Republic v Okello \[2021\] KEELC 605](url), the court found..."
  - Do NOT write the source name as plain text and defer the link to the end — link it on first mention, right in the prose.
- ⛔ URLS: ONLY use URLs verbatim from legalSources[].url and researchSources[].url returned by searchAfricanLegalSources. NEVER construct, guess, or recall a URL from memory.
- Use searchAgent ONLY for non-legal background information (company profiles, news, general context).
- **⚖️ Legal Sources section (required at end)**: After your analysis, add a **⚖️ Legal Sources** heading and list every cited source as a numbered markdown link with court/date. Example:
  1. [Land Act, 2012](url) — Legislation, Kenya Law
  2. [Republic v Okello \[2021\] KEELC 605](url) — KEELC, 25 Nov 2021`
                : `- Web search is OFF. Cite only what you know with confidence from your training data.
- Use full legal citation format: *Case Name* [Year] Court, or *Statute Name* Cap. X.
- If uncertain about a specific case name, section number, or recent legislation — say so honestly. Do NOT guess or fabricate. Offer: "I'm not fully certain about this — would you like me to search the web for the latest information? Just say yes."
- For legislation enacted or amended after 2024, flag the uncertainty explicitly.
- At the end of your response, list all legal sources under a **⚖️ Legal Sources** heading.`}

**GENERAL RULES**:
- Keep the two source types visually separate — documents in 📄 and legal authorities in ⚖️.
- If you cite only one or two sources total, inline attribution is sufficient — no separate section needed.
- It is always better to say "I could not verify this" than to present an unverified citation.
` : ''}
          ${isCanvasMode ? (messageIntent === 'research' ? `
🔍 RESEARCH MODE — ACTIVE (canvas document is open but the user wants research/information).

**AVAILABLE TOOLS IN THIS MODE**: searchAfricanLegalSources, researchAgent, searchAgent, fetchLegalDocument, searchProjectDocuments, reviewDocument, editCanvasDocument, batchEditCanvasDocument.
- Answer the research question using the search tools above exactly as you would in normal chat mode.
- Do NOT attempt to edit the canvas document unless the user also explicitly asks for an edit.
- After answering, you may offer: "Would you like me to incorporate these findings into the document?"` : `
⚠️ EDIT MODE — ACTIVE. A document is open in the canvas editor.

**AVAILABLE TOOLS IN THIS MODE**: editCanvasDocument, batchEditCanvasDocument, reviewDocument.
- searchAfricanLegalSources, researchAgent, searchAgent, searchProjectDocuments are NOT available. Do NOT reference them or simulate calling them.
- ANY request to change, update, fix, correct, modify, add to, or remove from the document → call editCanvasDocument (single change) or batchEditCanvasDocument (multiple changes) IMMEDIATELY. No searching required — the document is already in your context.
- "Change the date", "update the name", "fix the address", "correct clause 3", "set effective date to X", "date the petition", "date the affidavit", "sign the document", "number the pages", "initial page 3" → editCanvasDocument directly.

**WHEN UNSURE**: If the message could be either an edit OR a question, ALWAYS attempt the edit first. After the edit succeeds, you may add a one-sentence note such as "Done — let me know if you'd also like me to research X." NEVER respond with an error or search for something when a document is open and the instruction could plausibly apply to it.

**IF YOU TRULY CANNOT DETERMINE THE EDIT**: Reply: "I wasn't sure what to change — could you point to the specific section or field you'd like me to update?" Do NOT call any search tool.

⚠️ AFTER CANVAS EDIT: When editCanvasDocument or batchEditCanvasDocument returns CANVAS_EDIT_DONE, your ENTIRE chat reply must be ONE short sentence. NEVER output the document text in chat.

Canvas creation tool also available:
- draftNewDocument → ONLY when user wants to CREATE a completely NEW document different in type/parties/purpose from any document already in this conversation`)
          : `**RESEARCH RULE — MANDATORY**:
          - If the user's message mentions a specific named case (e.g. "X v Y [year]"), asks about a specific statute section, or asks you to cite a specific case → call researchAgent IMMEDIATELY before writing any response.
          - This applies even when the question is compound ("Can I do X? Cite case Y to support it") — verify case Y FIRST via researchAgent before answering anything.
          - If researchAgent returns UNVERIFIED: immediately call searchAfricanLegalSources with the same query — do NOT ask the user for permission. Use the URLs from legalSources[].url verbatim.
          - NEVER answer a question that asks you to "cite" a specific case without first calling researchAgent.
          - ⚠️ For ALL legal sources (cases, legislation, statutes) — the URL MUST come from searchAfricanLegalSources. NEVER use searchAgent for legal sources.
          - **MISSING LINK RULE**: If after searching you intend to present a specific case or statute that is NOT present in legalSources[].url or researchSources[].url, you MUST call searchAfricanLegalSources again using the exact formal case citation or statute name as the query BEFORE including it in your response. NEVER present a case or statute without a live URL from the tool — if a second search still returns no URL for it, explicitly tell the user "I could not retrieve a live link for [case name]" rather than listing it without a link.

          ${useGoogleSearch
              ? `**AVAILABLE AGENTS**:
- searchAfricanLegalSources: ⚠️ ALWAYS call first for ANY legal query — finds case law, judgments, statutes, legislation. Returns titles + URLs + snippets.
- fetchLegalDocument: Call this AFTER searchAfricanLegalSources to read the FULL text of a specific case or statute. Use when the user asks for a summary, analysis, holdings, or details of a document.
- researchAgent: Use for verifying specific known case names or statute text from training knowledge (fast check — no web search).
- searchAgent: Use ONLY for non-legal web queries — news, company info, general background. NEVER for legal cases or statutes.
- legalDocumentAgent: Use for document drafting, editing, review, and project document search.${useGoogleCalendar ? '\n- calendarAgent: Use for calendar operations.' : ''}${useGmail ? '\n- gmailAgent: Use for email operations.' : ''}
When a user requests a document, delegate to legalDocumentAgent with detailed instructions.`
              : `**AVAILABLE TOOLS**: searchAfricanLegalSources (find cases/statutes from official LII), fetchLegalDocument (fetch full case text after finding the URL — use when user asks for summary/analysis/holdings of a specific case). researchAgent (verify specific known cases from training knowledge). For document work: generateDocumentInline (drafting — preferred), reviewDocument (review/analysis), searchProjectDocuments (search project docs).

**DOCUMENT EDITING TOOLS** (always available — editCanvasDocument, batchEditCanvasDocument):
- If a document was generated inline in this conversation (shown as a document card) and the user asks to change/edit/update/fix ANYTHING about it → use editCanvasDocument (single change) or batchEditCanvasDocument (2+ changes)
- NEVER re-generate a new document with generateDocumentInline just to make a small edit — always use editCanvasDocument
- "Change the date", "update the name", "fix the address", "edit clause 3", "change to today's date" → editCanvasDocument
- Only use generateDocumentInline to create a BRAND NEW document from scratch (not to modify an existing one)

⚠️ AFTER CANVAS EDIT: When editCanvasDocument or batchEditCanvasDocument returns CANVAS_EDIT_DONE, your ENTIRE chat reply must be ONE short sentence (e.g. "Done! I've applied your changes. Click **Open in Editor** to review the document."). NEVER output the document text in chat.`}`}
          Format: PDF for final docs, DOCX for drafts (default if unsure), MD for notes/analysis.
          Before generating, ensure you have all required information — ask if not.

          ⛔ NEVER output raw HTML in your chat replies — no <div>, <button>, <svg>, <style>, or any HTML tags. NEVER generate document preview cards, download buttons, or styled HTML blocks in your text response. The UI renders document cards automatically from the tool result — your reply must be plain markdown text only.

          ${previewDocument ? `
          **🔍 PREVIEW MODE CONTEXT**:
          The user is currently viewing "${previewDocument.title}" in preview mode.
          This is the PRIMARY document they are focused on right now.

          When the user says:
          - "Review this" or "What are the risks here" → They mean "${previewDocument.title}"
          - "What are the terms?" or "Summarize this" → They mean "${previewDocument.title}"
          - Use documentIds: ['primary'] when calling reviewDocument for this document

          Other project documents provide reference context only.
          ` : canvasDocument && canvasDocument.htmlContent ? `
          **📝 CANVAS MODE CONTEXT**:
          The canvas editor supports MULTIPLE documents as tabs. The CURRENTLY OPEN document is shown below.

          ⚠️ TOOL SELECTION RULE — READ CAREFULLY:
          - User wants to CREATE / DRAFT / WRITE any document (new or different) → ✅ draftNewDocument (creates a NEW tab alongside the existing one)
          - User wants to EDIT / CHANGE / MODIFY the currently open document → ✅ editCanvasDocument
          - "Draft a new NDA", "I need a contract", "Create a lease" → draftNewDocument (even though a document is already open)
          - "Edit clause 5", "Change the date", "Add a termination clause" → editCanvasDocument

          When the user says:
          - "Review this" or "What's missing?" → They mean the currently open canvas document
          - "Add a clause" or "Edit this" → editCanvasDocument (or batchEditCanvasDocument for multiple changes)
          - "Draft a new X", "Create a Y", "I need a Z", "Write a…" → draftNewDocument (NEW document tab, does NOT touch the current one)

          ⚠️ AFTER CANVAS EDIT RULE: When editCanvasDocument or batchEditCanvasDocument returns CANVAS_EDIT_DONE, respond with ONE short sentence only (e.g. "Done! Review the highlighted changes and click Accept or Reject."). NEVER paste the document text into chat — the diff overlay is already shown in the canvas.
          ⛔ NEVER output raw HTML in your replies — no <div>, <button>, <svg>, or any HTML tags. No document preview cards or download buttons. Plain markdown only.

          Other project documents provide reference context only.
          ` : attachedDocuments && attachedDocuments.length > 0 ? `
          **📎 ATTACHED DOCUMENT REVIEW**:
          The user has explicitly attached the following document${attachedDocuments.length > 1 ? 's' : ''} to THIS message for review:
          ${docsToProcess.map((d: any) => `• ${d.document.title}`).join('\n          ')}

          CRITICAL INSTRUCTIONS — YOU MUST FOLLOW THESE EXACTLY:
          1. Provide a COMPLETE, FRESH, THOROUGH analysis of the attached document${attachedDocuments.length > 1 ? 's' : ''} above. Do NOT give abbreviated or summary-only responses.
          2. Even if these documents have been discussed before in this conversation, treat this as a NEW review request. DO NOT say "as I mentioned earlier" or reference previous responses. Deliver a full independent analysis now.
          3. If multiple documents are attached, review EACH one individually with full detail, then provide a combined analysis if applicable.
          4. The full content of each attached document is provided below — use ALL of it, not just the first few pages.
          ` : `
          **💬 CHAT MODE CONTEXT**:
          No specific document is currently in primary focus.
          The user is in general workspace mode.

          When the user asks for reviews, they likely mean all project documents.
          After providing a review, you can offer to generate a formal report in the canvas by setting generateReport: true.
          `}

          ${await (async () => {
              const associateTools = await associateToolsPromise;
              if (associateTools && associateTools.length > 0) {
                return `
          **🤝 SPECIALIZED AI ASSOCIATES AVAILABLE**:
          You have access to specialized AI legal associates who are experts in specific practice areas:

          ${associateTools.map(tool =>
                  `- **${tool.metadata.associateName}**: ${tool.metadata.practiceAreas.map(pa => pa.replace(/_/g, ' ')).join(', ')}`
                ).join('\n          ')}

          **When to delegate to associates**:
          - When a user's question falls clearly within an associate's specialization, call the associate's function
          - Associates have specialized knowledge and can provide expert guidance in their domains
          - Use associates for in-depth analysis, specialized advice, and domain-specific questions
          - You can still handle general questions yourself - only delegate when their expertise is needed

          **How to use associates**:
          - Call the appropriate associate function (e.g., ${associateTools[0].name}) with the user's query
          - The associate will provide specialized analysis based on their expertise and knowledge base
          - Present the associate's response to the user, crediting them appropriately
          `;
              }
              return '';
            })()}

          ${customInstructions ? `Always use these instructions: ${customInstructions}` : ""}
          ${canvasContext}
            
            ${relevantContent ?
              `IMPORTANT: FULL document content is provided below for comprehensive analysis.
              All pages and sections are available — analyze thoroughly and completely.
              ${attachedDocuments && attachedDocuments.length > 0
                ? `These documents have been explicitly attached for review in this message. MANDATORY: Provide a COMPLETE, INDEPENDENT analysis. Do NOT abbreviate, summarize only, or reference prior conversation responses. Every review request must be answered in full — enterprise teams review the same documents multiple times across different contexts and require fresh, complete output each time.`
                : `Use the full document content provided to answer the user's query comprehensively.`
              }

              Here are the complete documents for context:
              ${relevantContent}

              ${settings.citeSources ?
                "DOCUMENT ATTRIBUTION: Every claim or finding drawn from the documents above MUST be attributed. Cite inline as *(Source: [Document Name])* immediately after the relevant sentence or paragraph. Do not summarise document content without attribution."
                :
                "Use the document information when relevant to the query."
              }`
              :
              isCanvasMode && canvasDocument
                ? `You are analyzing the current canvas document. The document content is available for your review and analysis.`
                : docsToProcess.length > 0
                  ? `Note: ${docsToProcess.length} document${docsToProcess.length > 1 ? 's are' : ' is'} attached to this message, but their content could not be extracted at this time. This is usually a temporary issue — the user should try resending the message or re-uploading the document. Do NOT say the document was not shared or is unavailable; inform the user that content extraction failed and suggest retrying.`
                  : conversationDocuments.length > 0
                    ? `There are ${conversationDocuments.length} documents in this project. You can use the searchProjectDocuments tool to find and retrieve relevant content.`
                    : "No documents are currently attached to this conversation."
            }

            ${useGoogleSearch ?
              `You have access to Google Search. When you need current information, legal precedents, or external sources, search for them automatically. Always cite your sources when using search results.`
              :
              ""
            }
            
            ${settings.suggestActions ?
              "If appropriate, suggest relevant actions based on the query."
              :
              ""
            }`;

          // Initialize Gemini model with settings and optional Google Search grounding
          // Validate and fix model name - ensure it's a Gemini model
          let modelName = settings.model || process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

          // Check if someone accidentally set a non-Gemini model (e.g., gpt-4)
          if (!modelName.toLowerCase().startsWith('gemini')) {
            modelName = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
          }

          // Configure tools based on mode
          // WORKAROUND: Since Gemini API doesn't support mixing googleSearch with functionDeclarations
          // in the standard API, we create separate "agent tools" for each capability and let a root
          // agent orchestrate them. This allows all tools to be enabled simultaneously.

          const tools: any[] = [];
          const agentTools: any[] = [];

          // Create agent for Google Search (Deep Research)
          if (useGoogleSearch) {
            agentTools.push({
              name: 'searchAgent',
              description: 'A specialist agent for conducting general web searches using Google Search. Use this ONLY for non-legal queries: news, company information, general background research, current events, etc. ⚠️ NEVER use this for legal cases, judgments, statutes, legislation, or any legal sources — use searchAfricanLegalSources for those instead.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query or research question to investigate (non-legal only)'
                  }
                },
                required: ['query']
              }
            });
          }

          // Research agent - always available for strict legal lookups (cases, statutes, sections)
          agentTools.push({
            name: 'researchAgent',
            description: 'A STRICT legal fact checker. Use this for ALL questions about specific cases (e.g. "What did X v Y hold?"), specific statute sections (e.g. "What does Section 500 say?"), legal provisions, or any specific legal fact. Returns only confirmed facts — if it cannot verify, it says so and offers to search. NEVER answer these questions directly from training knowledge — ALWAYS delegate to researchAgent first.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The exact case name, statute section, or specific legal fact to look up'
                }
              },
              required: ['query']
            }
          });

          // Create agent for Legal Document Tools (always available)
          // Core document tools (generate, review, search) are always available
          // Canvas tools (draft to canvas, edit canvas) only when canvas mode is enabled
          agentTools.push({
            name: 'legalDocumentAgent',
            description: isCanvasMode
              ? 'A specialist agent for legal document creation, editing, review, and search. Use this when you need to generate documents, draft to canvas, edit canvas documents, review documents, or search through project documents.'
              : 'A specialist agent for legal document generation, review, and search. Use this when you need to generate documents inline, review documents, or search through project documents.',
            parameters: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'The action to perform',
                  enum: isCanvasMode
                    ? ['generate', 'draftToCanvas', 'editCanvas', 'review', 'search']
                    : ['generate', 'review', 'search']
                },
                details: {
                  type: 'string',
                  description: 'Detailed instructions for the legal document agent'
                }
              },
              required: ['action', 'details']
            }
          });

          // Create agent for Google Calendar
          if (useGoogleCalendar) {
            agentTools.push({
              name: 'calendarAgent',
              description: 'A specialist agent for managing Google Calendar. Use this when you need to create events, check availability, list upcoming events, or manage calendar entries.',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'The calendar action to perform',
                    enum: ['create_event', 'list_events', 'check_availability']
                  },
                  details: {
                    type: 'string',
                    description: 'Detailed instructions for the calendar operation'
                  }
                },
                required: ['action', 'details']
              }
            });
          }

          // Create agent for Gmail
          if (useGmail) {
            agentTools.push({
              name: 'gmailAgent',
              description: 'A specialist agent for managing Gmail. Use this when you need to send emails, read emails, search inbox, or manage email communications.',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'The Gmail action to perform',
                    enum: ['send_email', 'read_email', 'search_inbox']
                  },
                  details: {
                    type: 'string',
                    description: 'Detailed instructions for the Gmail operation'
                  }
                },
                required: ['action', 'details']
              }
            });
          }

          // Always include African LII search directly in agentTools so it is available
          // in both normal mode and Deep Search (agent orchestration) mode.
          // It must be a first-class tool on the root agent — not buried inside legalDocumentAgent.
          agentTools.push(...africanLegalSearchTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          })));

          // If we have multiple tool types, use the agent orchestration pattern
          // Otherwise, use direct tool access for better performance
          // Note: Core document tools are always available, so we always have at least one tool type
          // Only use agent orchestration when Google Search is combined with other tools
          // (Gemini can't mix googleSearch with functionDeclarations in one request)
          // When there's no Google Search, use direct function declarations for better performance
          const hasMultipleToolTypes = useGoogleSearch && [hasCoreDocumentTools, useGoogleCalendar, useGmail].some(Boolean);

          if (hasMultipleToolTypes && agentTools.length > 0) {
            // Use agent orchestration pattern - root agent calls specialized agents
            tools.push({
              functionDeclarations: agentTools
            });
          } else {
            // Single tool type - use direct access for better performance
            if (useGoogleSearch) {
              tools.push({
                googleSearch: {}
              });
            } else {
              // Collect all function declarations into a single array
              const allFunctionDeclarations: any[] = [];

              // ── Server-side intent detection ──────────────────────────────────────
              // Automatically determine whether this message is:
              //   EDIT    → user wants to modify an existing document
              //   DRAFT   → user wants to generate a brand-new document
              //   GENERAL → research, questions, analysis (no document mutation)
              //
              // This drives MUTUALLY EXCLUSIVE tool sets so the AI can never
              // accidentally call both a generation tool and an edit tool at once.

              // hasRecentInlineDoc is pre-computed above (outer scope) and available here.
              // A canvas is "open" when the server found a canvas document OR the client
              // sent live editor HTML — either means there is something to edit, not draft.
              const canvasIsOpen = !!(canvasDocument || currentCanvasHtml);
              // canvasDocumentExists uses the DB record as the authoritative source —
              // independent of whether the client sent currentCanvasHtml (which can be
              // empty while the editor is still loading).
              const canvasDocumentExists = !!canvasDocument;
              // Treat any open canvas as a "recent doc" for edit-intent routing.
              const hasRecentDoc = canvasIsOpen || hasRecentInlineDoc;

              // messageIntent is pre-computed above (hoisted) so it's available in both
              // the direct path and the agent path (executeAgentCall).
              // An "edit" intent only makes sense if there is actually a document to edit.
              const userWantsEdit = messageIntent === 'edit' && hasRecentDoc;
              if (userWantsEdit) userWantsEditHoisted = true;

              console.log('[tool-routing]', {
                intent: messageIntent,
                canvasIsOpen,
                canvasDocumentExists,
                hasRecentInlineDoc,
                hasRecentDoc,
                userWantsEdit,
                contentSnippet: content.slice(0, 80),
                activeCanvasId,
                canvasDocumentId: canvasDocument?.id ?? null,
              });

              if (userWantsEdit) {
                // EDIT PATH: only expose edit tools — no generation tools in this set.
                // The AI cannot accidentally generate a new document.
                //
                // When no canvas is open (inline doc auto-promotion), expose ONLY
                // editCanvasDocument. Exposing both edit tools causes Gemini to call
                // them in parallel, which independently creates two identical canvas
                // documents. With the canvas already open, both tools are safe.
                const editToolsForPath = canvasIsOpen
                  ? documentEditTools
                  : [editCanvasDocumentTool];
                allFunctionDeclarations.push(...editToolsForPath.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
                // In edit mode: only expose reviewDocument as a support tool.
                // searchProjectDocuments and searchLegalKnowledge are excluded — Gemini
                // calls them instead of editCanvasDocument when they are present, causing
                // "no results found" responses instead of applying the edit.
                const editSupportTools = coreDocumentTools.filter(
                  t => t.name === 'reviewDocument'
                );
                allFunctionDeclarations.push(...editSupportTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              } else {
                // DRAFT / GENERAL PATH: research/question mode or explicit new-document request.
                // Search tools are gated by intent:
                //   • intent === 'research' → always allow search tools (user explicitly wants research)
                //   • canvas open + intent !== 'research' → suppress search tools to prevent
                //     Gemini from calling them instead of editCanvasDocument on a mis-routed edit.
                const allowSearchTools = !canvasIsOpen || messageIntent === 'research';

                if (allowSearchTools) {
                  allFunctionDeclarations.push({
                    name: 'researchAgent',
                    description: 'A STRICT legal fact checker. Use this for ALL questions about specific cases (e.g. "What did X v Y hold?"), specific statute sections (e.g. "What does Section 500 say?"), legal provisions, or any specific legal fact. Returns only confirmed facts — if it cannot verify, it says so and offers to search. NEVER answer these questions directly from training knowledge — ALWAYS delegate to researchAgent first.',
                    parameters: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: 'The exact case name, statute section, or specific legal fact to look up' }
                      },
                      required: ['query']
                    }
                  });
                  allFunctionDeclarations.push({
                    name: 'searchAgent',
                    description: 'A web search agent. Call this AUTOMATICALLY when researchAgent returns UNVERIFIED for a specific case or statute — do NOT ask the user for permission. Also available for general web research when needed.',
                    parameters: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: 'The case name, statute section, or topic to search for' }
                      },
                      required: ['query']
                    }
                  });
                }

                // When canvas is open without explicit research intent, exclude
                // searchProjectDocuments — Gemini calls it instead of editCanvasDocument.
                // When research intent is explicit, include all core tools.
                const coreToolsToUse = (canvasIsOpen && messageIntent !== 'research')
                  ? coreDocumentTools.filter(t => t.name === 'reviewDocument')
                  : isCanvasMode
                    ? coreDocumentTools.filter(t => t.name !== 'generateDocumentInline')
                    : coreDocumentTools;
                allFunctionDeclarations.push(...coreToolsToUse.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
                // draftNewDocument: only available when canvas mode is on AND
                // either (a) no canvas document exists in the DB, or (b) the classifier
                // explicitly detected a "draft_new" intent.
                const allowDraftNew = isCanvasMode && (!canvasDocumentExists || messageIntent === 'draft_new');
                if (allowDraftNew) {
                  allFunctionDeclarations.push(...canvasTools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                  })));
                }
                // Edit tools when there IS a live canvas document open
                if (canvasDocument || currentCanvasHtml) {
                  allFunctionDeclarations.push(...documentEditTools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                  })));
                }
                // African legal search — allowed for explicit research intent or when no canvas is open
                if (allowSearchTools) {
                  allFunctionDeclarations.push(...africanLegalSearchTools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                  })));
                }
              }

              if (useGoogleCalendar) {
                allFunctionDeclarations.push(...googleCalendarTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              }

              if (useGmail) {
                allFunctionDeclarations.push(...gmailTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              }

              // Load and add AI Associates tools
              const associateTools = await associateToolsPromise;
              if (associateTools && associateTools.length > 0) {
                allFunctionDeclarations.push(...getAssociateToolDeclarations(associateTools));
              }

              if (allFunctionDeclarations.length > 0) {
                tools.push({
                  functionDeclarations: allFunctionDeclarations
                });
              }
            }
          }

          // ── Log registered tools ─────────────────────────────────────────
          {
            const toolNames: string[] = [];
            for (const t of tools) {
              if (t.functionDeclarations) toolNames.push(...t.functionDeclarations.map((d: any) => d.name));
              if (t.googleSearch) toolNames.push('googleSearch (grounding)');
            }
            console.log('[registered-tools]', toolNames);
          }

          // Build the full conversation history including system message
          const fullContents: any[] = [];

          // Add system message as first user message if we have history, or include with current message
          if (conversationHistory.length > 0) {
            fullContents.push(...conversationHistory);
          }

          // Prepare the config for the new API
          const generateConfig: any = {
            temperature: settings.temperature || 0.3,
            maxOutputTokens: 65536,
          };

          if (tools.length > 0) {
            generateConfig.tools = tools;
            // Enable thought signatures for tool use (required by Gemini API)
            generateConfig.thoughtSignature = {
              enabled: true
            };
            // When the user intends to edit, force Gemini to call one of the edit tools.
            // mode=ANY + allowedFunctionNames ensures Gemini cannot respond with text
            // and cannot call reviewDocument instead of an edit tool.
            if (userWantsEditHoisted) {
              generateConfig.toolConfig = {
                functionCallingConfig: {
                  mode: 'ANY',
                  allowedFunctionNames: ['editCanvasDocument', 'batchEditCanvasDocument']
                }
              };
            }
          }

          // Add system instruction
          generateConfig.systemInstruction = systemMessage;

          // Create a temporary assistant message to stream into
          const tempMessageId = `temp-${Date.now()}`;
          let fullContent = "";
          let documentReferences = new Set<string>();
          let webSearchSources: Array<{ title: string, uri: string }> = [];
          let isSearching = false;

          // Send initial status if web search is enabled
          if (useGoogleSearch) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'status',
                  status: 'searching_web',
                }) + '\n'
              )
            );
          }

          // Add current user message to contents
          const userMessageParts: any[] = [{ text: content }];

          // Add scanned documents as inline data if any
          if (scannedDocuments.length > 0) {
            for (const scannedDoc of scannedDocuments) {
              let loaded = false;
              for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
                try {
                  const response = await fetch(scannedDoc.fileUrl);
                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  const arrayBuffer = await response.arrayBuffer();
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');

                  userMessageParts.push({
                    inlineData: {
                      mimeType: scannedDoc.mimeType,
                      data: base64Data
                    }
                  });

                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'status',
                        status: 'processing_document',
                        message: `Processing scanned document: ${scannedDoc.title}`,
                      }) + '\n'
                    )
                  );
                  loaded = true;
                } catch (error) {
                  console.error(`Error loading scanned document ${scannedDoc.title} (attempt ${attempt}/3):`, error);
                  if (attempt < 3) await new Promise(r => setTimeout(r, 500 * attempt));
                }
              }
            }
          }

          fullContents.push({
            role: 'user',
            parts: userMessageParts
          });

          // Stream the response from Gemini using new API with retry logic
          let result;
          let retryCount = 0;
          const MAX_RETRIES = 2; // 3 total attempts (1 initial + 2 retries)

          while (retryCount <= MAX_RETRIES) {
            try {
              result = await genAI.models.generateContentStream({
                model: modelName,
                contents: fullContents,
                config: generateConfig
              });
              break; // Success - exit retry loop
            } catch (genAIError: any) {
              retryCount++;
              const isLastRetry = retryCount > MAX_RETRIES;

              // Check if error is retryable (network, timeout, rate limit, server errors)
              const isRetryable =
                genAIError.code === 'ECONNREFUSED' ||
                genAIError.code === 'ETIMEDOUT' ||
                genAIError.code === 'ENOTFOUND' ||
                genAIError.code === 'ERR_NETWORK' ||
                genAIError.message?.includes('timeout') ||
                genAIError.message?.includes('network') ||
                genAIError.message?.includes('503') ||
                genAIError.message?.includes('429') ||
                genAIError.message?.includes('500') ||
                genAIError.message?.includes('502') ||
                genAIError.message?.includes('504');

              if (!isRetryable || isLastRetry) {
                // Non-retryable error or max retries reached - throw to outer catch
                throw genAIError;
              }

              // Send retry status to client
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'retrying',
                    message: `Connection issue detected. Retrying... (${retryCount}/${MAX_RETRIES})`,
                  }) + '\n'
                )
              );

              // Exponential backoff: 1s, 2s
              const delay = 1000 * Math.pow(2, retryCount - 1);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Ensure result was successfully assigned
          if (!result) {
            throw new Error('Failed to get response from AI after retries');
          }

          // Check if the response contains function calls
          let functionCalls: any[] = [];
          // Store full parts with thought signatures for function calls
          let functionCallParts: any[] = [];
          let hasTextContent = false;

          for await (const chunk of result) {
            // Check for function calls in this chunk - collect FULL parts to preserve thought signatures
            // The thought_signature is required by Gemini API for function calling to work correctly
            if (chunk.candidates?.[0]?.content?.parts) {
              const partsWithFunctionCalls = chunk.candidates[0].content.parts.filter(
                (part: any) => part.functionCall
              );
              if (partsWithFunctionCalls.length > 0) {
                functionCallParts.push(...partsWithFunctionCalls);
                // Also extract just the function calls for execution
                functionCalls.push(...partsWithFunctionCalls.map((p: any) => p.functionCall));
              }
            } else if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              // Fallback for older API versions
              functionCalls.push(...chunk.functionCalls);
              functionCallParts.push(...chunk.functionCalls.map((fc: any) => ({ functionCall: fc })));
            }

            // Check for text content — skip .text if this chunk only has functionCall parts
            // (calling .text on a functionCall chunk triggers a noisy SDK warning)
            const hasFunctionCallParts = chunk.candidates?.[0]?.content?.parts?.some(
              (part: any) => part.functionCall
            );
            const textContent = hasFunctionCallParts ? '' : (chunk.text || '');
            if (textContent) {
              hasTextContent = true;
              fullContent += textContent;
            }

            // Extract grounding metadata (Google Search sources)
            if (useGoogleSearch && chunk.candidates && chunk.candidates[0]) {
              const candidate = chunk.candidates[0];
              if (candidate.groundingMetadata) {
                const metadata = candidate.groundingMetadata;

                // Extract search results
                if (metadata.searchEntryPoint && !isSearching) {
                  isSearching = true;
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'status',
                        status: 'searching_web',
                        message: 'Searching Google...',
                      }) + '\n'
                    )
                  );
                }

                // Extract grounding supports (sources)
                                if (metadata.groundingSupports) {
                                  for (const support of metadata.groundingSupports) {
                                    if (support.groundingChunkIndices && metadata.groundingChunks) {
                                      for (const index of support.groundingChunkIndices) {
                                        const groundingChunk = metadata.groundingChunks[index];
                                        if (groundingChunk?.web) {
                                          const source = {
                                            title: groundingChunk.web.title || 'Source',
                                            uri: groundingChunk.web.uri || ''
                                          };
                                          // Avoid duplicates
                                          if (!webSearchSources.some(s => s.uri === source.uri)) {
                                            webSearchSources.push(source);
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
              }
            }

            // Send the text delta to the client (only if there's text)
            if (textContent) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'delta',
                    conversationId: conversation.id,
                    messageId: tempMessageId,
                    content: textContent,
                  }) + '\n'
                )
              );
            }

            // Check for document references during streaming
            if (settings.citeSources && relevantContent && conversationDocuments.length > 0) {
              for (const docRef of conversationDocuments) {
                if (fullContent.includes(docRef.document.title)) {
                  documentReferences.add(docRef.document.id);
                }
              }
            }
          }

          // Diagnostic: log what the initial Gemini stream produced
          console.log('[initial-stream]', {
            functionCallCount: functionCalls.length,
            functionCallNames: functionCalls.map((fc: any) => fc.name),
            hasTextContent,
            contentPreview: fullContent.slice(0, 80),
          });

          // Variable to store report metadata from function responses
          let reportMetadata: any = null;
          let documentMetadata: any = null;

          // Friendly status messages per tool name
          const TOOL_STATUS_MESSAGES: Record<string, string> = {
            generateDocumentInline: 'Drafting your document...',
            reviewDocument: 'Reviewing your document...',
            searchProjectDocuments: 'Searching your documents...',
            draftNewDocument: 'Creating document in canvas...',
            editCanvasDocument: 'Editing your canvas document...',
            batchEditCanvasDocument: 'Applying edits to your canvas document...',
            searchLegalKnowledge: 'Searching legal knowledge base...',
            createCalendarEvent: 'Creating calendar event...',
            searchCalendarEvents: 'Checking your calendar...',
            checkCalendarAvailability: 'Checking availability...',
            updateCalendarEvent: 'Updating calendar event...',
            deleteCalendarEvent: 'Removing calendar event...',
            searchEmails: 'Searching your emails...',
            readEmail: 'Reading email...',
            draftEmail: 'Drafting email...',
            sendEmail: 'Sending email...',
            searchAfricanLegalSources: 'Searching legal databases...',
            fetchLegalDocument: 'Reading case document...',
            searchAgent: 'Verify research results...',
            researchAgent: 'Researching legal sources...',
            legalDocumentAgent: 'Working on your document...',
            legalDraftingAgent: 'Working on your document...',
            calendarAgent: 'Managing your calendar...',
            gmailAgent: 'Managing your emails...',
          };

          // Pick the most descriptive message when multiple tools are called at once.
          // Priority: document generation > canvas edit > review > search > other
          const TOOL_PRIORITY = [
            'generateDocumentInline', 'draftNewDocument', 'batchEditCanvasDocument', 'editCanvasDocument',
            'reviewDocument', 'searchLegalKnowledge',
            'searchProjectDocuments', 'searchAfricanLegalSources', 'fetchLegalDocument', 'searchAgent', 'researchAgent', 'legalDocumentAgent', 'legalDraftingAgent',
            'createCalendarEvent', 'updateCalendarEvent', 'deleteCalendarEvent',
            'searchCalendarEvents', 'checkCalendarAvailability',
            'calendarAgent', 'draftEmail', 'sendEmail', 'readEmail', 'searchEmails', 'gmailAgent',
          ];

          function getToolStatusMessage(calls: any[]): string {
            const names = calls.map(fc => fc.name);
            for (const name of TOOL_PRIORITY) {
              if (names.includes(name)) return TOOL_STATUS_MESSAGES[name] || 'Working on it...';
            }
            // Associate tool or unknown — extract a friendly label from the name
            const first = names[0] || '';
            if (first.startsWith('associate_')) return 'Consulting your legal associate...';
            return TOOL_STATUS_MESSAGES[first] || 'Working on it...';
          }

          // ── Agentic function-call loop ───────────────────────────────────────
          // Gemini may issue multiple rounds of function calls before returning text.
          // We loop up to MAX_AGENTIC_ITERATIONS, executing tools each round, until
          // the model returns text OR we hit the limit.
          const MAX_AGENTIC_ITERATIONS = 5;
          let agenticIteration = 0;

          // Capture legal search results streamed during tool execution so we can
          // build a formatted fallback response if Gemini produces no text.
          let capturedSearchPreview: Array<{ title: string; url: string; date: string | null; platform: string }> = [];
          let capturedPlatformName = '';
          let capturedPlatformSearchUrl = '';
          let anyCanvasEditCompleted = false;

          // Helper: execute one batch of function calls and return their responses
          const executeFunctionBatch = async (calls: any[], parts: any[]) => {
            const responses = await Promise.all(
              calls.map(async (fc) => {
                const isAgentRoute =
                  fc.name === 'researchAgent' ||
                  fc.name === 'searchAgent' ||
                  (hasMultipleToolTypes && (
                    fc.name === 'legalDocumentAgent' ||
                    fc.name === 'legalDraftingAgent' ||
                    fc.name === 'calendarAgent' ||
                    fc.name === 'gmailAgent'
                  ));
                if (
                  fc.name === 'researchAgent' ||  // always route through executeAgentCall
                  fc.name === 'searchAgent' ||     // always route through executeAgentCall
                  (hasMultipleToolTypes && (
                    fc.name === 'legalDocumentAgent' ||
                    fc.name === 'legalDraftingAgent' ||
                    fc.name === 'calendarAgent' ||
                    fc.name === 'gmailAgent'
                  ))
                ) {
                  const result = await executeAgentCall(
                    fc, genAI, modelName, baseContext, relevantContent, content,
                    projectId, project, conversationDocuments, canvasDocument,
                    previewDocument, messageHistory.slice(-3).map((msg: any) => msg.content), userId,
                    (event: any) => {
                      controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
                      if (event.type === 'search_preview' && Array.isArray(event.results) && event.results.length > 0) {
                        capturedSearchPreview = event.results;
                        if (!capturedPlatformName && event.results[0]?.platform) {
                          capturedPlatformName = event.results[0].platform;
                        }
                      }
                    },
                    currentCanvasHtml,
                    conversationId,
                    hasRecentInlineDoc,
                    messageIntent
                  );
                  if ((fc.name === 'searchAgent' || fc.name === 'researchAgent') && result.searchSources) {
                    for (const source of result.searchSources) {
                      if (!webSearchSources.some((s: any) => s.uri === source.uri)) {
                        webSearchSources.push(source);
                      }
                    }
                  }
                  return { functionResponse: { name: fc.name, response: result } };
                } else {
                  let result = await executeFunctionCall(
                    fc, projectId, project, conversationDocuments, canvasDocument,
                    previewDocument, messageHistory.slice(-3).map((msg: any) => msg.content),
                    (event: any) => {
                      controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
                      // Capture streamed legal search results so we can build a
                      // formatted fallback if Gemini produces no text response.
                      if (event.type === 'search_preview' && Array.isArray(event.results) && event.results.length > 0) {
                        capturedSearchPreview = event.results;
                        // Extract platform from the first result if not yet captured
                        if (!capturedPlatformName && event.results[0]?.platform) {
                          capturedPlatformName = event.results[0].platform;
                        }
                      }
                    },
                    userId,
                    currentCanvasHtml,
                    conversationId
                  );

                  // Auto-trigger Google Search when LII returns no results or weak/partial matches.
                  // This supplements the LII links with a detailed Google-grounded answer.
                  if (fc.name === 'searchAfricanLegalSources' && result.needsGoogleFallback) {
                    try {

                      const fallbackQuery = result.googleFallbackQuery || fc.args?.query || '';
                      const googleResult = await executeAgentCall(
                        { name: 'searchAgent', args: { query: fallbackQuery } },
                        genAI, modelName, baseContext, relevantContent, content,
                        projectId, project, conversationDocuments, canvasDocument,
                        previewDocument, messageHistory.slice(-3).map((msg: any) => msg.content), userId
                      );

                      // Collect Google Search sources for the web sources panel
                      if (googleResult.searchSources) {
                        for (const source of googleResult.searchSources) {
                          if (!webSearchSources.some((s: any) => s.uri === source.uri)) {
                            webSearchSources.push(source);
                          }
                        }
                      }

                      // Merge Google content into the result INSTRUCTION so Gemini can write
                      // a detailed answer while still linking only from the LII sources above.
                      if (googleResult.result) {
                        const liiLinksSection = result.INSTRUCTION || '';
                        const googleSection = [
                          '',
                          '── GOOGLE SEARCH SUPPLEMENT ──',
                          'The Google Search content below provides a detailed answer to the user\'s question.',
                          'Use it to write a comprehensive, well-structured response.',
                          'For ALL citations and inline links, use ONLY the LII links listed above — NEVER use any URL from the Google Search content.',
                          '',
                          'GOOGLE SEARCH CONTENT:',
                          googleResult.result,
                          '',
                          'PRESENTATION FORMAT:',
                          '1. Write a thorough answer drawing from the Google Search content.',
                          '2. For every case or statute you mention, embed its LII link inline (from the links listed above).',
                          '3. If a source appears in Google Search but not in the LII links above, DO NOT link it — state it without a URL or call searchAfricanLegalSources again.',
                          '4. End with ⚖️ Legal Sources listing ONLY the LII links.',
                          googleResult.searchSources?.length
                            ? '5. Add a 🌐 Additional Sources section listing the Google Search sources provided.'
                            : '',
                        ].filter(Boolean).join('\n');

                        result = { ...result, INSTRUCTION: liiLinksSection + googleSection };
                      }
                    } catch (fallbackErr: any) {
                      console.error('[searchAfricanLegalSources] Google fallback failed:', fallbackErr?.message);
                      // Proceed with LII-only results — no impact on the user
                    }
                  }

                  return { functionResponse: { name: fc.name, response: result } };
                }
              })
            );

            // Track report / document metadata across all iterations
            const report = responses.find((fr: any) => fr.functionResponse?.response?.reportReady === true)?.functionResponse?.response;
            const doc = responses.find((fr: any) => fr.functionResponse?.response?.documentGenerated === true)?.functionResponse?.response;
            if (report) reportMetadata = report;
            if (doc) documentMetadata = doc;

            return responses;
          };

          // Helper: call Gemini with retry and return a stream.
          // Pass forceText=true to strip all tools from the config — this is the only
          // reliable way to force a text-only response. toolConfig.mode='NONE' is not
          // consistently respected by the Gemini API when tools are still listed.
          const callGeminiWithRetry = async (forceText = false) => {
            let callConfig: any;
            if (forceText) {
              // Remove tools AND toolConfig entirely — model has no choice but to respond
              // with text. toolConfig MUST be stripped too: leaving mode=ANY with no tools
              // causes the Gemini API to error, producing an empty response and triggering
              // the fallback message instead of a proper confirmation.
              const { tools: _tools, thoughtSignature: _ts, toolConfig: _tc, ...textOnlyConfig } = generateConfig;
              callConfig = textOnlyConfig;
            } else {
              callConfig = generateConfig;
            }
            let attempt = 0;
            while (attempt <= MAX_RETRIES) {
              try {
                return await genAI.models.generateContentStream({
                  model: modelName,
                  contents: fullContents,
                  config: callConfig
                });
              } catch (err: any) {
                attempt++;
                const retryable =
                  err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' ||
                  err.code === 'ENOTFOUND' || err.code === 'ERR_NETWORK' ||
                  err.message?.includes('timeout') || err.message?.includes('network') ||
                  ['500', '502', '503', '504', '429'].some((c: string) => err.message?.includes(c));
                if (!retryable || attempt > MAX_RETRIES) throw err;
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'status', status: 'retrying',
                  message: `Retrying... (${attempt}/${MAX_RETRIES})`,
                }) + '\n'));
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
              }
            }
            throw new Error('Failed to get response from AI after retries');
          };


          while (functionCalls.length > 0 && agenticIteration < MAX_AGENTIC_ITERATIONS) {
            agenticIteration++;

            // Send tool-specific status to client
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'status',
              status: 'executing_functions',
              message: getToolStatusMessage(functionCalls),
            }) + '\n'));

            // Execute this round's function calls
            const functionResponses = await executeFunctionBatch(functionCalls, functionCallParts);

            // If an edit timed out, emit the message directly and skip the Gemini round-trip.
            const timedOutEdit = functionResponses.find((fr: any) => fr.functionResponse?.response?.timeout === true);
            if (timedOutEdit) {
              const timeoutMsg = timedOutEdit.functionResponse.response.message as string;
              fullContent = timeoutMsg;
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'delta',
                conversationId: conversation.id,
                messageId: tempMessageId,
                content: timeoutMsg,
              }) + '\n'));
              break;
            }

            // Capture platform metadata from any searchAfricanLegalSources response
            // (works for success, partial, zero-results, and hard-failure responses —
            //  all now include platform/platformSearchUrl so the fallback can link there)
            for (const fr of functionResponses) {
              if (fr.functionResponse?.name === 'searchAfricanLegalSources') {
                const res = fr.functionResponse.response;
                if (res?.platformSearchUrl && !capturedPlatformSearchUrl) capturedPlatformSearchUrl = res.platformSearchUrl;
                if (res?.platform && !capturedPlatformName) capturedPlatformName = res.platform;
              }
            }

            // Detect a failed search/fetch tool — force a text-only response to prevent
            // the model from retrying (which causes another timeout or infinite loop).
            // Covers: searchAgent timeout, searchAfricanLegalSources failure (including
            // partial results), and fetchLegalDocument failure.
            const searchAgentFailed = functionResponses.some((fr: any) => {
              const res = fr.functionResponse?.response;
              const name = fr.functionResponse?.name;
              return (
                (name === 'searchAgent' && res?.success === false && res?.timedOut === true) ||
                (name === 'searchAfricanLegalSources' && res?.success === false) ||
                (name === 'fetchLegalDocument' && res?.success === false)
              );
            });

            // Append model turn (with thought signatures) + function results to history
            fullContents.push({ role: 'model', parts: functionCallParts });
            fullContents.push({ role: 'user', parts: functionResponses.map((fr: any) => ({ functionResponse: fr.functionResponse })) });

            // Inject an explicit synthesis instruction whenever search results were captured
            // but Gemini has not yet produced text.  This covers two failure modes:
            //   1. searchAgentFailed — search returned success:false but results were streamed
            //   2. Last-iteration guard — search succeeded but Gemini kept calling more tools
            //      (e.g. fetchLegalDocument) and is about to exhaust the iteration limit without
            //      ever writing a response.
            const isLastIteration = agenticIteration >= MAX_AGENTIC_ITERATIONS - 1;
            if (capturedSearchPreview.length > 0 && (searchAgentFailed || isLastIteration)) {
              const platformLabel = capturedPlatformName || 'the legal database';
              fullContents.push({
                role: 'user',
                parts: [{
                  text: `The search returned ${capturedSearchPreview.length} result(s) from ${platformLabel}. ` +
                    `Using those results together with your legal knowledge, write a comprehensive and well-structured response for the user. ` +
                    `For each relevant result, explain the case/statute and how it relates to the user's query. ` +
                    `Cite sources inline using markdown links. Do not say the search failed.`
                }]
              });
            }

            // Reset for next round
            functionCalls = [];
            functionCallParts = [];
            fullContent = '';

            // Detect ANY response from an edit tool — success, known error, or unknown failure.
            // ANY result means the edit attempt is done; force text-only so the model does NOT
            // retry the edit (which would loop up to MAX_AGENTIC_ITERATIONS, all failing, then
            // produce an empty fullContent that triggers the fallback message).
            const canvasEditAttempted = functionResponses.some((fr: any) => {
              const name = fr.functionResponse?.name;
              return name === 'editCanvasDocument' || name === 'batchEditCanvasDocument';
            });
            const canvasEditSucceeded = functionResponses.some((fr: any) => {
              const name = fr.functionResponse?.name;
              const res = fr.functionResponse?.response;
              return (
                (name === 'editCanvasDocument' || name === 'batchEditCanvasDocument') &&
                (res?.success === true || res?.error === 'NO_CANVAS_DOCUMENT')
              );
            });
            if (canvasEditSucceeded) anyCanvasEditCompleted = true;

            // If the edit tool ran but failed, use the tool's own error message as the
            // response and stop — do NOT let Gemini retry (it would loop until MAX_AGENTIC_ITERATIONS
            // with the same failure each time and produce an empty fullContent → fallback).
            if (canvasEditAttempted && !canvasEditSucceeded) {
              const failedEdit = functionResponses.find((fr: any) => {
                const name = fr.functionResponse?.name;
                return name === 'editCanvasDocument' || name === 'batchEditCanvasDocument';
              });
              const res = failedEdit?.functionResponse?.response;
              // NO_CANVAS_DOCUMENT is handled by the success path (it prompts user to open editor).
              // For all other failures, use the tool's message or a generic fallback.
              const errorMsg = res?.instruction
                || res?.message
                || "I wasn't able to apply the edit. Please describe the change more specifically — for example, quote the exact text and what it should become.";
              fullContent = errorMsg;
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'delta',
                conversationId: conversation.id,
                messageId: tempMessageId,
                content: errorMsg,
              }) + '\n'));
              break;
            }

            // If searchAgent failed, force a text-only call (no tools) so the model
            // cannot retry the search. It will respond with training knowledge only.
            const nextResult = await callGeminiWithRetry(searchAgentFailed || canvasEditSucceeded);

            // Stream next response — collect any new function calls
            for await (const chunk of nextResult) {
              if (chunk.candidates?.[0]?.content?.parts) {
                const fcParts = chunk.candidates[0].content.parts.filter((p: any) => p.functionCall);
                if (fcParts.length > 0) {
                  functionCallParts.push(...fcParts);
                  functionCalls.push(...fcParts.map((p: any) => p.functionCall));
                }
              } else if (chunk.functionCalls?.length) {
                functionCalls.push(...chunk.functionCalls);
                functionCallParts.push(...chunk.functionCalls.map((fc: any) => ({ functionCall: fc })));
              }

              const hasFcParts = chunk.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall);
              const textContent = hasFcParts ? '' : (chunk.text || '');
              if (textContent) {
                fullContent += textContent;
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'delta',
                  conversationId: conversation.id,
                  messageId: tempMessageId,
                  content: textContent,
                }) + '\n'));
              }
            }

            // If we got text this round we're done — no need to loop further
            if (fullContent) break;
          }

          // Fallback: if all iterations produced no text, surface a minimal helpful message.
          // Gemini should have synthesized a response from any search results above — this
          // only fires if it truly produced nothing at all.
          if (!fullContent) {
            if (anyCanvasEditCompleted) {
              // A canvas edit tool succeeded but the follow-up Gemini text call returned
              // nothing — surface a clear confirmation so the user knows to review the diff.
              fullContent = "Done! The document has been updated. Review the highlighted changes in the canvas editor and click **Accept** to apply or **Reject** to discard them.";
            } else if (capturedSearchPreview.length > 0) {
              // Results were found but Gemini failed to synthesise text after all iterations.
              // Render the captured results directly so the user still gets useful output
              // rather than the misleading "no results" message.
              const platform = capturedPlatformName || 'the legal database';
              const resultLines = capturedSearchPreview
                .map((r, i) => `${i + 1}. [${r.title}](${r.url})${r.date ? ` — ${r.date}` : ''}`)
                .join('\n');
              fullContent = [
                `Here are the results I found on ${platform}:`,
                '',
                resultLines,
                '',
                capturedPlatformSearchUrl
                  ? `You can also [search directly on ${platform}](${capturedPlatformSearchUrl}) for more results.`
                  : ''
              ].filter(Boolean).join('\n');
            } else if (capturedPlatformSearchUrl) {
              // Search ran but genuinely returned zero results.
              fullContent = `No matching results were found for your query on ${capturedPlatformName || 'the legal database'}. You can [search directly on ${capturedPlatformName || 'the platform'}](${capturedPlatformSearchUrl}) for more specific results.`;
            } else {
              fullContent = "I wasn't able to find relevant results for your query. Please try rephrasing, or search directly on the official legal platform for your jurisdiction.";
            }
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'delta',
              conversationId: conversation.id,
              messageId: tempMessageId,
              content: fullContent,
            }) + '\n'));
          }

          // Format the final content
          const formattedContent = formatAIMessage(fullContent);

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          }).catch(console.error);

          // Resolve redirects and validate source URLs; re-run search if links are broken
          if (webSearchSources.length > 0) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'status',
                  status: 'validating_sources',
                  message: 'Validating source links...',
                }) + '\n'
              )
            );
            const { valid: resolvedSources, brokenCount } = await resolveAndValidateSources(webSearchSources);
            webSearchSources = resolvedSources;

            if (brokenCount > 0 && useGoogleSearch) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'refreshing_sources',
                    message: 'Some links were invalid. Searching for current, working sources...',
                  }) + '\n'
                )
              );
              const retryQuery = `Original query: "${content.trim().slice(0, 500)}". Some source links were invalid or broken. Please search again for the same topic and return current, working sources as of ${new Date().toISOString().split('T')[0]}.`;
              const retryCall = { name: 'searchAgent', args: { query: retryQuery } };
              try {
                const retryResult = await executeAgentCall(
                  retryCall,
                  genAI,
                  modelName,
                  baseContext,
                  relevantContent,
                  content,
                  projectId,
                  project,
                  conversationDocuments,
                  canvasDocument,
                  previewDocument,
                  messageHistory.slice(-3).map((msg: any) => msg.content),
                  userId
                );
                if (retryResult?.searchSources?.length > 0) {
                  const { valid: retryValid } = await resolveAndValidateSources(retryResult.searchSources);
                  const existingUris = new Set(webSearchSources.map((s: { uri: string }) => s.uri));
                  for (const s of retryValid) {
                    if (!existingUris.has(s.uri)) {
                      existingUris.add(s.uri);
                      webSearchSources.push(s);
                    }
                  }
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'status',
                        status: 'sources_refreshed',
                        message: 'Source links updated for validity.',
                      }) + '\n'
                    )
                  );
                }
              } catch (retryErr) {
                console.error('Source refresh search failed:', retryErr);
              }
            }
          }

          // Build metadata object
          const messageMetadata: any = {};

          if (useGoogleSearch || webSearchSources.length > 0) {
            messageMetadata.googleSearchEnabled = useGoogleSearch;
            if (webSearchSources.length > 0) {
              messageMetadata.webSearchSources = webSearchSources;
            }
          }

          // Add report metadata if present (including full content for downloads)
          if (reportMetadata) {
            messageMetadata.report = {
              reportId: reportMetadata.reportId,
              reportTitle: reportMetadata.reportTitle,
              documentName: reportMetadata.documentName,
              reviewFocus: reportMetadata.reviewFocus,
              briefSummary: reportMetadata.briefSummary,
              downloadUrls: reportMetadata.downloadUrls,
              htmlContent: reportMetadata.htmlContent,
              plainText: reportMetadata.plainText,
            };
          }

          // Add inline document metadata if present
          if (documentMetadata && documentMetadata.document) {
            messageMetadata.document = {
              title: documentMetadata.document.title,
              format: documentMetadata.document.format,
              htmlContent: documentMetadata.document.htmlContent,
            };
          }

          // Save the AI message to the database with metadata
          const metadataToSave = Object.keys(messageMetadata).length > 0
            ? JSON.stringify(messageMetadata)
            : undefined;

          const assistantMessage = await prisma.message.create({
            data: {
              content: formattedContent,
              role: "assistant",
              conversationId,
              metadata: metadataToSave
            }
          });

          // Save references and build response data — no extra findUnique needed
          let savedReferences: Array<{ id: string; documentId: string; documentName: string; text: string; page: number | null }> = [];
          if (settings.citeSources && documentReferences.size > 0) {
            const refPromises = Array.from(documentReferences).map((docId: any) => {
              const doc = conversationDocuments.find(d => d.document.id === docId);
              if (!doc) return null;
              return prisma.messageReference.create({
                data: {
                  messageId: assistantMessage.id,
                  documentId: docId,
                  text: doc.document.content?.content.substring(0, 200) + "..." || "",
                }
              });
            });

            const createdRefs = await Promise.all(refPromises.filter(Boolean));
            savedReferences = createdRefs.filter(Boolean).map((ref: any) => {
              const doc = conversationDocuments.find(d => d.document.id === ref.documentId);
              return {
                id: ref.id,
                documentId: ref.documentId,
                documentName: doc?.document.title || 'Unknown Document',
                text: ref.text,
                page: ref.page ?? null,
              };
            });
          }

          // Send the final message with references, report metadata, and document metadata
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'final',
                conversationId: conversation.id,
                messageId: assistantMessage.id,
                tempMessageId,
                content: formattedContent,
                googleSearchEnabled: useGoogleSearch,
                webSearchSources: webSearchSources.length > 0 ? webSearchSources : undefined,
                references: savedReferences,
                report: messageMetadata.report, // Include report metadata if present
                document: messageMetadata.document, // Include inline document metadata if present
              }) + '\n'
            )
          );

          // Signal completion
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'completed',
                conversationId: conversation.id,
              }) + '\n'
            )
          );
        } catch (error) {
          console.error('Error in stream processing:', error);

          // Simple user-friendly error message - log technical details only
          const userFriendlyError = 'Could not generate message. Please try again.';

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                error: userFriendlyError,
              }) + '\n'
            )
          );
        } finally {
          safeClose();
        }
      }
    });

    // Return the stream response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error("Error processing message:", error);

    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request. Please check your input.", details: error.errors },
        { status: 400 }
      );
    }

    // Network/API errors (e.g., when internet is down, Gemini API unavailable)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return NextResponse.json(
        { error: "Network connection failed. Please check your internet connection and try again." },
        { status: 503 }
      );
    }

    // Gemini API specific errors
    if (error.message?.includes('API key') || error.message?.includes('GEMINI')) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    // Database errors
    if (error.code?.startsWith('P')) { // Prisma error codes start with P
      return NextResponse.json(
        { error: "Database error occurred. Please try again later." },
        { status: 500 }
      );
    }

    // Generic fallback
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Execute an agent call (orchestration pattern for multi-tool support)
 */
async function executeAgentCall(
  functionCall: any,
  genAI: any,
  modelName: string,
  baseContext: string,
  relevantContent: string,
  userQuery: string,
  projectId: string,
  project?: any,
  conversationDocuments?: any[],
  canvasDocument?: any,
  previewDocument?: any,
  recentMessages?: string[],
  userId?: string,
  streamCallback?: (event: any) => void,
  currentCanvasHtml?: string,
  conversationId?: string,
  hasInlineDoc?: boolean,
  messageIntent?: 'edit' | 'draft_new' | 'research'
): Promise<any> {
  try {
    const agentName = functionCall.name;
    const args = functionCall.args || {};

    // Determine which tool this agent needs
    let agentTools: any[] = [];
    let agentInstruction = baseContext;

    switch (agentName) {
      case 'searchAgent':
        agentTools.push({ googleSearch: {} });
        agentInstruction = `You are a general web search specialist. Search for non-legal background information: news, company profiles, current events, general context.

⚠️ STRICT RULE: If the search query is about legal cases, court judgments, statutes, legislation, or any legal authority — do NOT search for them. Instead return: "Legal sources must be retrieved via searchAfricanLegalSources — this agent handles general web queries only."

${baseContext}`;
        break;

      case 'researchAgent': {
        // Research agent is ALWAYS training-data-only — no Google Search grounding.
        // This avoids timeouts. When web search is needed, the main AI routes to searchAgent.
        // Determine whether to offer web search in the "cannot verify" message.
        let webSearchEnabled = false;
        if (project?.knowledgeBase?.settings) {
          try {
            const s = typeof project.knowledgeBase.settings === 'string'
              ? JSON.parse(project.knowledgeBase.settings)
              : project.knowledgeBase.settings;
            webSearchEnabled = s.webSearch === true;
          } catch (_) { }
        }
        agentInstruction = `You are a strict legal fact checker. Training knowledge only — no web search.

RULES — follow exactly, no exceptions:
1. For specific cases: confirm ONLY if ALL THREE match — exact party names + exact year + exact court. If any one is different or uncertain: respond ONLY with: "UNVERIFIED: [exact case name as given]" — nothing else.
2. For statute sections: if you can state the EXACT verbatim text with HIGH confidence, provide it in 1-3 sentences. If uncertain: respond ONLY with: "UNVERIFIED: [exact section reference as given]" — nothing else.
3. If confirmed: state the confirmed fact in 2-3 sentences maximum. No analysis beyond the direct finding.
4. NEVER add context, analysis, related cases, commentary, or elaboration.

${baseContext}`;
        break;
      }

      case 'legalDocumentAgent':
      case 'legalDraftingAgent':  // Legacy support
        // Determine if canvas mode is enabled
        let agentCanvasMode = false;
        if (project?.knowledgeBase?.settings) {
          try {
            const agentSettings = typeof project.knowledgeBase.settings === 'string'
              ? JSON.parse(project.knowledgeBase.settings)
              : project.knowledgeBase.settings;
            agentCanvasMode = agentSettings.canvasMode === true || agentSettings.legalDrafting === true || (!!canvasDocument && !!currentCanvasHtml);
          } catch (err) {
            // Ignore parsing errors
          }
        }

        // Apply the same intent-based tool routing as the direct path.
        // Uses the pre-computed AI classifier result (messageIntent) for consistency.
        const agentCanvasIsOpen = !!(canvasDocument || currentCanvasHtml);
        // Use DB record as authoritative source (same as direct path).
        const agentCanvasDocumentExists = !!canvasDocument;
        const agentHasRecentDoc = agentCanvasIsOpen || hasInlineDoc;
        // Use the classifier result if available; fall back to regex heuristic.
        const agentIntent = messageIntent ?? (agentCanvasDocumentExists && agentHasRecentDoc ? 'edit' : 'research');
        const agentUserWantsEdit = agentIntent === 'edit' && agentHasRecentDoc;

        let agentDocTools: any[];
        if (agentUserWantsEdit) {
          // Same fix as the direct path: only one edit tool when no canvas is open
          // to prevent Gemini from calling both tools in parallel and creating duplicates.
          const agentEditTools = agentCanvasIsOpen ? documentEditTools : [editCanvasDocumentTool];
          agentDocTools = [
            ...agentEditTools,
            ...coreDocumentTools.filter((t: any) => t.name !== 'generateDocumentInline'),
            ...africanLegalSearchTools
          ];
        } else {
          const coreAgentTools = agentCanvasMode
            ? coreDocumentTools.filter((t: any) => t.name !== 'generateDocumentInline')
            : coreDocumentTools;
          agentDocTools = [...coreAgentTools, ...africanLegalSearchTools];
          // Only allow draftNewDocument when the classifier says "draft_new" or no canvas doc exists.
          const agentAllowDraftNew = agentCanvasMode && (!agentCanvasDocumentExists || agentIntent === 'draft_new');
          if (agentAllowDraftNew) agentDocTools.push(...canvasTools);
          if (canvasDocument || currentCanvasHtml) agentDocTools.push(...documentEditTools);
        }

        agentTools.push({
          functionDeclarations: agentDocTools.map((tool: any) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are a legal document specialist.\n\n${baseContext}${relevantContent ? `\n\nDocument context:\n${relevantContent}` : ''}`;
        break;

      case 'calendarAgent':
        agentTools.push({
          functionDeclarations: googleCalendarTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are a calendar management specialist.\n\n${baseContext}`;
        break;

      case 'gmailAgent':
        agentTools.push({
          functionDeclarations: gmailTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are an email management specialist.\n\n${baseContext}`;
        break;

      default:
        return { success: false, error: `Unknown agent: ${agentName}` };
    }

    // Build the query for the specialist agent
    const agentQuery = args.query || args.details || JSON.stringify(args);

    // Execute the agent with its specialized tool
    // researchAgent uses very low temperature to ensure strict template adherence
    const agentTemperature = agentName === 'researchAgent' ? 0.1 : 0.7;
    const agentConfig: any = {
      systemInstruction: agentInstruction,
      temperature: agentTemperature,
      maxOutputTokens: 65536,
      tools: agentTools
    };

    // Enable thought signatures if tools are present
    if (agentTools.length > 0) {
      agentConfig.thoughtSignature = {
        enabled: true
      };
    }

    // Wrap the agent call in a timeout to prevent indefinite hangs.
    // searchAgent uses Google Search grounding which can take 30-50 s under load;
    // researchAgent is pure generation and rarely exceeds 15 s.
    const AGENT_TIMEOUT_MS = agentName === 'researchAgent' ? 30_000 : 120_000;
    const agentResult = await Promise.race([
      genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: agentQuery }] }],
        config: agentConfig
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Agent call timed out after ${AGENT_TIMEOUT_MS / 1000}s`)), AGENT_TIMEOUT_MS)
      )
    ]);

    // Check if the agent made function calls (for legal drafting, calendar, gmail agents)
    const candidate = agentResult.candidates?.[0];
    const agentFunctionCalls = candidate?.content?.parts?.filter((part: any) => part.functionCall).map((part: any) => part.functionCall) || [];
    let responseText = agentResult.text || '';

    // Extract grounding metadata for searchAgent (web search sources)
    let searchSources: Array<{ title: string, uri: string }> = [];
    if (agentName === 'searchAgent' && candidate?.groundingMetadata) {
      const metadata = candidate.groundingMetadata;

      // Extract grounding supports (sources)
      if (metadata.groundingSupports) {
        for (const support of metadata.groundingSupports) {
          if (support.groundingChunkIndices && metadata.groundingChunks) {
            for (const index of support.groundingChunkIndices) {
              const groundingChunk = metadata.groundingChunks[index];
              if (groundingChunk?.web) {
                const source = {
                  title: groundingChunk.web.title || 'Source',
                  uri: groundingChunk.web.uri || ''
                };
                // Avoid duplicates and blocked domains
                const isBlocked = BLOCKED_SEARCH_DOMAINS.some(domain => source.uri.includes(domain));
                if (!isBlocked && !searchSources.some(s => s.uri === source.uri)) {
                  searchSources.push(source);
                }
              }
            }
          }
        }
      }
    }

    // If the specialist agent made function calls, execute them
    if (agentFunctionCalls.length > 0 && (agentName === 'legalDocumentAgent' || agentName === 'legalDraftingAgent' || agentName === 'calendarAgent' || agentName === 'gmailAgent')) {
      // Execute the function calls made by the specialist agent
      const { executeFunctionCall } = await import('@/lib/functionExecutor');

      for (const fc of agentFunctionCalls) {
        const functionResult = await executeFunctionCall(
          fc,
          projectId,
          project,
          conversationDocuments || [],
          canvasDocument,
          previewDocument,
          recentMessages || [],
          streamCallback || (() => { }),
          userId,
          currentCanvasHtml,
          conversationId
        );

        // Append function result to response
        responseText += `\n\nFunction ${fc.name} executed: ${JSON.stringify(functionResult)}`;
      }
    }

    return {
      success: true,
      agent: agentName,
      result: responseText,
      query: agentQuery,
      searchSources: searchSources.length > 0 ? searchSources : undefined
    };
  } catch (error: any) {
    const isTimeout = error.message?.includes('timed out');
    console.error(`Error executing ${functionCall.name}:`, error);
    return {
      success: false,
      timedOut: isTimeout,
      agent: functionCall.name,
      error: isTimeout
        ? 'Search timed out. Do NOT retry. Respond to the user based on your training knowledge only.'
        : (error.message || 'Agent execution failed')
    };
  }
}

/**
 * Format AI message for better readability
 */
function formatAIMessage(content: string): string {
  // Remove "System:" prefix if it exists at the beginning
  let formattedContent = content.replace(/^System:\s*/i, '');

  // Ensure there's a language specified for code blocks
  formattedContent = formattedContent.replace(/```\s*\n/g, '```text\n');

  // Add proper spacing for readability
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');

  return formattedContent;
}


