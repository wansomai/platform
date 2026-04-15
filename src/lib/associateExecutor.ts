// src/lib/associateExecutor.ts
// Executes AI Associate function calls as a bounded agentic loop.

import { GoogleGenAI, Type } from '@google/genai';
import prisma from '@/lib/prisma';
import { findAssociateByFunctionName } from './associateTools';
import { getJurisdictionById, getJurisdictionInstructions } from '@/lib/jurisdictions';
import { loadKBDocumentsWithSummaries } from '@/services/kbSummaryService';
import {
  generateDocumentInlineTool,
  draftNewDocumentTool,
  editCanvasDocumentTool,
  batchEditCanvasDocumentTool,
  reviewDocumentTool,
  searchProjectDocumentsTool,
  searchAfricanLegalSourcesTool,
  fetchLegalDocumentTool,
} from './geminiTools';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_ITERATIONS = 5;

type JurisdictionContext = {
  id?: string;
  name: string;
  country: string;
  state?: string;
};

type AssociateJurisdictionContext = {
  activeJurisdiction?: JurisdictionContext;
  selectedJurisdictions: JurisdictionContext[];
  isAutoDetected: boolean;
};

function asJurisdictionObject(value: unknown): JurisdictionContext | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const maybeJurisdiction = value as Partial<JurisdictionContext>;
  if (typeof maybeJurisdiction.name !== 'string' || typeof maybeJurisdiction.country !== 'string') {
    return undefined;
  }
  return {
    id: typeof maybeJurisdiction.id === 'string' ? maybeJurisdiction.id : undefined,
    name: maybeJurisdiction.name,
    country: maybeJurisdiction.country,
    state: typeof maybeJurisdiction.state === 'string' ? maybeJurisdiction.state : undefined,
  };
}

