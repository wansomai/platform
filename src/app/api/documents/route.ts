// app/api/documents/route.ts 
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';
import { validateFile } from '@/lib/utils';
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG } from '@/lib/utils/constants';

// Set a reasonable timeout for document processing
export const maxDuration = 60;


export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || undefined;
    const fileType = searchParams.get('type') || undefined;
    const sortBy = searchParams.get('sort') || 'recent';
    const folderId = searchParams.get('folder') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = parseInt(searchParams.get('page') || '1');
    
    //Single query to get user organization
    const userWithOrg = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!userWithOrg?.organizationId) {
      return NextResponse.json(
        { message: 'User organization not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Build query filters
    const where: any = {
      organization_id: userWithOrg.organizationId,
      status: 'active'
    };
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    if (fileType && fileType !== 'all') {
      // Handle special filter cases
      if (fileType === 'image') {
        where.file_type = { in: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] };
      } else if (fileType === 'docx') {
        where.file_type = { in: ['doc', 'docx'] };
      } else if (fileType === 'xlsx') {
        where.file_type = { in: ['xls', 'xlsx'] };
      } else {
        where.file_type = fileType;
      }
    }
    
    if (folderId === 'root') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }
    // Dashboard needs minimal data, full pages need more
    const hasFilters = searchTerm || fileType || folderId || page > 1;
    const isLimitedRequest = limit <= 10 && !hasFilters; // Likely dashboard request
    
    // Determine sorting
    let orderBy: any;
    switch (sortBy) {
      case 'name':
        orderBy = { title: 'asc' };
        break;
      case 'size':
        orderBy = { file_size: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      default:
        orderBy = { created_at: 'desc' };
    }
    
    const skip = (page - 1) * limit;
    
    // OPTIMIZATION 3: Parallel queries for count and documents
    const [totalCount, documents] = await Promise.all([
      // Only get count if we're paginating (not for simple dashboard requests)
      hasFilters ? prisma.document.count({ where }) : Promise.resolve(0),
      
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          file_type: true,
          file_size: true,
          created_at: true,
          created_by: true,
            description: true,
            file_url: true,
            updated_at: true,
            folderId: true,
          createdByUser: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      })
    ]);
    
    // OPTIMIZATION 5: Lightweight response for simple requests
    const formattedDocuments = documents.map((doc): { description?: any; fileUrl?: any; updatedAt?: any; folderId?: any; id: string; title: string; fileType: string; fileSize: number; createdBy: string; createdById: string; createdAt: string; } => ({
      id: doc.id,
      title: doc.title,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      createdBy: doc.createdByUser?.fullName || 'Unknown',
      createdById: doc.created_by,
      createdAt: doc.created_at.toISOString(),
      // Only include these fields for detailed requests
      ...(!isLimitedRequest && {
        description: (doc as any).description || '',
        fileUrl: (doc as any).file_url,
        updatedAt: (doc as any).updated_at?.toISOString(),
        folderId: (doc as any).folderId,
      })
    }));
    
    const pages = hasFilters ? Math.ceil(totalCount / limit) : 1;
    
    return NextResponse.json({
      status: 200,
      message: 'Documents retrieved successfully',
      data: formattedDocuments,
      pagination: {
        total: hasFilters ? totalCount : documents.length,
        page,
        limit,
        pages,
        hasNext: hasFilters ? page < pages : false,
        hasPrev: hasFilters ? page > 1 : false
      }
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error',
        error: true 
      },
      { status: 500 }
    );
  }
}

// Upload a document
export async function POST(request: NextRequest) {
  try {
    // Get user ID and organization from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, fullName: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // For multipart/form-data, need to use FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const folderId = formData.get('folderId') as string || null;
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided', error: true },
        { status: 400 }
      );
    }
    
 const validation = validateFile(file, ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG.MAX_SIZE);
    if (!validation.isValid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }
    // If folderId is provided, verify it exists and belongs to the organization
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { 
          id: folderId,
          organizationId: user.organizationId
        }
      });
      
      if (!folder) {
        return NextResponse.json(
          { message: 'Folder not found', error: true },
          { status: 404 }
        );
      }
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${user.organizationId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to storage service
    const fileUrl = await blobStorageService.uploadFile(
      fileBuffer,
      fileName,
      file.type
    );
    
    // Start content extraction in background
    let contentExtracted = false;
    let extractedText = '';
    
    try {
      extractedText = await extractTextFromFile(fileBuffer, file.type);
      contentExtracted = true;
    } catch (extractError) {
      console.error('Error extracting text from file:', extractError);
      // Continue without extracted text - content extraction can be done later
    }
    
    // Create document record in database
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
        status: 'active',
        created_by: userId,
        organization_id: user.organizationId,
        folderId: folderId || null,
        metadata: {
          RawMessage: JSON.stringify({
            originalName: file.name,
            mimeType: file.type
          }),
          Valid: true
        },
        content_extracted: {
          Bool: contentExtracted,
          Valid: true
        }
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    // If text was extracted, store it
    if (contentExtracted && extractedText) {
      await prisma.documentContent.create({
        data: {
          documentId: document.id,
          content: extractedText
        }
      }).catch(err => {
        console.error('Error storing document content:', err);
        // Don't fail the upload if content storage fails
      });
    }
    
    // Format response to match the expected Document interface
    const documentInfo = {
      id: document.id,
      title: document.title,
      description: description,
      fileUrl: document.file_url,
      fileType: document.file_type,
      fileSize: document.file_size,
      createdBy: document.createdByUser?.fullName || 'Unknown',
      createdById: document.created_by,
      createdAt: document.created_at.toISOString(),
      updatedAt: document.updated_at.toISOString(),
      contentExtracted: contentExtracted
    };
    
    return NextResponse.json({
      status: 201,
      message: 'Document uploaded successfully',
      data: documentInfo
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { message: 'Failed to upload document', error: true },
      { status: 500 }
    );
  }
}