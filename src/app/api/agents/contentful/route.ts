// app/api/agents/contentful/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'contentful-management';
import OpenAI from 'openai';
import { Document, BLOCKS } from '@contentful/rich-text-types';
import { createSlug } from '@/lib/data/blogAdapter';

// Initialize Contentful Management API
const managementClient = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || '',
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface GeneratedLegalContent {
  title: string;
  preview: Document;
  description: Document;
}

class SimpleWansomBot {
  private spaceId: string;
  private environmentId: string;

  constructor(spaceId: string, environmentId: string = 'master') {
    this.spaceId = spaceId;
    this.environmentId = environmentId;
  }

  async generateFromDocumentName(documentName: string): Promise<GeneratedLegalContent> {
    const systemPrompt = `You are the lead copywriter for Wansom.ai, the leading AI document drafting platform for lawyers. Your task is to come up with SEO optimized descriptions, preview and titles for legal documents that you are going to be given. The descriptions should follow a format of a product description because we want the end user to customize the template using Wansom.ai.

The content should follow this EXACT format and structure:

Start with a clear definition, then list alternative names with bold formatting.
Explain why this document is crucial.

**Why You Need a [Document Name]**
List specific benefits and explain consequences of not having one.

**What's Included in a [Document Name] Template?**
List what Wansom AI's template includes with bullet points.

**Is It Legally Valid in Every jurisdiction?**
Address legal validity and state compliance.

**How to Create a [Document Name] with Wansom AI**
Step-by-step process with bullet points.

**Why Use Wansom AI Drafting?**
Step-by-step process with bullet points.
 Fast and Efficient: Create a professional document in minutes.
 Smart Automation: Our AI understands your needs and tailors the document accordingly.
Comprehensive: Our templates are designed by legal professionals, ensuring their accuracy and compliance.

**Customize Your [Document Name] Form Now**
Call-to-action.

IMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks or any other formatting. Just pure JSON.

{
  "title": "SEO-optimized title MUST be between 50-60 characters (e.g., 'Health Care Proxy Template PDF Download','Divorce Papers – Customize & Download PDF')",
  "preview": "Brief 2-3 sentence product preview.Make sure the product name is within the first sentence. Mention to the reader that they can customize the document with wansom.ai",
  "description": "Full content following the exact format above with proper markdown formatting, bold text (**text**), and the specific structure shown"
}

Use the exact tone, formatting, and structure from the health care proxy example. Include proper formatting. Always end with the call-to-action.`;

const userPrompt = `Create SEO-optimized content for this legal document template: "${documentName}"

Analyze the document name and create appropriate content that would appeal to lawyers and legal professionals looking for this type of template on Wansom.ai.

Return only valid JSON without any markdown code blocks or additional formatting.`;
    
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

      console.log('AI Response:', aiResponse); // Debug log
      
      const result = this.parseAIResponse(aiResponse, documentName);
      console.log('Parsed Result:', JSON.stringify(result, null, 2)); // Debug log
      
      return result;
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

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
      // Clean the response - sometimes AI includes markdown code blocks
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        title: parsed.title || documentName,
        preview: this.convertToRichText(parsed.preview || ''),
        description: this.convertToRichText(parsed.description || ''),
      };
    } catch (error) {
      console.warn('Failed to parse JSON response, using fallback parsing');
      
      // Try to extract content from the malformed response
      let title = documentName;
      let preview = '';
      let description = aiResponse;
      
      // Look for title in the response
      const titleMatch = aiResponse.match(/"title":\s*"([^"]+)"/);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      // Look for preview in the response
      const previewMatch = aiResponse.match(/"preview":\s*"([^"]+)"/);
      if (previewMatch) {
        preview = previewMatch[1];
      }
      
      // Look for description in the response
      const descriptionMatch = aiResponse.match(/"description":\s*"([^"]+(?:\\.[^"]*)*?)"/);
      if (descriptionMatch) {
        description = descriptionMatch[1]
          .replace(/\\n/g, '\n')  // Convert \n to actual newlines
          .replace(/\\"/g, '"')   // Convert \" to actual quotes
          .replace(/\\\\/g, '\\'); // Convert \\ to actual backslashes
      }
      
      return {
        title,
        preview: this.convertToRichText(preview || `Professional ${documentName} template available for customization on Wansom.ai's AI-powered platform.`),
        description: this.convertToRichText(description),
      };
    }
  }

  private convertToRichText(content: string): Document {
    const lines = content.split('\n');
    const richTextContent: any[] = [];
    let currentParagraph = '';
    let inList = false;
    let listItems: any[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Handle headings with bold formatting
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);
        currentParagraph = '';
        inList = false;
        listItems = [];
        
        // Extract text without the ** markers and create heading
        const headingText = trimmedLine.slice(2, -2);
        richTextContent.push(this.createHeadingNode(2, headingText));
      }
      // Handle markdown headings
      else if (trimmedLine.startsWith('### ')) {
        this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);
        currentParagraph = '';
        inList = false;
        listItems = [];
        richTextContent.push(this.createHeadingNode(3, trimmedLine.substring(4)));
      } else if (trimmedLine.startsWith('## ')) {
        this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);
        currentParagraph = '';
        inList = false;
        listItems = [];
        richTextContent.push(this.createHeadingNode(2, trimmedLine.substring(3)));
      } else if (trimmedLine.startsWith('# ')) {
        this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);
        currentParagraph = '';
        inList = false;
        listItems = [];
        richTextContent.push(this.createHeadingNode(1, trimmedLine.substring(2)));
      }
      // Handle bullet points and checkmarks
      else if (trimmedLine.startsWith('✅') || trimmedLine.startsWith('✍️') || trimmedLine.startsWith('🆓') || trimmedLine.startsWith('👉')) {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
        inList = true;
        listItems.push(this.createListItemNode(trimmedLine));
      }
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (currentParagraph) {
          richTextContent.push(this.createParagraphNode(currentParagraph));
          currentParagraph = '';
        }
        inList = true;
        listItems.push(this.createListItemNode(trimmedLine.substring(2)));
      }
      // Handle empty lines
      else if (trimmedLine === '') {
        this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);
        currentParagraph = '';
        inList = false;
        listItems = [];
      }
      // Handle regular text with bold formatting
      else {
        if (inList) {
          richTextContent.push(this.createUnorderedListNode(listItems));
          listItems = [];
          inList = false;
        }
        currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
      }
    }

    // Flush remaining content
    this.flushCurrentContent(richTextContent, currentParagraph, inList, listItems);

    return {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: richTextContent.length > 0 ? richTextContent : [this.createParagraphNode('No content provided')],
    };
  }

  private flushCurrentContent(
    richTextContent: any[], 
    currentParagraph: string, 
    inList: boolean, 
    listItems: any[]
  ) {
    if (inList && listItems.length > 0) {
      richTextContent.push(this.createUnorderedListNode(listItems));
    } else if (currentParagraph) {
      richTextContent.push(this.createParagraphNodeWithFormatting(currentParagraph));
    }
  }

  private createParagraphNodeWithFormatting(text: string) {
    // Handle bold text formatting **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    const content: any[] = [];

    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Bold text
        content.push({
          nodeType: 'text',
          value: part.slice(2, -2),
          marks: [{ type: 'bold' }],
          data: {},
        });
      } else if (part.trim()) {
        // Regular text
        content.push({
          nodeType: 'text',
          value: part,
          marks: [],
          data: {},
        });
      }
    }

    return {
      nodeType: 'paragraph',
      data: {},
      content: content.length > 0 ? content : [{
        nodeType: 'text',
        value: text,
        marks: [],
        data: {},
      }],
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

  private createUnorderedListNode(listItems: any[]) {
    return {
      nodeType: 'unordered-list',
      data: {},
      content: listItems,
    };
  }

  private createListItemNode(text: string) {
    return {
      nodeType: 'list-item',
      data: {},
      content: [
        {
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
        },
      ],
    };
  }
}

// POST handler for generating and publishing templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentName } = body;
    
    if (!documentName) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Document name is required' 
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Contentful space ID not configured' 
        },
        { status: 500 }
      );
    }

    if (!process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Contentful management token not configured' 
        },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          message: 'OpenAI API key not configured' 
        },
        { status: 500 }
      );
    }

    const bot = new SimpleWansomBot(
      process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID
    );

    const result = await bot.generateAndPublish(documentName.trim());

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Template generated and published successfully',
    });

  } catch (error) {
    console.error('Error in contentful agent:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate template',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET handler (optional) - for health check or listing templates
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Wansom.ai Contentful Agent is running',
    endpoint: '/api/agents/contentful',
    method: 'POST',
    expectedBody: {
      documentName: 'string (required)'
    }
  });
}