// src/lib/serverOcrService.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

interface OCROptions {
  languageHints?: string[];
  detectOrientation?: boolean;
}

export class ServerOCRService {
  private static client: ImageAnnotatorClient | null = null;

  /**
   * Initialize the Google Vision client
   */
  private static getClient(): ImageAnnotatorClient {
    if (!this.client) {
      // Initialize client with credentials from environment
      this.client = new ImageAnnotatorClient({
        // Google Cloud will automatically find credentials from:
        // 1. GOOGLE_APPLICATION_CREDENTIALS environment variable
        // 2. Service account key file
        // 3. Default service account (if running on Google Cloud)
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    }
    return this.client;
  }

  /**
   * Extract text from image buffer using Google Vision API
   */
  static async extractTextFromImage(
    imageBuffer: Buffer, 
    options: OCROptions = {}
  ): Promise<string> {
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
        console.warn('Google Vision API not configured, falling back to placeholder');
        return "Google Vision API is not configured. Please set up Google Cloud credentials to enable OCR text extraction from images.";
      }

      const client = this.getClient();

      // Configure the request
      const request = {
        image: {
          content: imageBuffer.toString('base64'),
        },
        features: [
          {
            type: 'TEXT_DETECTION' as const,
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: options.languageHints || ['en'],
        },
      };

      // Perform OCR
      const [result] = await client.annotateImage(request);
      
      // Extract text from the response
      const textAnnotations = result.textAnnotations;
      if (!textAnnotations || textAnnotations.length === 0) {
        return "No readable text could be extracted from this image. The image may not contain clear text or may be too low quality for OCR processing.";
      }

      // The first annotation contains the full detected text
      const fullText = textAnnotations[0].description || '';
      
      // Clean up the extracted text
      const cleanedText = fullText
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .trim();

      if (!cleanedText || cleanedText.length < 10) {
        return "No meaningful text could be extracted from this image. The image may contain only symbols, numbers, or very short text that doesn't provide sufficient content for document analysis.";
      }

      return cleanedText;
    } catch (error) {
      console.error('Google Vision OCR extraction failed:', error);
      
      // Return helpful error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
          return "OCR service quota exceeded. Please try again later or contact support to increase your Google Vision API quota.";
        }
        
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
          return "OCR service authentication failed. Please check your Google Cloud credentials configuration.";
        }
        
        if (error.message.includes('billing')) {
          return "Google Cloud billing is not enabled for this project. Please enable billing to use the Vision API.";
        }
      }
      
      return "Text extraction from image failed due to a service error. Please try uploading the document in a different format (PDF, Word, etc.) or contact support if the issue persists.";
    }
  }

  /**
   * Extract text with detailed information (positions, confidence, etc.)
   */
  static async extractTextWithDetails(imageBuffer: Buffer): Promise<{
    text: string;
    blocks: Array<{
      text: string;
      confidence: number;
      boundingBox: Array<{ x: number; y: number }>;
    }>;
  }> {
    try {
      const client = this.getClient();

      const [result] = await client.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' as const }],
      });

      const fullTextAnnotation = result.fullTextAnnotation;
      if (!fullTextAnnotation) {
        return { text: '', blocks: [] };
      }

      const text = fullTextAnnotation.text || '';
      const blocks = fullTextAnnotation.pages?.[0]?.blocks?.map(block => ({
        text: block.paragraphs?.map(p => 
          p.words?.map(w => 
            w.symbols?.map(s => s.text).join('')
          ).join(' ')
        ).join('\n') || '',
        confidence: block.confidence || 0,
        boundingBox: block.boundingBox?.vertices?.map(v => ({ 
          x: v.x || 0, 
          y: v.y || 0 
        })) || [],
      })) || [];

      return { text, blocks };
    } catch (error) {
      console.error('Google Vision detailed extraction failed:', error);
      return { text: '', blocks: [] };
    }
  }

  /**
   * Check if an image likely contains text worth extracting
   */
  static async hasReadableText(imageBuffer: Buffer): Promise<boolean> {
    try {
      const result = await this.extractTextFromImage(imageBuffer);
      
      // Basic heuristics to determine if meaningful text was found
      const cleanText = result.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const words = cleanText.split(/\s+/).filter(word => word.length > 2);
      
      return cleanText.length > 20 && words.length > 3 && 
             !result.startsWith('No readable text') && 
             !result.startsWith('Google Vision API is not configured');
    } catch (error) {
      console.error('Text detection failed:', error);
      return false;
    }
  }

  /**
   * Get supported language codes for Google Vision API
   */
  static getSupportedLanguages(): string[] {
    return [
      'en', // English
      'es', // Spanish
      'fr', // French
      'de', // German
      'it', // Italian
      'pt', // Portuguese
      'ru', // Russian
      'zh', // Chinese
      'ja', // Japanese
      'ko', // Korean
      'ar', // Arabic
      'hi', // Hindi
      'nl', // Dutch
      'sv', // Swedish
      'da', // Danish
      'no', // Norwegian
      'fi', // Finnish
    ];
  }
}

export default ServerOCRService;