function dedupeJurisdictions(jurisdictions: JurisdictionContext[]): JurisdictionContext[] {
  const seen = new Set<string>();
  const deduped: JurisdictionContext[] = [];
  for (const jurisdiction of jurisdictions) {
    const key = jurisdiction.id ?? `${jurisdiction.name.toLowerCase()}::${jurisdiction.country.toLowerCase()}::${(jurisdiction.state ?? '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(jurisdiction);
    }
  }
  return deduped;
}

function resolveJurisdictionContextFromProject(
  project: any,
  override?: Partial<AssociateJurisdictionContext>
): AssociateJurisdictionContext {
  let settings: any = {};
  if (project?.knowledgeBase?.settings) {
    try {
      settings = typeof project.knowledgeBase.settings === 'string'
        ? JSON.parse(project.knowledgeBase.settings)
        : project.knowledgeBase.settings;
    } catch {
      settings = {};
    }
  }

  const selectedFromSettings = [
    asJurisdictionObject(settings?.jurisdiction),
    ...(Array.isArray(settings?.jurisdictions)
      ? settings.jurisdictions.map((item: unknown) => asJurisdictionObject(item))
      : []),
  ].filter(Boolean) as JurisdictionContext[];

  const selectedJurisdictions = dedupeJurisdictions([
    ...(override?.selectedJurisdictions ?? []),
    ...selectedFromSettings,
  ]);

  const activeJurisdiction =
    override?.activeJurisdiction ??
    selectedJurisdictions[0];

  const isAutoDetected = override?.isAutoDetected ?? false;

  return { activeJurisdiction, selectedJurisdictions, isAutoDetected };
}

// Maps the toolId strings stored in AssociateTool.toolId to their Gemini
// tool declaration objects. Only tools in this map can be given to an associate.
const TOOL_DECLARATION_REGISTRY: Record<string, any> = {
  reviewDocument:            reviewDocumentTool,
  searchProjectDocuments:    searchProjectDocumentsTool,
  generateDocumentInline:    generateDocumentInlineTool,
  editCanvasDocument:        editCanvasDocumentTool,
  batchEditCanvasDocument:   batchEditCanvasDocumentTool,
  draftNewDocument:          draftNewDocumentTool,
  searchAfricanLegalSources: searchAfricanLegalSourcesTool,
  fetchLegalDocument:        fetchLegalDocumentTool,
};

// Tools every associate always gets regardless of their declared tool set.
// Research tools are scoped by the associate's system prompt (practice areas + instructions).
// Drafting tools are always available so associates can produce proper document artifacts
// instead of printing raw text into the chat.
const ALWAYS_AVAILABLE_TOOLS = [
  'searchAfricanLegalSources',
  'fetchLegalDocument',
  'searchProjectDocuments',
  'reviewDocument',
  'generateDocumentInline',
  'draftNewDocument',
  'editCanvasDocument',
  'batchEditCanvasDocument',
];

// invoke_orchestrator_tool declaration — always given to every associate.
// Lets the associate borrow any system-level tool without losing its own context.
const INVOKE_ORCHESTRATOR_TOOL = {
  name: 'invoke_orchestrator_tool',
  description:
    'Execute a system-level tool (canvas editing, document generation, legal search, etc.) ' +
    'that is outside your declared scope. The result is returned directly to you so you can ' +
    'interpret it with your expertise and respond to the user. Use this when the user asks ' +
    'you to perform an action you do not have a declared tool for.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      toolName: {
        type: Type.STRING,
        description:
          'The exact name of the tool to invoke, e.g. editCanvasDocument, ' +
          'generateDocumentInline, searchAfricanLegalSources.',
      },
      toolArgs: {
        type: Type.OBJECT,
        description: 'The arguments to pass to the tool, matching its parameter schema.',
        properties: {},
      },
    },
    required: ['toolName', 'toolArgs'],
  },
};

// delegate_to_associate declaration — given to associates when depth < 2.
const DELEGATE_TO_ASSOCIATE_TOOL = {
  name: 'delegate_to_associate',
  description:
    'Hand off a sub-task to another specialist associate assigned to this project. ' +
    'Use when the task clearly falls outside your own practice area and another ' +
    'associate in the project is better suited to handle it.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      associateName: {
        type: Type.STRING,
        description: 'The exact name of the target associate as it appears in the project.',
      },
      task: {
        type: Type.STRING,
        description: 'The specific sub-task to delegate, with sufficient context.',
      },
    },
    required: ['associateName', 'task'],
  },
};

// suggest_associate — use this (not delegate_to_associate) when the question falls
// outside your practice areas. Surfaces a one-click switch card for the user.
// You continue answering with a general-knowledge disclaimer rather than handing off.
const SUGGEST_ASSOCIATE_TOOL = {
  name: 'suggest_associate',
  description:
    'Suggest that the user switch to a better-suited specialist associate for this query. ' +
    'Call this FIRST when the question is clearly outside your practice areas, then answer ' +
    'with a general-knowledge disclaimer. This shows the user a one-click switch button.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      associateName: {
        type: Type.STRING,
        description: 'The exact name of the suggested specialist associate.',
      },
      reason: {
        type: Type.STRING,
        description: 'One sentence explaining why that specialist is better suited.',
      },
    },
    required: ['associateName', 'reason'],
  },
};

/**
 * Builds the system prompt for an associate, incorporating its instructions,
 * workflow steps, knowledge base, jurisdiction context, and project instructions.
 */
function buildAssociateSystemPrompt(
  associate: any,
  project: any,
  knowledgeBaseContent: string,
  peerSpecialists: Array<{ id: string; name: string; practiceAreas: string[] }> = [],
  jurisdictionContext?: AssociateJurisdictionContext
): string {
  const practiceAreasText = associate.practiceAreas
    .map((pa: string) => pa.replace(/_/g, ' '))
    .join(', ');

  const stepsBlock =
    associate.steps && associate.steps.length > 0
      ? `\n**Your Workflow**:\n${associate.steps
          .map((step: any, idx: number) => `${idx + 1}. ${step.description}`)
          .join('\n')}\n`
      : '';

  const kbBlock = knowledgeBaseContent
    ? `\n**Your Specialized Knowledge Base**:\n\n${knowledgeBaseContent}\n\n**KB CONSULTATION RULE — MANDATORY**:\n1. For EVERY query, FIRST check whether your Knowledge Base documents contain relevant information.\n2. If the KB has relevant content, ground your answer in it — cite the document title and specific sections.\n3. Only supplement with general legal knowledge AFTER exhausting KB content.\n4. When drafting documents, use KB content as templates, precedent, or reference for clauses and structure.\n5. NEVER ignore KB content when it is directly relevant to the user's question.\n6. If the KB contains conflicting information with general knowledge, prefer the KB and note the discrepancy.\n`
    : '';

  const activeJurisdiction = jurisdictionContext?.activeJurisdiction;
  const selectedJurisdictions = jurisdictionContext?.selectedJurisdictions ?? [];
  const fullActiveJurisdiction = activeJurisdiction?.id
    ? getJurisdictionById(activeJurisdiction.id)
    : undefined;
  const jurisdictionInstructions = fullActiveJurisdiction
    ? getJurisdictionInstructions(fullActiveJurisdiction)
    : '';
  const selectedListText = selectedJurisdictions.length > 0
    ? selectedJurisdictions
        .map((j) => `${j.name}${j.state ? `, ${j.state}` : ''} (${j.country})`)
        .join('; ')
    : '';
  const jurisdictionBlock = activeJurisdiction
    ? `\n**Jurisdiction Context**:\n- Active jurisdiction: ${activeJurisdiction.name} (${activeJurisdiction.country}${activeJurisdiction.state ? `, ${activeJurisdiction.state}` : ''})${jurisdictionContext?.isAutoDetected ? ' [auto-detected]' : ''}\n${selectedListText ? `- All selected jurisdictions available: ${selectedListText}\n` : ''}${jurisdictionInstructions ? `- ${jurisdictionInstructions}\n` : ''}- Apply legal analysis to the active jurisdiction by default unless the user explicitly asks to compare or switch jurisdiction.\n`
    : '';

  const projectBlock = project?.knowledgeBase?.instructions
    ? `\n**Project Instructions**: ${project.knowledgeBase.instructions}\n`
    : '';

  // Build the peer-specialists block — shown only when other specialists exist in the project.
  // Associates MUST use the exact names listed here when calling suggest_associate.
  const peersBlock = peerSpecialists.length > 0
    ? `\n**Other Specialists Available in This Project** (use their EXACT names when calling suggest_associate):\n${
        peerSpecialists
          .map(p => `- ${p.name} — ${p.practiceAreas.map(pa => pa.replace(/_/g, ' ')).join(', ')}`)
          .join('\n')
      }\n`
    : '';

  return `You are ${associate.name}, an AI legal associate specializing in ${practiceAreasText}.

**Your Instructions**:
${associate.instructions}
${stepsBlock}${kbBlock}${jurisdictionBlock}${projectBlock}${peersBlock}
**Your Role**: You are a specialized AI legal associate. Provide expert-level responses drawing on your specialized knowledge and experience in ${practiceAreasText}.

**KB TRANSPARENCY RULE — MANDATORY**:
When the user asks any of these intents — "Who are you?", "What is your knowledge base?", "Summarize your knowledge base", "What documents are attached?" or similar:
1. You MUST explicitly use the "KNOWLEDGE BASE INVENTORY" provided in your prompt.
2. List the attached KB document titles and their status (summary YES/NO, text extracted YES/NO).
3. Do NOT claim your KB is just generic legal expertise. Distinguish clearly between:
   - your general practice-area expertise, and
   - project-attached KB documents.
4. If no documents are attached, say that clearly.
5. If the user asks for a KB summary, summarize the attached KB documents first (using their summaries/content), then optionally add one short line on your general capabilities.
6. When a query is relevant to KB-derived rules, begin your response with a brief line in this format:
   Applying Rules: <comma-separated rule themes you are using>.
   Then continue with your reasoning and answer.

**KB STATUS BLOCK — STRICTLY CONDITIONAL**:
Include the following block ONLY when the user explicitly asks about KB status, KB summary, or attached KB documents.
Do NOT include this block for normal legal/drafting questions.
KNOWLEDGE BASE STATUS
Documents attached: <number>
Formats supported: .doc, .docx, .pdf
KB created: <YES/NO>
Summary generated: <YES/NO/PARTIAL>
Attached to agent: <YES/NO>
Retrieval enabled: <YES/NO/PARTIAL>

**OUT-OF-SCOPE RULE — MANDATORY**:
When the user's question falls clearly outside your practice areas (${practiceAreasText}):
1. Call suggest_associate FIRST using the EXACT name from the "Other Specialists" list above. If no list is shown, skip the tool call and proceed to step 2.
2. Then answer the question using your general legal knowledge, BUT begin your response with this exact disclaimer on its own line:
   > ⚠️ **General answer** — this falls outside my specialty as ${associate.name}. Select the suggested specialist below for a more expert response.
3. Keep the general answer concise. Do not pretend it is within your specialty.

When a question IS within your practice areas, answer fully and expertly — no disclaimer needed.

**DRAFTING RULE — MANDATORY**:
When the user asks you to draft, write, create, prepare, or produce any document (contracts, letters, agreements, notices, policies, pleadings, etc.):
1. FIRST, check your Knowledge Base for relevant templates, clauses, or precedent documents that can inform the draft.
2. Call \`generateDocumentInline\` with a detailed \`draftingInstruction\` that includes the document type, jurisdiction, parties, any relevant context from the conversation, AND relevant structures/clauses from your KB documents.
3. If the user is working in canvas mode, call \`draftNewDocument\` instead of \`generateDocumentInline\`.
4. Only output document text in chat for very short snippets (< 3 lines). Anything longer MUST go through \`generateDocumentInline\`.

When you need to perform an action (search, review, draft), use the appropriate declared tool directly — or use invoke_orchestrator_tool for tools outside your declared set.

Be thorough within your specialty. Be honest and redirect outside it.`.trim();
}

/**
 * Loads an associate's knowledge base documents from the DB and returns
 * a structured string with summaries (for quick reference) and full text
 * (for deep consultation). Preserves the document order from the associate's
 * knowledgeBase array.
 */
async function loadKnowledgeBase(associate: any): Promise<string> {
  if (!associate.knowledgeBase || associate.knowledgeBase.length === 0) {
    return '';
  }
  try {
    const kbDocs = await loadKBDocumentsWithSummaries(associate.knowledgeBase);

    if (kbDocs.length === 0) {
      console.warn(`[loadKnowledgeBase] ${associate.name}: no documents found for IDs:`, associate.knowledgeBase);
      return '';
    }

    const manifestLines: string[] = [];
    const parts: string[] = [];
    let loadedCount = 0;
    let manifestCount = 0;

    for (const doc of kbDocs) {
      manifestCount++;
      const hasSummary = !!doc.summary;
      const hasExtractedText = !!doc.content;
      manifestLines.push(
        `${manifestCount}. ${doc.title} (${doc.fileType.toUpperCase()}) — summary: ${hasSummary ? 'YES' : 'NO'}, text extracted: ${hasExtractedText ? 'YES' : 'NO'}`
      );

      // Keep summary-only scanned/image documents visible to the model.
      if (!doc.content && !doc.summary) {
        console.warn(`[loadKnowledgeBase] ${associate.name}: doc "${doc.title}" has no extractable text`);
        continue;
      }

      loadedCount++;
      const lines: string[] = [`### KB Document ${loadedCount}: ${doc.title} ###`];

      if (doc.summary) {
        lines.push('');
        lines.push('**SUMMARY** (use for quick reference and when answering high-level questions):');
        lines.push(doc.summary);
      }

      if (doc.groundedRules) {
        lines.push('');
        lines.push('**GROUNDED AGENT RULES** (prioritize these behavioral/document rules when reasoning and drafting):');
        lines.push(doc.groundedRules);
      }

      if (doc.content) {
        lines.push('');
        lines.push('**FULL CONTENT** (consult for specific clauses, exact wording, or detailed analysis):');
        lines.push(doc.content);
      } else {
        lines.push('');
        lines.push('**FULL CONTENT**: Not extractable text (likely scanned/image-based). Use summary and ask user for clarifications when exact clause text is needed.');
      }

      parts.push(lines.join('\n'));
    }

    const manifestBlock = `**KNOWLEDGE BASE INVENTORY (Authoritative List of Attached KB Documents)**:\n${manifestLines.length > 0 ? manifestLines.join('\n') : '- No documents attached.'}`;

    if (parts.length === 0) {
      return `${manifestBlock}\n\n[No extractable KB text loaded yet. Use the inventory above when answering KB-status questions.]`;
    }

    return `${manifestBlock}\n\n[${parts.length} document(s) loaded with extractable text]\n\n` + parts.join('\n\n---\n\n');
  } catch (err) {
    console.error(`[loadKnowledgeBase] ${associate.name}: failed to load KB documents`, err);
    return '';
  }
}

/**
 * Extracts a function call from a Gemini generateContent response.
 * Returns null if the response is a final text answer.
 */
function extractFunctionCall(result: any): { name: string; args: any } | null {
  try {
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.functionCall) {
        return { name: part.functionCall.name, args: part.functionCall.args ?? {} };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts the text response from a Gemini generateContent result.
 */
function extractText(result: any): string {
  try {
    return result?.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') ?? result?.text ?? '';
  } catch {
    return result?.text ?? '';
  }
}

/**
 * Builds the Gemini history entry for a function call result (tool response turn).
 */
function buildToolResultTurn(functionName: string, result: any): any {
  return {
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: functionName,
          response: typeof result === 'string' ? { output: result } : result,
        },
      },
    ],
  };
}

