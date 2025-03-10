// src/lib/documentParser.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as XLSX from 'xlsx';
import * as csv from 'csv-parse/sync';
import * as mammoth from 'mammoth';
import { Readable } from 'stream';

/**
 * Extract text from various file types
 * @param fileBuffer The file buffer
 * @param mimeType The MIME type of the file
 * @returns Extracted text content
 */
export async function extractTextFromFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
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
      // For images, you would need OCR service like Tesseract
      // This is a placeholder - in production you'd integrate with an OCR service
      return "Image content - text extraction requires OCR service";
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Extract text from PDF files
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    
    // Combine all page contents
    return docs.map((doc: any) => doc.pageContent).join('\n\n');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
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
 * Convert a buffer to a readable stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}