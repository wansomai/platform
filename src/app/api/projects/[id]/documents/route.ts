// src/app/api/projects/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';

const prisma = new PrismaClient();

// Set a longer timeout for file uploads
export const maxDuration = 60;

// Define allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png'
];

// File validation schema
const fileUploadSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional()
});

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
  
  if (!projectMember) {
    // Check if user belongs to the organization that owns the project
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return false;
    }
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project || project.organizationId !== user.organizationId) {
      return false;
    }
  }
  
  return true;
}

// GET handler - List all documents for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
        },
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      );
    }
    
    // Get category filter
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    
    // Build query
    const where: any = { project_id: projectId };
    
    if (category) {
      where.section = category;
    }
    
    // Get documents
    const documents = await prisma.document.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    // Format documents
    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      name: doc.title,
      file_url: doc.file_url,
      file_type: doc.file_type,
      file_size: doc.file_size,
      category: doc.section,
      uploaded_at: doc.created_at.toISOString(),
      uploaded_by: doc.createdByUser?.fullName || 'Unknown User',
      description: doc.description ? 
        (typeof doc.description === 'object' && 'String' in doc.description ? 
          (doc.description as any).String : 
          '') : 
        '',
      content_extracted: doc.content_extracted ? 
        (typeof doc.content_extracted === 'object' && 'Bool' in doc.content_extracted ? 
          (doc.content_extracted as any).Bool : 
          false) : 
        false
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Documents retrieved successfully',
      data: formattedDocuments
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST handler - Upload a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
    // Get user ID from request headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // For multipart/form-data, need to use FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string || '';
    
    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'No file provided' 
        },
        { status: 400 }
      );
    }
    
    fileUploadSchema.parse({ category, description });
    
    // Check file type
    const fileType = file.type;
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'File type not allowed' 
        },
        { status: 400 }
      );
    }
    
    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${projectId}/${uuidv4()}.${fileExt}`;
    
    // Upload to Backblaze B2
    const fileUrl = await blobStorageService.uploadFile(
      fileBuffer,
      fileName,
      fileType
    );
    
    // Extract text from file (this would be implemented based on file type)
    let extractedText = '';
    let contentExtracted = false;
    
    try {
      extractedText = await extractTextFromFile(fileBuffer, fileType);
      contentExtracted = true;
    } catch (extractError) {
      console.error('Error extracting text from file:', extractError);
      // Continue without extracted text
    }
    
    // Get organization ID from project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Project not found' 
        },
        { status: 404 }
      );
    }
    
    // Store document metadata in database
    const document = await prisma.document.create({
      data: {
        title: file.name,
        description: {
          String: description,
          Valid: description.length > 0
        },
        file_url: fileUrl,
        file_type: fileExt.toLowerCase(),
        file_size: file.size,
        section: category,
        status: 'active',
        content_extracted: {
          Bool: contentExtracted,
          Valid: true
        },
        metadata: {
          RawMessage: JSON.stringify({
            originalName: file.name,
            mimeType: fileType
          }),
          Valid: true
        },
        project: {
          connect: { id: projectId }
        },
        createdByUser: {
          connect: { id: userId }
        },
        organization: {
          connect: { id: project.organizationId }
        }
      }
    });
    
    // If text was extracted, store it in a separate table to avoid large data in main table
    if (contentExtracted && extractedText) {
      await prisma.documentContent.create({
        data: {
          documentId: document.id,
          content: extractedText
        }
      });
    }
    
    // Format response
    const documentInfo = {
      id: document.id,
      name: document.title,
      file_url: document.file_url,
      file_type: document.file_type,
      file_size: document.file_size,
      category: document.section,
      uploaded_at: document.created_at.toISOString(),
      description: description,
      content_extracted: contentExtracted
    };
    
    return NextResponse.json({
      status: 201,
      message: 'Document uploaded successfully',
      data: documentInfo
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}