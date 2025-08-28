import OpenAI from 'openai';
import { Delta } from 'quill/core';
import { htmlToQuillDelta, stripHtml as utilStripHtml } from '@/lib/htmlToQuillDelta';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ProjectContext {
  jurisdiction?: string;
  instructions?: string;
  documents: Array<{
    title: string;
    content: string;
  }>;
}

export class AIDocumentService {
  static async generateDocument(
    instruction: string,
    projectContext: ProjectContext
  ): Promise<{ content: string; delta: any }> {
    
    const prompt = this.buildGenerationPrompt(instruction, projectContext);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a legal document drafting assistant. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate.`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3
    });
    
    const htmlContent = response.choices[0].message.content || '';
    const delta = this.htmlToQuillDelta(htmlContent);
    
    return { content: htmlContent, delta };
  }

  static async generateDocumentStreaming(
    instruction: string,
    projectContext: ProjectContext,
    onProgress?: (partial: string, section: string) => void
  ): Promise<{ content: string; delta: any }> {
    
    const prompt = this.buildGenerationPrompt(instruction, projectContext);
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a legal document drafting assistant. Generate professional legal documents in HTML format suitable for a rich text editor. Use proper legal structure and formatting with headings, paragraphs, and lists. Include standard legal clauses where appropriate.`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: true
    });
    
    let fullContent = '';
    let currentSection = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [
        {
          role: "system",
          content: `You are editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });
    
    const htmlContent = response.choices[0].message.content || '';
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
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [
        {
          role: "system",
          content: `You are editing a legal document. Return the complete edited document in HTML format. Maintain professional legal formatting and structure. Apply the requested changes precisely while preserving the overall document integrity.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: true
    });
    
    let fullContent = '';
    let currentSection = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
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

Project Context:
- Jurisdiction: ${context.jurisdiction || 'General'}
- Instructions: ${context.instructions || 'None'}
- Relevant Documents: ${context.documents.map(d => d.title).join(', ') || 'None'}

${context.documents.length > 0 ? `
Reference Materials:
${context.documents.map(d => `${d.title}: ${d.content.substring(0, 500)}...`).join('\n\n')}
` : ''}

Requirements:
- Use proper legal language and structure
- Include standard clauses where appropriate  
- Format in HTML with headings (h1, h2, h3), paragraphs, and lists
- Make it comprehensive and professionally drafted
- Include relevant legal disclaimers if needed
- Structure should be logical and easy to read
`;
  }
  
  private static buildEditPrompt(instruction: string, currentContent: string, context: ProjectContext): string {
    return `
Edit this legal document according to the instruction: ${instruction}

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