/**
 * Builds the Gemini history entry for a model turn that contained a function call.
 */
function buildModelFunctionCallTurn(functionName: string, args: any): any {
  return {
    role: 'model',
    parts: [{ functionCall: { name: functionName, args } }],
  };
}

/**
 * Execute an AI Associate as a bounded agentic loop.
 *
 * When called from the orchestrator (standard mode), `functionCall` is the
 * original Gemini function call and the associate is looked up by name.
 *
 * When called as primary responder (associate-bound conversation), `functionCall`
 * is null and `forcedAssociate` is passed directly.
 */
export async function executeAssociateCall(
  functionCall: { name: string; args: any } | null,
  projectId: string,
  project: any,
  conversationDocuments: any[],
  recentMessages: string[] | { role: string; content: string }[],
  streamCallback?: (event: any) => void,
  userId?: string,
  canvasDocument?: any,
  previewDocument?: any,
  currentCanvasHtml?: string,
  conversationId?: string,
  depth = 0,
  forcedAssociate?: any,
  jurisdictionContextOverride?: Partial<AssociateJurisdictionContext>
): Promise<any> {
  // Lazy-import to break the circular dependency:
  // associateExecutor → functionExecutor → associateExecutor
  const { executeFunctionCall } = await import('./functionExecutor');

  try {
    // ── 1. Resolve the associate ──────────────────────────────────────────────
    let associate = forcedAssociate ?? null;

    if (!associate && functionCall) {
      streamCallback?.({
        type: 'status',
        status: 'processing',
        message: 'Finding specialized associate...',
        conversationId: projectId,
      });
      associate = await findAssociateByFunctionName(functionCall.name, projectId);
    }

    if (!associate) {
      return {
        error: 'Associate not found or not assigned to this project',
        message:
          'The requested AI associate could not be found. Please ensure the associate is assigned to this project and is active.',
      };
    }

    streamCallback?.({
      type: 'status',
      status: 'processing',
      message: `Consulting ${associate.name}...`,
      conversationId: projectId,
    });

    // ── 2. Load knowledge base + fetch peer specialists (parallel) ───────────
    const [knowledgeBaseContent, peerSpecialists] = await Promise.all([
      loadKnowledgeBase(associate),
      loadPeerSpecialists(projectId, associate.id),
    ]);

    // ── 3. Build system prompt ────────────────────────────────────────────────
    const jurisdictionContext = resolveJurisdictionContextFromProject(project, jurisdictionContextOverride);
    const systemPrompt = buildAssociateSystemPrompt(
      associate,
      project,
      knowledgeBaseContent,
      peerSpecialists,
      jurisdictionContext
    );

    // ── 4. Build allowed tool declarations ───────────────────────────────────
    // Start from the associate's declared tools, falling back to an empty set
    // (associate can still use invoke_orchestrator_tool for anything else).
    const declaredToolIds: string[] =
      associate.tools?.map((t: any) => t.toolId) ?? [];

    const allowedDeclarations: any[] = declaredToolIds
      .filter((id: string) => TOOL_DECLARATION_REGISTRY[id])
      .map((id: string) => TOOL_DECLARATION_REGISTRY[id]);

    // Always available: core research + drafting tools (scoped by the associate's system prompt)
    for (const toolId of ALWAYS_AVAILABLE_TOOLS) {
      if (!declaredToolIds.includes(toolId) && TOOL_DECLARATION_REGISTRY[toolId]) {
        allowedDeclarations.push(TOOL_DECLARATION_REGISTRY[toolId]);
      }
    }

    // Always available: escalation to the orchestrator for any remaining tool
    allowedDeclarations.push(INVOKE_ORCHESTRATOR_TOOL);

    // Suggestion + delegation tools — always available (depth guard only for delegation)
    allowedDeclarations.push(SUGGEST_ASSOCIATE_TOOL);
    if (depth < 2) {
      allowedDeclarations.push(DELEGATE_TO_ASSOCIATE_TOOL);
    }

    // ── 5. Build initial history ──────────────────────────────────────────────
    // Normalise recentMessages to strings for passing to executeFunctionCall (which expects string[])
    const recentMessagesStrings: string[] = recentMessages.map(msg =>
      typeof msg === 'string' ? msg : msg.content
    );

    const query = functionCall?.args?.query ?? '';
    const context = functionCall?.args?.context ?? '';

    const conversationContext = (() => {
      if (recentMessages.length === 0) return '';
      const lines = recentMessages.map(msg => {
        if (typeof msg === 'string') return msg;
        const label = msg.role === 'user' ? 'User' : 'Assistant';
        return `${label}: ${msg.content}`;
      });
      return `**Conversation History** (may include messages from a previous specialist — focus on your own expertise):\n${lines.join('\n\n')}\n\n`;
    })();

    const fullPrompt = `${conversationContext}**User Query**: ${query}${context ? `\n\n**Additional Context**: ${context}` : ''}`.trim();

    const history: any[] = [
      { role: 'user', parts: [{ text: fullPrompt }] },
    ];

    // Captured when the associate explicitly calls suggest_associate or
    // delegate_to_associate — included in the return value so the messages route
    // can surface the one-click switch card in the final event.
    let suggestedAssociateFromTool: { id: string; name: string; reason: string } | undefined;

    // Captured when a tool call produces a generated document (generateDocumentInline
    // or draftNewDocument). Passed back to the messages route so the document card
    // is attached to the final message — same as the non-associate path.
    let capturedDocumentMetadata: { document: { title: string; format: string; htmlContent: string } } | undefined;

    // ── 6. Agentic loop ───────────────────────────────────────────────────────
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
        contents: history,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 65536,
          tools: [{ functionDeclarations: allowedDeclarations }],
        },
      });

      const fc = extractFunctionCall(result);

      // No function call → final answer
      if (!fc) {
        const response = extractText(result);

        streamCallback?.({
          type: 'status',
          status: 'complete',
          message: `${associate.name} has responded`,
          conversationId: projectId,
        });

        return {
          success: true,
          associateName: associate.name,
          associateId: associate.id,
          practiceAreas: associate.practiceAreas,
          response,
          message: `**${associate.name}**:\n\n${response}`,
          suggestedAssociate: suggestedAssociateFromTool,
          documentMetadata: capturedDocumentMetadata,
        };
      }

      // Stream the function call so the client can show progress
      streamCallback?.({ type: 'function_call', name: fc.name, args: fc.args });

      // Append the raw model content to history — this preserves the thought_signature
      // that Gemini requires in subsequent turns. Reconstructing the turn manually
      // (buildModelFunctionCallTurn) strips the signature and causes a 400 error.
      const rawModelContent = result?.candidates?.[0]?.content;
      history.push(rawModelContent ?? buildModelFunctionCallTurn(fc.name, fc.args));

      // ── Dispatch the function call ────────────────────────────────────────
      let toolResult: any;

      if (fc.name === 'invoke_orchestrator_tool') {
        // Escalate: borrow an orchestrator tool, return result to associate
        const { toolName, toolArgs } = fc.args as { toolName: string; toolArgs: any };
        const syntheticCall = { name: toolName, args: toolArgs };

        streamCallback?.({
          type: 'status',
          status: 'processing',
          message: `${associate.name} is using ${toolName}...`,
          conversationId: projectId,
        });

        toolResult = await executeFunctionCall(
          syntheticCall,
          projectId,
          project,
          conversationDocuments,
          canvasDocument ?? null,
          previewDocument ?? null,
          recentMessagesStrings,
          streamCallback,
          userId,
          currentCanvasHtml,
          conversationId
        );
      } else if (fc.name === 'delegate_to_associate' || fc.name === 'suggest_associate') {
        // Suggestion: surface a one-click switch card for the user.
        // Associates cannot access another associate's knowledge base directly —
        // they signal the need and the user activates the specialist themselves.
        const associateName = fc.args?.associateName ?? fc.args?.name ?? '';
        const reason = fc.args?.reason ?? fc.args?.task ?? '';

        const target = await findAssociateByName(projectId, associateName);
        if (!target) {
          toolResult = {
            noted: true,
            message: `Associate "${associateName}" was not found in this project. Continue with your general answer.`,
          };
        } else {
          // Capture for the return value so the messages route includes it in the final event
          suggestedAssociateFromTool = { id: target.id, name: target.name, reason };
          toolResult = {
            noted: true,
            suggestion: { id: target.id, name: target.name },
            message: `The suggestion to switch to ${target.name} has been noted and will be shown to the user as a one-click option. Now continue with your general answer, beginning with the disclaimer.`,
          };
        }
      } else {
        // Standard declared tool — execute via the shared function executor
        toolResult = await executeFunctionCall(
          fc,
          projectId,
          project,
          conversationDocuments,
          canvasDocument ?? null,
          previewDocument ?? null,
          recentMessagesStrings,
          streamCallback,
          userId,
          currentCanvasHtml,
          conversationId
        );
      }

      // If this tool produced an inline document, capture it so we can return it
      // alongside the final text response (the messages route attaches it to the message).
      if (toolResult?.documentGenerated && toolResult?.document?.htmlContent) {
        capturedDocumentMetadata = { document: toolResult.document };
      }

      // Stream the tool result
      streamCallback?.({ type: 'function_result', name: fc.name, result: toolResult });

      // Append tool result turn to history, then loop
      history.push(buildToolResultTurn(fc.name, toolResult));
    }

    // ── 7. Safety net: max iterations reached ────────────────────────────────
    streamCallback?.({
      type: 'status',
      status: 'complete',
      message: `${associate.name} reached maximum steps`,
      conversationId: projectId,
    });

    return {
      success: true,
      associateName: associate.name,
      associateId: associate.id,
      practiceAreas: associate.practiceAreas,
      response:
        'I reached the maximum number of steps for this query. Here is my partial analysis based on the work completed so far. Please try breaking the request into smaller parts for a more complete answer.',
      message: `**${associate.name}**: I reached the maximum steps for this query. Please try a more focused request.`,
      suggestedAssociate: suggestedAssociateFromTool,
      documentMetadata: capturedDocumentMetadata,
    };
  } catch (error: any) {
    console.error('Error executing associate call:', error);
    return {
      error: error.message || 'Failed to execute associate call',
      message:
        'I encountered an error while processing your request. Please try again.',
    };
  }
}

