// src/lib/documentParser.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as XLSX from 'xlsx';
import * as csv from 'csv-parse/sync';
import * as mammoth from 'mammoth';
import { Readable } from 'stream';
import { ocrService } from './ocrService';
import { ServerOCRService } from './serverOcrService';

/**
 * Extract text from various file types
 * @param fileBuffer The file buffer
 * @param mimeType The MIME type of the file
 * @param onProgress Optional progress callback for OCR
 * @returns Extracted text content
 */
export async function extractTextFromFile(
  fileBuffer: Buffer, 
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPdf(fileBuffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return extractTextFromDocx(fileBuffer);
    
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return extractTextFromExcel(fileBuffer);
    
    case 'text/csv':
      return extractTextFromCsv(fileBuffer);
    
    case 'text/plain':
      return fileBuffer.toString('utf-8');
    
    case 'image/jpeg':
    case 'image/png':
      console.log('Processing image document for OCR, mimeType:', mimeType);
      // Always attempt OCR for images, both server and client side
      return extractTextFromImage(fileBuffer, onProgress);
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Extract text from PDF files with hybrid approach
 * First tries traditional text extraction, falls back to OCR for scanned PDFs
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // First attempt: Traditional text extraction for text-based PDFs
    const textBasedResult = await extractTextFromPdfTraditional(fileBuffer);
    
    // Check if meaningful text was extracted
    const cleanText = textBasedResult.replace(/[^\w\s]/g, '').trim();
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 2).length;
    
    console.log(`Traditional PDF extraction: ${textBasedResult.length} chars, ${wordCount} meaningful words`);
    
    // If we got substantial meaningful text, use it
    if (textBasedResult.length > 100 && wordCount > 10) {
      console.log('PDF appears to contain extractable text, using traditional method');
      return textBasedResult;
    }
    
    // If minimal meaningful text, try OCR (likely scanned PDF)
    console.log('PDF appears to be scanned or image-based, attempting OCR...');
    
    // Only attempt OCR on server-side where Google Vision API is available
    if (typeof window === 'undefined') {
      const ocrResult = await ServerOCRService.extractTextFromPdf(fileBuffer);
      console.log(`OCR result received: "${ocrResult.substring(0, 100)}..." (${ocrResult.length} chars)`);
      
      // Check if OCR result is an error message
      const isOcrError = ocrResult.startsWith('Google Vision API is not configured') || 
                        ocrResult.startsWith('No readable text could be extracted') ||
                        ocrResult.startsWith('No meaningful text could be extracted') ||
                        ocrResult.startsWith('OCR service') ||
                        ocrResult.startsWith('Text extraction from PDF failed') ||
                        ocrResult.startsWith('PDF format is not supported');
      
      // If OCR was successful and returned meaningful content, use it
      if (ocrResult && !isOcrError && ocrResult.length > 20) {
        console.log(`OCR extraction successful: ${ocrResult.length} characters`);
        return ocrResult;
      } else {
        console.log(`OCR failed or returned insufficient text. Is error: ${isOcrError}, Length: ${ocrResult.length}`);
      }
    }
    
    // If OCR failed or we're client-side, return the traditional result even if minimal
    console.log('Using traditional extraction result as fallback');
    return textBasedResult || "Unable to extract text from this PDF. The document may be an image-based or scanned PDF that requires OCR processing.";
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Try OCR as last resort if traditional extraction completely failed
    if (typeof window === 'undefined') {
      try {
        console.log('Traditional extraction failed, trying OCR as last resort...');
        const ocrResult = await ServerOCRService.extractTextFromPdf(fileBuffer);
        if (ocrResult && !ocrResult.startsWith('Google Vision API is not configured')) {
          return ocrResult;
        }
      } catch (ocrError) {
        console.error('OCR fallback also failed:', ocrError);
      }
    }
    
    throw error;
  }
}

/**
 * Extract text from PDF using traditional method (text-based PDFs)
 */
async function extractTextFromPdfTraditional(fileBuffer: Buffer): Promise<string> {
  try {
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    
    // Combine all page contents
    return docs.map((doc: any) => doc.pageContent).join('\n\n');
  } catch (error) {
    console.error('Traditional PDF extraction failed:', error);
    return '';
  }
}

/**
 * Extract text from DOCX files
 */
async function extractTextFromDocx(fileBuffer: Buffer): Promise<string> {
  try {
    // Create a blob URL from the buffer for DocxLoader
    // For DOCX, using mammoth directly is often more reliable
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw error;
  }
}

/**
 * Extract text from Excel files
 */
function extractTextFromExcel(fileBuffer: Buffer): string {
  try {
    // Read the workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Extract text from all sheets
    const sheetNames = workbook.SheetNames;
    let allText = '';
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Add sheet name as heading
      allText += `Sheet: ${sheetName}\n\n`;
      
      // Convert sheet data to text
      for (const row of jsonData) {
        allText += (row as any[]).join('\t') + '\n';
      }
      
      allText += '\n\n';
    }
    
    return allText;
  } catch (error) {
    console.error('Error extracting text from Excel:', error);
    throw error;
  }
}

/**
 * Extract text from CSV files
 */
function extractTextFromCsv(fileBuffer: Buffer): string {
  try {
    // Parse CSV
    const content = fileBuffer.toString('utf-8');
    const records = csv.parse(content, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Format as readable text
    let text = '';
    
    // Add headers
    if (records.length > 0) {
      const headers = Object.keys(records[0]);
      text += headers.join('\t') + '\n';
      
      // Add separator
      text += headers.map(() => '---').join('\t') + '\n';
    }
    
    // Add data rows
    for (const record of records) {
      text += Object.values(record).join('\t') + '\n';
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from CSV:', error);
    throw error;
  }
}

/**
 * Extract text from images using OCR
 */
async function extractTextFromImage(fileBuffer: Buffer, onProgress?: (progress: number) => void): Promise<string> {
  try {
    console.log('extractTextFromImage called, buffer size:', fileBuffer.length, 'bytes');
    
    // Use server-side Google Vision API for OCR
    if (typeof window === 'undefined') {
      console.log('Using server-side Google Vision API for OCR');
      // Server-side: Use Google Vision API
      const text = await ServerOCRService.extractTextFromImage(fileBuffer);
      return text;
    } else {
      console.log('Using client-side Tesseract.js for OCR');
      // Client-side: Use browser-based tesseract.js as fallback
      const blob = new Blob([fileBuffer]);
      const text = await ocrService.extractTextFromImage(blob, {
        onProgress,
        language: 'eng'
      });
      
      if (!text || text.trim().length === 0) {
        console.log('Client-side OCR returned empty text');
        return "No text could be extracted from this image. The image may not contain readable text or the text may be too unclear.";
      }
      
      console.log('Client-side OCR result length:', text.length, 'characters');
      return text;
    }
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return "Failed to extract text from image. The image may be corrupted or contain unreadable text.";
  }
}

/**
 * Convert a buffer to a readable stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}