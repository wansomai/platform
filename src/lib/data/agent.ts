// lib/simple-wansom-bot.ts
import { createClient } from 'contentful-management';
import OpenAI from 'openai';
import { Document } from '@contentful/rich-text-types';
import { createSlug } from './data/blogAdapter';

// Initialize Contentful Management API
const managementClient = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || '',
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface GeneratedLegalContent {
  title: string;
  preview: Document;
  description: Document;
  tags: string[];
}

class SimpleWansomBot {
  private spaceId: string;
  private environmentId: string;

  constructor(spaceId: string, environmentId: string = 'master') {
    this.spaceId = spaceId;
    this.environmentId = environmentId;
  }

  /**
   * Generate everything from just the document name
   */
  async generateFromDocumentName(documentName: string): Promise<GeneratedLegalContent> {
    const systemPrompt = `You are the lead copywriter for Wansom.ai, the leading AI document drafting platform for lawyers. Your task is to come up with SEO optimized descriptions, preview and titles for legal templates that you are going to be given. The descriptions should follow a format of a product description because we want the end user to customize the template using Wansom.ai.

Based on the document name provided, you need to:
1. Create an SEO-optimized title
2. Write a compelling 2-3 sentence preview that highlights Wansom.ai's capabilities
3. Write a comprehensive product description (300-500 words) that covers:
   - Template benefits and key sections
   - How Wansom.ai makes customization easy
   - Target use cases and time-saving benefits
   - Professional compliance assurance
4. Generate relevant SEO tags

Response must be in JSON format:
{
  "title": "SEO-optimized title for the legal template",
  "preview": "Brief 2-3 sentence product preview that hooks the reader and mentions Wansom.ai's AI-powered customization",
  "description": "Comprehensive product description in markdown format with headers and bullet points. Focus on benefits, customization with Wansom.ai, target audience, and why this template is essential for legal professionals.",
  "tags": ["relevant", "seo", "tags", "for", "legal", "template"]
}

Make the content professional, benefits-focused, and emphasize how Wansom.ai's AI technology makes legal document creation efficient and accurate.`;

    const userPrompt = `Create SEO-optimized content for this legal document template: "${documentName}"

Analyze the document name and create appropriate content that would appeal to lawyers and legal professionals looking for this type of template on Wansom.ai.`;
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) throw new Error('No content generated');

      return this.parseAIResponse(aiResponse, documentName);
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Publish to Contentful
   */
  async publishToContentful(content: GeneratedLegalContent): Promise<string> {
    try {
      const space = await managementClient.getSpace(this.spaceId);
      const environment = await space.getEnvironment(this.environmentId);

      const entry = await environment.createEntry('documentTemplates', {
        fields: {
          title: {
            'en-US': content.title,
          },
          preview: {
            'en-US': content.preview,
          },
          description: {
            'en-US': content.description,
          },
          tags: {
            'en-US': content.tags,
          },
        },
      });

      const publishedEntry = await entry.publish();
      console.log(`Template published with ID: ${publishedEntry.sys.id}`);
      return publishedEntry.sys.id;
    } catch (error) {
      console.error('Error publishing to Contentful:', error);
      throw new Error('Failed to publish template');
    }
  }

  /**
   * One-click generate and publish
   */
  async generateAndPublish(documentName: string): Promise<{
    entryId: string;
    content: GeneratedLegalContent;
    slug: string;
  }> {
    const content = await this.generateFromDocumentName(documentName);
    const entryId = await this.publishToContentful(content);
    const slug = createSlug(content.title);

    return {
      entryId,
      content,
      slug,
    };
  }

  private parseAIResponse(aiResponse: string, documentName: string): GeneratedLegalContent {
    try {
      const parsed = JSON.parse(aiResponse);
      
      return {
        title: parsed.title || documentName,
        preview: this.convertToRichText(parsed.preview || ''),
        description: this.convertToRichText(parsed.description || ''),
        tags: parsed.tags || ['legal-documents', 'templates'],
      };
    } catch (error) {
      console.warn('Failed to parse JSON response, using fallback');
      
      return {
        title: documentName,
        preview: this.convertToRichText(`Professional ${documentName} template available for customization on Wansom.ai's AI-powered platform.`),
        description: this.convertToRichText(aiResponse),
        tags: ['legal-documents', 'templates'],
      };
    }
  }

  private convertToRichText(content: string): Document {
    const lines = content.split('\n');
    const richTextContent: any[] = [];
    let currentParagraph = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('### ')) {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
        richTextContent.push(this.createHeadingNode(3, trimmedLine.substring(4)));
      } else if (trimmedLine.startsWith('## ')) {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
        richTextContent.push(this.createHeadingNode(2, trimmedLine.substring(3)));
      } else if (trimmedLine.startsWith('# ')) {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
        richTextContent.push(this.createHeadingNode(1, trimmedLine.substring(2)));
      } else if (trimmedLine === '') {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
    }

    if (currentParagraph) {
      richTextContent.push(this.createParagraphNode(currentParagraph));
    }

    return {
      nodeType: 'document',
      data: {},
      content: richTextContent.length > 0 ? richTextContent : [this.createParagraphNode('No content provided')],
    };
  }

  private createParagraphNode(text: string) {
    return {
      nodeType: 'paragraph',
      data: {},
      content: [
        {
          nodeType: 'text',
          value: text,
          marks: [],
          data: {},
        },
      ],
    };
  }

  private createHeadingNode(level: number, text: string) {
    return {
      nodeType: `heading-${level}`,
      data: {},
      content: [
        {
          nodeType: 'text',
          value: text,
          marks: [],
          data: {},
        },
      ],
    };
  }
}

export default SimpleWansomBot;

// API route: pages/api/generate-template.ts
export async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { documentName } = req.body;
    
    if (!documentName) {
      return res.status(400).json({ message: 'Document name is required' });
    }

    const bot = new SimpleWansomBot(
      process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || ''
    );

    const result = await bot.generateAndPublish(documentName);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Template generated and published successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}