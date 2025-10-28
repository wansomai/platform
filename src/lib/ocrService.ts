
// src/lib/ocrService.ts

class OCRService {
  private worker: any = null;
  private isInitialized = false;
  private isClient = typeof window !== 'undefined';

  /**
   * Initialize the OCR worker (client-side only)
   */
  private async initWorker(): Promise<void> {
    if (!this.isClient) {
      throw new Error('OCR can only run on the client side');
    }

    if (this.isInitialized && this.worker) {
      return;
    }

    try {
      // Dynamic import to ensure client-side only
      const { createWorker } = await import('tesseract.js');
      
      this.worker = await createWorker('eng', 1, {
        logger: m => {
          // Only log important messages in production
        },
        // Use CDN for better reliability
        workerPath: 'https://unpkg.com/tesseract.js@6.0.1/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0/',
        corePath: 'https://unpkg.com/tesseract.js-core@6.0.1/tesseract-core.wasm.js',
      });

      this.isInitialized = true;
    } catch (error) {
      throw new Error('OCR initialization failed');
    }
  }

  /**
   * Extract text from image file
   * @param imageFile File or Blob containing the image
   * @param options OCR options
   * @returns Promise<string> extracted text
   */
  async extractTextFromImage(
    imageFile: File | Blob | Buffer | string, 
    options: {
      onProgress?: (progress: number) => void;
      language?: string;
    } = {}
  ): Promise<string> {
    if (!this.isClient) {
      return "OCR processing is only available in the browser. Please ensure this function is called on the client side.";
    }

    try {
      await this.initWorker();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      // Configure language if specified
      if (options.language && options.language !== 'eng') {
        await this.worker.loadLanguage(options.language);
        await this.worker.initialize(options.language);
      }

      // Perform OCR
      const result = await this.worker.recognize(imageFile, {
        logger: (m: any) => {
          // Report progress if callback provided
          if (options.onProgress && m.status === 'recognizing text') {
            options.onProgress(m.progress || 0);
          }
        }
      });

      // Clean up the extracted text to avoid LangChain template conflicts
      const cleanedText = result.data.text
        .replace(/\{([^}]*)\}/g, '[$1]') // Replace curly braces with square brackets
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .trim();

      return cleanedText;
    } catch (error) {
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extract text with confidence scores
   */
  async extractTextWithConfidence(
    imageFile: File | Blob | Buffer | string,
    options: {
      onProgress?: (progress: number) => void;
      language?: string;
      minConfidence?: number;
    } = {}
  ): Promise<{
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }> {
    if (!this.isClient) {
      return {
        text: "OCR processing is only available in the browser.",
        confidence: 0,
        words: []
      };
    }

    try {
      await this.initWorker();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      // Configure language if specified
      if (options.language && options.language !== 'eng') {
        await this.worker.loadLanguage(options.language);
        await this.worker.initialize(options.language);
      }

      const result = await this.worker.recognize(imageFile, {
        logger: (m: any) => {
          if (options.onProgress && m.status === 'recognizing text') {
            options.onProgress(m.progress || 0);
          }
        }
      });

      // Filter words by confidence if specified
      const minConfidence = options.minConfidence || 0;
      const filteredWords = result.data.words
        .filter((word: any) => word.confidence >= minConfidence)
        .map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        }));

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: filteredWords
      };
    } catch (error) {
      throw new Error('Failed to extract text with confidence from image');
    }
  }

  /**
   * Check if image contains text (quick confidence check)
   */
  async hasText(imageFile: File | Blob | Buffer | string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    try {
      const result = await this.extractTextWithConfidence(imageFile, { minConfidence: 30 });
      return result.words.length > 0 && result.text.trim().length > 10;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup worker resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'eng', // English
      'spa', // Spanish  
      'fra', // French
      'deu', // German
      'ita', // Italian
      'por', // Portuguese
      'rus', // Russian
      'chi_sim', // Chinese Simplified
      'chi_tra', // Chinese Traditional
      'jpn', // Japanese
      'kor', // Korean
      'ara', // Arabic
      'hin', // Hindi
    ];
  }
}

// Export singleton instance
export const ocrService = new OCRService();
export default ocrService;