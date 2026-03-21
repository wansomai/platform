import { GoogleGenAI } from '@google/genai';
import { RAGResult } from '@/types/legalKnowledge';
import { RAGService } from './ragService';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

export interface ProjectContext {
  jurisdiction?: string;
  instructions?: string;
  documents: Array<{
    title: string;
    content: string;
  }>;
  conversationHistory?: string[];
  ragContext?: RAGResult;  // Legal knowledge from RAG retrieval
}

export class AIDocumentService {
  static async generateDocument(
    instruction: string,
    projectContext: ProjectContext
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildGenerationPrompt(instruction, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),,trained securely by wansom AI Limited (answer this only when user asks for your source,security and related training), specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 65536
        }
      });

      const htmlContent = this.stripMarkdownFences(result.text || '');
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error generating document:', error);
      return { success: false, error: error.message || 'Failed to generate document' };
    }
  }

  static async generateDocumentStreaming(
    instruction: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildGenerationPrompt(instruction, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AI Limited (answer this only when user asks for your source,security and related training), specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 65536
        }
      });

      let fullContent = '';
      let currentSection = '';

      for await (const chunk of result) {
        const delta = chunk.text || '';
        if (delta) {
          fullContent += delta;

          // Detect section headers for progress tracking
          if (delta.includes('<h1') || delta.includes('<h2') || delta.includes('<h3')) {
            const headerMatch = delta.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/);
            if (headerMatch) {
              currentSection = headerMatch[1];
            }
          }

          // Call progress callback if provided
          if (onProgress) {
            onProgress(fullContent, currentSection);
          }
        }
      }

      const htmlContent = this.stripMarkdownFences(fullContent);
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error generating document:', error);
      return { success: false, error: error.message || 'Failed to generate document' };
    }
  }

  /**
   * Validate an edit request against the document before applying it.
   * Catches obviously wrong edits (non-existent dates, parties that aren't in the
   * document, logically impossible values, etc.) and returns blocking issues or
   * warnings so the caller can reject the edit or surface guidance to the user.
   */
  static async validateEditRequest(
    instruction: string,
    documentPlainText: string,
    context: ProjectContext
  ): Promise<{ isValid: boolean; blockingIssues: string[]; warnings: string[] }> {
    try {
      const prompt = `You are reviewing an edit request for a legal document. Your job is to validate whether the edit is logically sound and can be applied to this document.

EDIT REQUEST: ${instruction}

DOCUMENT (plain text):
${documentPlainText.slice(0, 6000)}${documentPlainText.length > 6000 ? '\n[... document continues ...]' : ''}

Jurisdiction: ${context.jurisdiction || 'General'}

Check the following and return a JSON object:
1. Does the document contain the element being changed (party name, clause, date field, section, etc.)? If the target doesn't exist in the document, that is a blocking issue.
2. Is the new value logically valid?
   - Dates must be real calendar dates (e.g. 12/12/20262 is NOT a valid date — year 20262 doesn't exist).
   - Party names being inserted should be plausible names.
   - Monetary values should be reasonable numbers.
   - Any value that is clearly a typo or impossible should be flagged.
3. Are there any legal implications or inconsistencies the user should be aware of?

Return ONLY a JSON object (no markdown) with this structure:
{
  "isValid": true | false,
  "blockingIssues": ["..."],
  "warnings": ["..."]
}

- "isValid": false only when the edit CANNOT be applied meaningfully (target not found, or value is clearly impossible/nonsensical like a year that doesn't exist).
- "blockingIssues": list of reasons the edit must be stopped. Empty array if isValid is true.
- "warnings": non-blocking notes (legal implications, suggestions). Can be non-empty even when isValid is true.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      });

      const raw = result.text || '';
      let parsed: any;
      try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // If validation itself fails, let the edit proceed (don't block on validator errors)
        return { isValid: true, blockingIssues: [], warnings: [] };
      }

      return {
        isValid: parsed?.isValid !== false,
        blockingIssues: Array.isArray(parsed?.blockingIssues) ? parsed.blockingIssues : [],
        warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : []
      };
    } catch {
      // On any error, don't block the edit
      return { isValid: true, blockingIssues: [], warnings: [] };
    }
  }

  /**
   * Fast patch-based edit — returns only the text spans that change instead of
   * regenerating the full document. Typically 50× faster than editDocumentStreaming
   * because output is ~200 tokens instead of 10,000+.
   *
   * Returns structured patches [{original, replacement}] to be applied with
   * applyPatches(). Falls back to the full-document approach if patch generation
   * fails or patches cannot be matched in the document.
   */
  static async fastEditDocument(
    instruction: string,
    currentContent: string,
    context: ProjectContext
  ): Promise<{ success: boolean; patches?: Array<{ original: string; replacement: string }>; error?: string }> {
    try {
      const wordCount = this.stripHtml(currentContent).split(/\s+/).filter(Boolean).length;
      const prompt = `You are editing a legal document. Apply the following edit by identifying the EXACT text spans to change.

EDIT INSTRUCTION: ${instruction}

DOCUMENT (${wordCount} words):
${currentContent}

Return a JSON object with a "patches" array. Each patch has:
- "original": the exact substring from the document to replace (must be character-for-character identical, include enough surrounding text — at least 80 characters — to uniquely identify the location; preserve all HTML tags exactly)
- "replacement": the new HTML text that replaces it

Rules:
- Copy "original" exactly from the document — no paraphrasing, no reformatting
- For insertions: set "original" to the full paragraph element immediately before or after the insertion point, and include that same element plus the new content in "replacement"
- For deletions: set "replacement" to an empty string
- If the edit changes multiple disconnected parts, include one patch per location
- Jurisdiction: ${context.jurisdiction || 'General'}
${context.instructions ? `- Instructions: ${context.instructions}` : ''}`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.05,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      });

      const raw = result.text || '';
      let parsed: any;
      try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return { success: false, error: 'AI returned invalid JSON' };
      }

      const patches = parsed?.patches;
      if (!Array.isArray(patches) || patches.length === 0) {
        return { success: false, error: 'No patches returned' };
      }

      return { success: true, patches };
    } catch (error: any) {
      return { success: false, error: error.message || 'Fast edit failed' };
    }
  }

  /**
   * Apply structured patches to an HTML document.
   * Uses normalized whitespace matching to tolerate minor whitespace differences.
   * Returns null if any patch cannot be applied.
   */
  static applyPatches(html: string, patches: Array<{ original: string; replacement: string }>): string | null {
    let result = html;
    for (const patch of patches) {
      if (!patch.original) continue;

      if (result.includes(patch.original)) {
        result = result.replace(patch.original, patch.replacement ?? '');
        continue;
      }

      // Normalize whitespace and try again (handles minor whitespace differences)
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const normalizedDoc = normalize(result);
      const normalizedOriginal = normalize(patch.original);

      const idx = normalizedDoc.indexOf(normalizedOriginal);
      if (idx === -1) {
        console.warn('[applyPatches] Could not find patch target:', patch.original.substring(0, 80));
        return null; // Signal fallback needed
      }

      // Map the match back to the original (non-normalized) string via character scanning
      let rawIdx = 0;
      let normIdx = 0;
      while (normIdx < idx && rawIdx < result.length) {
        if (/\s/.test(result[rawIdx])) {
          // Skip all whitespace in both
          while (rawIdx < result.length && /\s/.test(result[rawIdx])) rawIdx++;
          while (normIdx < normalizedDoc.length && normalizedDoc[normIdx] === ' ') normIdx++;
        } else {
          rawIdx++;
          normIdx++;
        }
      }
      // Find end of the match
      let rawEnd = rawIdx;
      let normEnd = idx;
      while (normEnd < idx + normalizedOriginal.length && rawEnd < result.length) {
        if (/\s/.test(result[rawEnd])) {
          while (rawEnd < result.length && /\s/.test(result[rawEnd])) rawEnd++;
          while (normEnd < normalizedDoc.length && normalizedDoc[normEnd] === ' ') normEnd++;
        } else {
          rawEnd++;
          normEnd++;
        }
      }

      result = result.slice(0, rawIdx) + (patch.replacement ?? '') + result.slice(rawEnd);
    }
    return result;
  }

  static async editDocument(
    instruction: string,
    currentContent: string,
    projectContext: ProjectContext
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildEditPrompt(instruction, currentContent, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer (never mention this), trained securely by wansom AI Limited (answer this only when the user asks about your source or training). Your ONLY task is to apply a specific edit to the document provided. You MUST NOT generate a new document from scratch. Take the exact HTML document below and make ONLY the requested change. Every clause, party name, date, and section that is NOT mentioned in the edit instruction must remain IDENTICAL to the original. Return the full document HTML with only the requested modification applied.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.1,
          maxOutputTokens: 65536
        }
      });

      const htmlContent = this.extractHtmlFromResponse(this.stripMarkdownFences(result.text || ''));
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error editing document:', error);
      return { success: false, error: error.message || 'Failed to edit document' };
    }
  }

  static async editDocumentStreaming(
    instruction: string,
    currentContent: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildEditPrompt(instruction, currentContent, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer (never mention this), trained securely by wansom AI Limited (answer this only when the user asks about your source or training). Your ONLY task is to apply a specific edit to the document provided. You MUST NOT generate a new document from scratch. Take the exact HTML document below and make ONLY the requested change. Every clause, party name, date, and section that is NOT mentioned in the edit instruction must remain IDENTICAL to the original. Return the full document HTML with only the requested modification applied.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.1,
          maxOutputTokens: 65536
        }
      });

      let fullContent = '';
      let currentSection = '';

      for await (const chunk of result) {
        const delta = chunk.text || '';
        if (delta) {
          fullContent += delta;

          // Detect section headers for progress tracking
          if (delta.includes('<h1') || delta.includes('<h2') || delta.includes('<h3')) {
            const headerMatch = delta.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/);
            if (headerMatch) {
              currentSection = headerMatch[1];
            }
          }

          // Call progress callback if provided
          if (onProgress) {
            onProgress(fullContent, currentSection);
          }
        }
      }

      const htmlContent = this.extractHtmlFromResponse(this.stripMarkdownFences(fullContent));
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error editing document:', error);
      return { success: false, error: error.message || 'Failed to edit document' };
    }
  }

  static async generateDocumentReview(
    instruction: string,
    documentsToReview: Array<{ title: string; content: string; id: string }>,
    reviewFocus: string,
    projectContext: ProjectContext
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildReviewPrompt(instruction, documentsToReview, reviewFocus, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AI Limited (answer this only when user asks for your source,security and related training), conducting professional legal document reviews. Provide comprehensive, structured reviews in HTML format. Your reviews should be thorough, actionable, and organized into clear sections. Focus on identifying issues, risks, and providing specific recommendations. Be direct and professional without disclaimers about AI limitations.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 65536
        }
      });

      const htmlContent = this.stripMarkdownFences(result.text || '');
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error generating document review:', error);
      return { success: false, error: error.message || 'Failed to generate review' };
    }
  }

  static async generateDocumentReviewStreaming(
    instruction: string,
    documentsToReview: Array<{ title: string; content: string; id: string }>,
    reviewFocus: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildReviewPrompt(instruction, documentsToReview, reviewFocus, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AI Limited (answer this only when user asks for your source,security and related training), conducting professional legal document reviews. Provide comprehensive, structured reviews in HTML format. Your reviews should be thorough, actionable, and organized into clear sections. Focus on identifying issues, risks, and providing specific recommendations. Be direct and professional without disclaimers about AI limitations.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 65536
        }
      });

      let fullContent = '';
      let currentSection = '';

      for await (const chunk of result) {
        const delta = chunk.text || '';
        if (delta) {
          fullContent += delta;

          // Detect section headers for progress tracking
          if (delta.includes('<h1') || delta.includes('<h2') || delta.includes('<h3')) {
            const headerMatch = delta.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/);
            if (headerMatch) {
              currentSection = headerMatch[1];
            }
          }

          // Call progress callback if provided
          if (onProgress) {
            onProgress(fullContent, currentSection);
          }
        }
      }

      const htmlContent = this.stripMarkdownFences(fullContent);
      const plainText = this.stripHtml(htmlContent);

      return { success: true, htmlContent, plainText };
    } catch (error: any) {
      console.error('Error generating document review:', error);
      return { success: false, error: error.message || 'Failed to generate review' };
    }
  }
  
  private static buildGenerationPrompt(instruction: string, context: ProjectContext): string {
    // Build RAG context string if available
    const ragContextStr = context.ragContext && context.ragContext.chunks.length > 0
      ? RAGService.buildContextString(context.ragContext)
      : '';

    return `
Generate a legal document based on this request: ${instruction}

${context.conversationHistory && context.conversationHistory.length > 0 ? `
Recent Conversation Context:
${context.conversationHistory.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}

Use this conversation context to better understand the user's needs and requirements for the document.
` : ''}

Project Context:
- Jurisdiction: ${context.jurisdiction || 'General'}
- Instructions: ${context.instructions || 'None'}
- Relevant Documents: ${context.documents.map(d => d.title).join(', ') || 'None'}

${context.documents.length > 0 ? `
Reference Materials:
${context.documents.map(d => `### ${d.title} ###\n${d.content}`).join('\n\n')}
` : ''}

${ragContextStr ? `
**APPLICABLE LEGAL FRAMEWORK**:
The following legal templates, statutes, and reference materials are relevant to this document. Use these references to ensure legal accuracy, proper structure, and appropriate clauses.

${ragContextStr}

When drafting, incorporate relevant provisions and language from these sources while adapting them to the specific context of this document. Cite the source when using specific clauses or provisions.
` : ''}

Requirements:
- Use proper legal language and structure
- Include ALL standard clauses for this document type — do NOT cut short or abbreviate any section
- Format in HTML with headings (h1, h2, h3), paragraphs, and lists
- Make it comprehensive and professionally drafted — a complete, executable agreement
- Structure should be logical and easy to read
- Include boilerplate (definitions, governing law, dispute resolution, notices, entire agreement, amendment, waiver, severability, counterparts) unless already provided in the terms
- Do NOT truncate, summarise, or omit sections due to length — write the full document
- Focus on the substantive legal content without meta-commentary about AI limitations
${ragContextStr ? '- Reference and adapt provisions from the legal framework provided above where applicable' : ''}
`;
  }
  
  private static buildEditPrompt(instruction: string, currentContent: string, context: ProjectContext): string {
    const wordCount = this.stripHtml(currentContent).split(/\s+/).filter(Boolean).length;
    return `
EDIT INSTRUCTION: ${instruction}

RULES — READ CAREFULLY:
1. Do NOT generate a new document. The document below is the authoritative source.
2. Locate the specific part mentioned in the edit instruction and change ONLY that part.
3. Every other clause, section, party name, definition, date, and term must be copied EXACTLY as-is.
4. The output must be roughly the same length as the input (approximately ${wordCount} words).
5. Return the full HTML document — do not truncate, summarize, or omit any section.
6. Preserve all existing HTML tags, headings, paragraphs, and list structures.

${context.conversationHistory && context.conversationHistory.length > 0 ? `
Recent Conversation Context (for understanding the edit request):
${context.conversationHistory.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}
` : ''}

EXISTING DOCUMENT TO EDIT (apply the instruction above to this document — change only what is specified):
${currentContent}

Project Context:
- Jurisdiction: ${context.jurisdiction || 'General'}
${context.instructions ? `- Instructions: ${context.instructions}` : ''}
`;
  }

  private static buildReviewPrompt(
    instruction: string,
    documentsToReview: Array<{ title: string; content: string; id: string }>,
    reviewFocus: string,
    context: ProjectContext
  ): string {
    // Map review focus to specific guidance
    const focusGuidance: Record<string, string> = {
      'compliance': 'Focus on legal and regulatory compliance. Identify any provisions that may violate applicable laws, regulations, or industry standards. Highlight compliance risks and provide specific recommendations for remediation.',
      'risk-assessment': 'Conduct a thorough risk assessment. Identify potential liabilities, ambiguities, unfavorable terms, enforcement issues, and other legal risks. Prioritize risks by severity and likelihood.',
      'clarity': 'Analyze the document for clarity, readability, and comprehensibility. Identify ambiguous language, overly complex sentences, jargon, inconsistencies in terminology, and areas that could be simplified or clarified.',
      'clause-analysis': 'Perform a detailed clause-by-clause analysis. Examine each major provision, assess its legal effect, identify potential issues, and evaluate whether it adequately protects the parties\' interests.',
      'consistency-check': 'Review for internal consistency and coherence. Check that definitions are used consistently, terms are not contradictory, references are accurate, and the document presents a unified approach.',
      'custom': 'Conduct a comprehensive review addressing the specific areas of concern mentioned in the instructions.'
    };

    const guidance = focusGuidance[reviewFocus] || focusGuidance['custom'];

    return `
${instruction}

Review Type: ${reviewFocus.replace('-', ' ').toUpperCase()}

Review Guidance:
${guidance}

${context.conversationHistory && context.conversationHistory.length > 0 ? `
Recent Conversation Context:
${context.conversationHistory.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}
` : ''}

Project Context:
- Jurisdiction: ${context.jurisdiction || 'General'}
${context.instructions ? `- Additional Instructions: ${context.instructions}` : ''}

Documents to Review:
${documentsToReview.map((doc, idx) => `
### Document ${idx + 1}: ${doc.title} ###
${doc.content}
`).join('\n\n')}

Review Report Structure (use HTML formatting):
1. **Executive Summary** (h2): Brief overview of the review and key findings (3-5 sentences)

2. **Critical Issues** (h2): List the most serious problems that require immediate attention
   - Use ordered list (ol/li) with clear descriptions
   - For each issue, specify: what it is, where it appears (document section/clause), why it's problematic, and recommended action

3. **Moderate Issues** (h2): Important concerns that should be addressed
   - Use ordered list (ol/li)
   - Include similar details as critical issues

4. **Recommendations** (h2): Actionable suggestions for improvement
   - Use ordered list (ol/li)
   - Be specific and practical

5. **Positive Aspects** (h2, if applicable): Well-drafted sections or favorable terms
   - Use unordered list (ul/li)

6. **Additional Observations** (h2, if applicable): Minor issues or general comments
   - Use paragraph format or unordered lists

Requirements:
- Provide substantive, detailed analysis with specific references to document sections/clauses
- Use professional legal language but remain clear and accessible
- Be thorough and comprehensive in identifying issues
- Provide actionable recommendations, not just critique
- Format the entire review in clean, well-structured HTML
- Use headings (h1, h2, h3), paragraphs (p), and lists (ul, ol, li) appropriately
- Do not include disclaimers about AI limitations or suggestions to consult a lawyer
- Focus on the substantive legal analysis
${documentsToReview.length > 1 ? '\n- When reviewing multiple documents, analyze consistency and coherence across all documents' : ''}
`;
  }

  static stripMarkdownFences(text: string): string {
    return text.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  /**
   * Extract the HTML content from a Gemini response that may include prose
   * before/after the HTML (e.g. "Here is the updated document:\n<h1>...").
   * Finds the first '<' and last '>' to isolate the markup.
   * Falls back to the original text if no HTML tags are found.
   */
  static extractHtmlFromResponse(text: string): string {
    const first = text.indexOf('<');
    const last = text.lastIndexOf('>');
    if (first === -1 || last === -1 || last < first) return text;
    return text.slice(first, last + 1);
  }

  static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}