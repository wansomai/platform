import { GoogleGenerativeAI } from '@google/generative-ai';
import { Delta } from 'quill/core';
import { htmlToQuillDelta, stripHtml as utilStripHtml } from '@/lib/htmlToQuillDelta';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 8192,
  }
});

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
  ): Promise<{ content: string; delta: any }> {

    const prompt = this.buildGenerationPrompt(instruction, projectContext);

    const systemInstruction = `You are Wansom, a senior lawyer specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const htmlContent = result.response.text() || '';
    const delta = this.htmlToQuillDelta(htmlContent);

    return { content: htmlContent, delta };
  }

  static async generateDocumentStreaming(
    instruction: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ content: string; delta: any }> {

    const prompt = this.buildGenerationPrompt(instruction, projectContext);

    const systemInstruction = `You are Wansom, a senior lawyer specializing in legal document drafting. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate. Provide substantive legal content without disclaimers or meta-commentary about AI capabilities.`;

    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const result = await model.generateContentStream(fullPrompt);

    let fullContent = '';
    let currentSection = '';

    for await (const chunk of result.stream) {
      const delta = chunk.text();
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

    const delta = this.htmlToQuillDelta(fullContent);

    return { content: fullContent, delta };
  }
  
  static async editDocument(
    instruction: string,
    currentContent: string,
    projectContext: ProjectContext
  ): Promise<{ content: string; delta: any }> {

    const prompt = this.buildEditPrompt(instruction, currentContent, projectContext);

    const systemInstruction = `You are Wansom, a senior lawyer editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity. Focus on substantive edits without adding disclaimers or meta-commentary.`;

    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const htmlContent = result.response.text() || '';
    const delta = this.htmlToQuillDelta(htmlContent);

    return { content: htmlContent, delta };
  }

  static async editDocumentStreaming(
    instruction: string,
    currentContent: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ content: string; delta: any }> {

    const prompt = this.buildEditPrompt(instruction, currentContent, projectContext);

    const systemInstruction = `You are Wansom, a senior lawyer editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity. Focus on substantive edits without adding disclaimers or meta-commentary.`;

    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    const result = await model.generateContentStream(fullPrompt);

    let fullContent = '';
    let currentSection = '';

    for await (const chunk of result.stream) {
      const delta = chunk.text();
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

    const delta = this.htmlToQuillDelta(fullContent);

    return { content: fullContent, delta };
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

  private static htmlToQuillDelta(html: string): any {
    // Use the utility function for proper HTML to Delta conversion
    // Note: This will run on server side, so we need a different approach
    // For now, create a simplified structure that Quill can understand
    return this.createSimpleDelta(html);
  }

  private static createSimpleDelta(html: string): any {
    // Simple server-side HTML to Delta conversion
    const ops: any[] = [];
    
    // Basic HTML parsing for server-side
    let content = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (match, text) => {
        ops.push({ insert: text.trim(), attributes: { header: 1 } });
        ops.push({ insert: '\n' });
        return '';
      })
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, text) => {
        ops.push({ insert: text.trim(), attributes: { header: 2 } });
        ops.push({ insert: '\n' });
        return '';
      })
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, text) => {
        ops.push({ insert: text.trim(), attributes: { header: 3 } });
        ops.push({ insert: '\n' });
        return '';
      })
      .replace(/<p[^>]*>(.*?)<\/p>/gi, (match, text) => {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          ops.push({ insert: cleanText });
          ops.push({ insert: '\n' });
        }
        return '';
      })
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, (match, text) => {
        ops.push({ insert: text, attributes: { bold: true } });
        return '';
      })
      .replace(/<em[^>]*>(.*?)<\/em>/gi, (match, text) => {
        ops.push({ insert: text, attributes: { italic: true } });
        return '';
      })
      .replace(/<br\s*\/?>/gi, () => {
        ops.push({ insert: '\n' });
        return '';
      });

    // Clean up any remaining HTML and add as plain text
    const remainingText = content.replace(/<[^>]*>/g, '').trim();
    if (remainingText && ops.length === 0) {
      ops.push({ insert: remainingText });
      ops.push({ insert: '\n' });
    }

    // Ensure we have at least one newline
    if (ops.length === 0) {
      ops.push({ insert: '\n' });
    }

    return { ops };
  }

  static deltaToPlainText(delta: any): string {
    if (!delta?.ops) return '';
    
    return delta.ops
      .map((op: any) => op.insert || '')
      .join('')
      .replace(/\n/g, ' ')
      .trim();
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