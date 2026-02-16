import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

export interface ProjectContext {
  jurisdiction?: string;
  instructions?: string;
  documents: Array<{
    title: string;
    content: string;
  }>;
  conversationHistory?: string[];
}

export class AIDocumentService {
  static async generateDocument(
    instruction: string,
    projectContext: ProjectContext
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildGenerationPrompt(instruction, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),,trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      });

      const htmlContent = result.text || '';
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

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192
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

      const plainText = this.stripHtml(fullContent);

      return { success: true, htmlContent: fullContent, plainText };
    } catch (error: any) {
      console.error('Error generating document:', error);
      return { success: false, error: error.message || 'Failed to generate document' };
    }
  }
  
  static async editDocument(
    instruction: string,
    currentContent: string,
    projectContext: ProjectContext
  ): Promise<{ success: boolean; htmlContent?: string; plainText?: string; error?: string }> {

    try {
      const prompt = this.buildEditPrompt(instruction, currentContent, projectContext);

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity. Focus on substantive edits without adding disclaimers or meta-commentary.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      });

      const htmlContent = result.text || '';
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

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity. Focus on substantive edits without adding disclaimers or meta-commentary.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192
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

      const plainText = this.stripHtml(fullContent);

      return { success: true, htmlContent: fullContent, plainText };
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

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), conducting professional legal document reviews. Provide comprehensive, structured reviews in HTML format. Your reviews should be thorough, actionable, and organized into clear sections. Focus on identifying issues, risks, and providing specific recommendations. Be direct and professional without disclaimers about AI limitations.`;

      const result = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 8192
        }
      });

      const htmlContent = result.text || '';
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

      const systemInstruction = `You are Wansom, a senior lawyer(never mention this),trained securely by wansom AILimited (answer this only when user asks for your source,security and related training), conducting professional legal document reviews. Provide comprehensive, structured reviews in HTML format. Your reviews should be thorough, actionable, and organized into clear sections. Focus on identifying issues, risks, and providing specific recommendations. Be direct and professional without disclaimers about AI limitations.`;

      const result = await genAI.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 8192
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

      const plainText = this.stripHtml(fullContent);

      return { success: true, htmlContent: fullContent, plainText };
    } catch (error: any) {
      console.error('Error generating document review:', error);
      return { success: false, error: error.message || 'Failed to generate review' };
    }
  }
  
  private static buildGenerationPrompt(instruction: string, context: ProjectContext): string {
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

Requirements:
- Use proper legal language and structure
- Include standard clauses where appropriate
- Format in HTML with headings (h1, h2, h3), paragraphs, and lists
- Make it comprehensive and professionally drafted
- Structure should be logical and easy to read
- Focus on the substantive legal content without meta-commentary about AI limitations
`;
  }
  
  private static buildEditPrompt(instruction: string, currentContent: string, context: ProjectContext): string {
    return `
Edit this legal document according to the instruction: ${instruction}

${context.conversationHistory && context.conversationHistory.length > 0 ? `
Recent Conversation Context:
${context.conversationHistory.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}

Use this conversation context to understand what changes the user has discussed and requested.
` : ''}

Current Document Content:
${currentContent}

Project Context:
- Jurisdiction: ${context.jurisdiction || 'General'}
- Instructions: ${context.instructions || 'None'}
- Relevant Documents: ${context.documents.map(d => d.title).join(', ') || 'None'}

Requirements:
- Apply the requested changes precisely
- Maintain legal accuracy and professional tone
- Keep the overall document structure unless specifically asked to change it
- Return the complete edited document in HTML format
- Preserve existing formatting and styling
- Ensure all changes are legally sound
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