/**
 * Checks whether a different project associate would be substantially better suited
 * for the given query than the current one. Returns the suggested associate (id, name,
 * one-sentence reason) or null when no switch is warranted.
 *
 * Runs a single low-token Gemini classification. Conservative: only returns a
 * suggestion when the mismatch is clear, never when the current associate can
 * reasonably handle the query.
 */
export async function suggestAssociate(
  query: string,
  currentAssociateId: string,
  projectId: string
): Promise<{ id: string; name: string; reason: string } | null> {
  try {
    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          select: { id: true, name: true, practiceAreas: true },
        },
      },
    });

    const others = projectAssociates
      .map((pa: any) => pa.associate)
      .filter((a: any) => a && a.id !== currentAssociateId);

    if (others.length === 0) return null;

    const listText = others
      .map((a: any, i: number) =>
        `${i + 1}. ${a.name} — ${a.practiceAreas.map((p: string) => p.replace(/_/g, ' ')).join(', ')}`
      )
      .join('\n');

    const prompt = `You are a routing assistant for a legal AI platform.

A user is currently talking to a specialist and sent the following message:
"""
${query.slice(0, 600)}
"""

Other available specialists in this project:
${listText}

Should the user be suggested to switch to one of the other specialists above?
Only suggest if the query clearly falls within that specialist's domain and the current one is NOT a good fit.
Be CONSERVATIVE — if the current associate can reasonably handle it, do NOT suggest a switch.

Respond with raw JSON only (no markdown):
- If no switch needed: {"suggest":false}
- If a switch is clearly better: {"suggest":true,"index":<1-based number>,"reason":"<one sentence>"}`;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0, maxOutputTokens: 120 },
    });

    const raw = (
      result?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    ).trim().replace(/```json|```/g, '').trim();

    const json = JSON.parse(raw);
    if (!json.suggest || typeof json.index !== 'number') return null;

    const target = others[json.index - 1];
    if (!target) return null;

    return { id: target.id, name: target.name, reason: json.reason ?? '' };
  } catch {
    return null;
  }
}

