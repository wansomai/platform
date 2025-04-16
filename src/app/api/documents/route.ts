// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { blobStorageService } from '@/lib/storage';

// List documents (with filtering options)
export async function GET(request: NextRequest) {
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
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || undefined;
    const fileType = searchParams.get('type') || undefined;
    const sortBy = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query filters
    const where: any = {
      organization_id: user.organizationId,
      status: 'active'
    };
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { path: ['String'], string_contains: searchTerm } }
      ];
    }
    
    if (fileType) {
      where.file_type = fileType;
    }
    
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
      case 'recent':
      default:
        orderBy = { created_at: 'desc' };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await prisma.document.count({ where });
    
    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    // Format documents for response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      fileUrl: doc.file_url,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      createdBy: doc.createdByUser?.fullName || 'Unknown',
      createdById: doc.created_by,
      createdAt: doc.created_at.toISOString(),
      updatedAt: doc.updated_at.toISOString(),
      contentExtracted: doc.content_extracted ? 
        (typeof doc.content_extracted === 'object' && 'Bool' in doc.content_extracted ? 
          (doc.content_extracted as any).Bool : 
          false) : 
        false
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Documents retrieved successfully',
      data: formattedDocuments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { message: 'Failed to fetch documents', error: true },
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
      select: { organizationId: true }
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
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided', error: true },
        { status: 400 }
      );
    }
    
    // Check file size limit (5MB for Vercel free tier limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds the limit (5MB). Please upgrade your plan to upload larger files.', error: true },
        { status: 400 }
      );
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
        metadata: {
          RawMessage: JSON.stringify({
            originalName: file.name,
            mimeType: file.type
          }),
          Valid: true
        },
        content_extracted: {
          Bool: false,
          Valid: true
        }
      }
    });
    
    // Format response
    const documentInfo = {
      id: document.id,
      title: document.title,
      description: description,
      fileUrl: document.file_url,
      fileType: document.file_type,
      fileSize: document.file_size,
      createdAt: document.created_at.toISOString()
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