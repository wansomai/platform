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
        return "Google Vision API is not configured. Please set up Google Cloud credentials to enable OCR text extraction from images.";
      }

      const client = this.getClient();
      console.log('Google Vision client initialized successfully');

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

      console.log('Making OCR request to Google Vision API...');
      // Perform OCR
      const [result] = await client.annotateImage(request);
      console.log('OCR request completed successfully');
      
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
        .replace(/\{([^}]*)\}/g, '[$1]') // Replace curly braces with square brackets to avoid LangChain template conflicts
        .trim();

      if (!cleanedText || cleanedText.length < 10) {
        return "No meaningful text could be extracted from this image. The image may contain only symbols, numbers, or very short text that doesn't provide sufficient content for document analysis.";
      }

      return cleanedText;
    } catch (error) {
      console.error('Google Vision OCR extraction failed:', error);
      
      // Log detailed error information
      console.error('OCR Error Details:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      });
      
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
   * Extract text directly from PDF using Google Vision API asyncBatchAnnotateFiles
   * This is the correct method for multi-page PDF documents
   * Requires Google Cloud Storage for temporary file processing
   */
  static async extractTextFromPdf(
    pdfBuffer: Buffer,
    options: OCROptions = {}
  ): Promise<string> {
    try {
      console.log('Starting direct PDF OCR with Google Vision API (asyncBatchAnnotateFiles)');
      
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
        console.warn('Google Vision API not configured for PDF OCR');
        return "Google Vision API is not configured. Please set up Google Cloud credentials to enable OCR text extraction from scanned PDFs.";
      }

      if (!process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
        console.warn('Google Cloud Storage bucket not configured for PDF OCR');
        return "Google Cloud Storage is not configured. PDF OCR requires a storage bucket for processing multi-page documents. Please set GOOGLE_CLOUD_STORAGE_BUCKET environment variable.";
      }

      const client = this.getClient();
      
      // Import Google Cloud Storage
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });

      const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
      const bucket = storage.bucket(bucketName);
      
      // Generate unique file names
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const inputFileName = `pdf-ocr/input-${timestamp}-${randomId}.pdf`;
      const outputPrefix = `pdf-ocr/output-${timestamp}-${randomId}/`;

      console.log('Uploading PDF to Google Cloud Storage...');
      
      // Upload PDF to Google Cloud Storage
      const inputFile = bucket.file(inputFileName);
      await inputFile.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      });

      const gcsSourceUri = `gs://${bucketName}/${inputFileName}`;
      const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}`;

      // Configure the batch request for PDF processing
      const request = {
        requests: [
          {
            inputConfig: {
              mimeType: 'application/pdf',
              gcsSource: {
                uri: gcsSourceUri,
              },
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION' as const,
              },
            ],
            outputConfig: {
              gcsDestination: {
                uri: gcsDestinationUri,
              },
            },
            imageContext: {
              languageHints: options.languageHints || ['en'],
            },
          },
        ],
      };

      console.log('Making async PDF OCR request to Google Vision API...');
      
      // Perform async OCR operation
      const [operation] = await client.asyncBatchAnnotateFiles(request);
      console.log('Waiting for OCR operation to complete...');
      const [filesResponse] = await operation.promise();

      console.log('PDF OCR operation completed successfully');

      // Download and parse results
      const [files] = await bucket.getFiles({ prefix: outputPrefix });

      let allText = '';
      let pageCount = 0;
      
      // Process all output files (one per page)
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          console.log(`Processing OCR result file: ${file.name}`);
          const [content] = await file.download();
          const result = JSON.parse(content.toString());
          
          // Extract text from each page
          if (result.responses) {
            for (const response of result.responses) {
              if (response.fullTextAnnotation && response.fullTextAnnotation.text) {
                allText += response.fullTextAnnotation.text + '\n\n';
                pageCount++;
              }
            }
          }
        }
      }

      // Clean up temporary files
      console.log('Cleaning up temporary files...');
      try {
        await inputFile.delete();
        for (const file of files) {
          await file.delete();
        }
      } catch (cleanupError) {
        console.warn('Some temporary files could not be cleaned up:', cleanupError);
      }

      // Process the extracted text
      if (!allText.trim()) {
        return "No readable text could be extracted from this PDF. The PDF may not contain clear text or may be too low quality for OCR processing.";
      }

      // Clean up the extracted text
      const cleanedText = allText
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .replace(/\{([^}]*)\}/g, '[$1]') // Replace curly braces with square brackets to avoid LangChain template conflicts
        .trim();

      if (!cleanedText || cleanedText.length < 20) {
        return "No meaningful text could be extracted from this PDF. The PDF may contain only images, symbols, or very short text that doesn't provide sufficient content for document analysis.";
      }

      console.log(`PDF OCR extracted ${cleanedText.length} characters of text from ${pageCount} page(s)`);
      return cleanedText;
      
    } catch (error) {
      console.error('Google Vision PDF OCR extraction failed:', error);
      
      // Log detailed error information
      console.error('PDF OCR Error Details:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      });
      
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

        if (error.message.includes('bucket') || error.message.includes('storage') || error.message.includes('GcsSource')) {
          return "Google Cloud Storage configuration error. Please ensure GOOGLE_CLOUD_STORAGE_BUCKET is set and the bucket exists and is accessible.";
        }

        if (error.message.includes('INVALID_ARGUMENT') && error.message.includes('pdf')) {
          return "PDF format is not supported or the file is corrupted. Please try uploading the PDF again or convert it to images.";
        }
      }
      
      return "Text extraction from PDF failed due to a service error. Please try uploading the document in a different format or contact support if the issue persists.";
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