/**
 * Loads all active AI Associates in the organization (excluding the current one).
 * Searches org-wide (not just project-assigned) so the associate always has a complete
 * picture of available specialists to suggest — even if they haven't been added to
 * this specific project yet.
 */
async function loadPeerSpecialists(
  projectId: string,
  currentAssociateId: string
): Promise<Array<{ id: string; name: string; practiceAreas: string[] }>> {
  try {
    // Resolve the organization from the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });
    if (!project?.organizationId) return [];

    const associates = await prisma.aIAssociate.findMany({
      where: {
        organizationId: project.organizationId,
        isActive: true,
        id: { not: currentAssociateId },
      },
      select: { id: true, name: true, practiceAreas: true },
      orderBy: { name: 'asc' },
    });

    return associates;
  } catch {
    return [];
  }
}

/**
 * Finds an associate by name or practice-area keywords, searching org-wide.
 * Three-tier fallback: exact name → partial name → practice-area keyword match.
 */
async function findAssociateByName(projectId: string, name: string): Promise<any> {
  try {
    // Resolve org so we can search all associates, not just project-assigned ones
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });
    if (!project?.organizationId) return null;

    const all = await prisma.aIAssociate.findMany({
      where: { organizationId: project.organizationId, isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, tools: true },
    });

    const nameLower = name.toLowerCase();

    // 1. Exact name match
    let match = all.find((a: any) => a.name?.toLowerCase() === nameLower);

    // 2. Partial name match (name contains query or query contains name)
    if (!match) {
      match = all.find(
        (a: any) =>
          a.name?.toLowerCase().includes(nameLower) ||
          nameLower.includes(a.name?.toLowerCase() ?? '__no_match__')
      );
    }

    // 3. Practice-area keyword match — handles cases where the model uses a role
    //    description instead of the exact name (e.g. "IP Lawyer" → IP_LAW)
    if (!match) {
      const keywords = nameLower.split(/[\s,/&]+/).filter((w: string) => w.length > 3);
      match = all.find((a: any) => {
        const areas: string[] = (a.practiceAreas ?? []).map(
          (pa: string) => pa.toLowerCase().replace(/_/g, ' ')
        );
        return keywords.some((kw: string) => areas.some((area: string) => area.includes(kw)));
      });
    }

    return match ?? null;
  } catch {
    return null;
  }
}
