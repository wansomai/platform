// src/lib/documentParser.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as XLSX from 'xlsx';
import * as csv from 'csv-parse/sync';
import * as mammoth from 'mammoth';

/**
 * Extract text from various file types
 * For text-based files (PDF, DOCX, Excel, CSV, TXT), extracts text directly
 * For scanned PDFs and images, returns a marker for Gemini to process natively
 * @param fileBuffer The file buffer
 * @param mimeType The MIME type of the file
 * @param onProgress Optional progress callback (deprecated, kept for compatibility)
 * @returns Extracted text content or processing marker
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
      // Always attempt OCR for images, both server and client side
      return extractTextFromImage(fileBuffer, onProgress);
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Extract text from PDF files with hybrid approach
 * First tries traditional text extraction for text-based PDFs
 * For scanned PDFs, returns a marker that indicates Gemini should process it directly
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    // First attempt: Traditional text extraction for text-based PDFs
    const textBasedResult = await extractTextFromPdfTraditional(fileBuffer);

    // Check if meaningful text was extracted
    const cleanText = textBasedResult.replace(/[^\w\s]/g, '').trim();
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 2).length;

    // If we got substantial meaningful text, use it
    if (textBasedResult.length > 100 && wordCount > 10) {
      return textBasedResult;
    }

    // For scanned PDFs with minimal text, return a marker indicating Gemini should process directly
    // Gemini 2.0 can read scanned PDFs natively without requiring separate OCR
    return "[SCANNED_PDF_REQUIRES_PROCESSING]";

  } catch (error) {
    // If traditional extraction failed, mark for Gemini processing
    return "[SCANNED_PDF_REQUIRES_PROCESSING]";
  }
}

/**
 * Extract text from PDF using traditional method (text-based PDFs)
 */
async function extractTextFromPdfTraditional(fileBuffer: Buffer): Promise<string> {
  try {
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
    const validArrayBuffer = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : new Uint8Array(fileBuffer).buffer;
    const blob = new Blob([validArrayBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    
    // Combine all page contents
    return docs.map((doc: any) => doc.pageContent).join('\n\n');
  } catch (error) {
    return '';
  }
}

/**
 * Extract text from DOCX/DOC files using mammoth.
 * If mammoth fails or yields no text, returns the scanned sentinel so Gemini can
 * process the file natively. No PDF fallback — passing DOCX bytes to PDFLoader
 * causes hundreds of "Ignoring invalid character in hex string" warnings and never
 * produces useful output for real DOCX/DOC files.
 */
async function extractTextFromDocx(fileBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    if (result.value && result.value.trim().length > 0) {
      return result.value;
    }
  } catch {
    // mammoth failed — file may be DOC binary, corrupted, or misnamed
  }

  // Cannot extract text — let Gemini process the file natively
  return '[SCANNED_PDF_REQUIRES_PROCESSING]';
}

/**
 * Extract text from Excel files
 */
function extractTextFromExcel(fileBuffer: Buffer): string {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  let allText = '';

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    allText += `Sheet: ${sheetName}\n\n`;

    for (const row of jsonData) {
      allText += (row as any[]).join('\t') + '\n';
    }

    allText += '\n\n';
  }

  return allText;
}

/**
 * Extract text from CSV files
 */
function extractTextFromCsv(fileBuffer: Buffer): string {
  const content = fileBuffer.toString('utf-8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  let text = '';

  if (records.length > 0) {
    const headers = Object.keys(records[0]);
    text += headers.join('\t') + '\n';
    text += headers.map(() => '---').join('\t') + '\n';
  }

  for (const record of records) {
    text += Object.values(record).join('\t') + '\n';
  }

  return text;
}

/**
 * Extract text from images using Gemini's native vision
 * Gemini 2.0 can read images directly without requiring separate OCR
 */
async function extractTextFromImage(fileBuffer: Buffer, onProgress?: (progress: number) => void): Promise<string> {
  // Mark images to be processed by Gemini natively in chat
  // This provides better accuracy than separate OCR services
  return "[SCANNED_IMAGE_REQUIRES_PROCESSING]";
}

/** File types that support text extraction (and optionally scanned/image markers). */
const EXTRACTABLE_FILE_TYPES = new Set([
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'
]);

/**
 * Get MIME type from file extension for use with extractTextFromFile.
 * Returns null if the type is not supported for extraction.
 */
export function getMimeTypeFromFileExtension(fileType: string): string | null {
  const ext = (fileType || '').toLowerCase().trim();
  if (!EXTRACTABLE_FILE_TYPES.has(ext)) return null;
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls': return 'application/vnd.ms-excel';
    case 'csv': return 'text/csv';
    case 'txt': return 'text/plain';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'webp': return 'image/webp';
    default: return null;
  }
}