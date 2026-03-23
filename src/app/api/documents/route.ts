// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { getActiveOrganizationId } from '@/lib/api/org-helpers';
import { blobStorageService } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/documentParser';
import { validateFile } from '@/lib/utils';
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_CONFIG } from '@/lib/utils/constants';
import { Prisma } from '@/prisma/client';

// Allow up to 120 s for large file uploads + text extraction on Vercel Pro.
export const maxDuration = 120;


export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
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
    
    // ✅ Use helper to get active organization ID (supports org switching)
    const organizationId = await getActiveOrganizationId(userId);

    // Build base query filters
    const where: any = {
      organization_id: organizationId,
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

    // --- Ownership / access enforcement ---
    // A user can see a document if:
    //   1. They uploaded it (created_by === userId), OR
    //   2. Its visibility is 'organization' (visible to all org members), OR
    //   3. Its visibility is 'restricted' and they have an explicit DocumentPermission row.
    // For folder-scoped requests we also verify the user can access that folder.

    const isFolderRequest = Boolean(folderId && folderId !== 'root');

    // --- Access enforcement ---
    //
    // Root view: show only documents the user uploaded.
    //
    // Folder view: if the user can access the folder (owns it, has been
    // granted explicit permission, or the folder is org-wide), they can
    // see ALL documents inside it regardless of per-document visibility.
    // If they have no folder access, return an empty result.
    //
    // Sharing a document is always restricted to its uploader (enforced
    // separately in the permissions PUT route).

    let ownershipFilter: any;

    if (isFolderRequest) {
      // Single query: does the user have access to this folder?
      const accessibleFolder = await prisma.folder.findFirst({
        where: {
          id: folderId as string,
          organizationId,
          OR: [
            { createdBy: userId },
            { visibility: 'organization' },
            { permissions: { some: { userId } } }
          ]
        },
        select: { id: true }
      });

      if (!accessibleFolder) {
        return NextResponse.json({
          status: 200,
          message: 'Documents retrieved successfully',
          data: [],
          pagination: { total: 0, page, limit, pages: 0, hasNext: false, hasPrev: false }
        });
      }

      // Folder accessible — no per-document filter needed; show everything in the folder
      ownershipFilter = null;
    } else {
      // Root / all-documents view — only documents the user uploaded
      ownershipFilter = { created_by: userId };
    }

    if (ownershipFilter) {
      if (where.OR) {
        // Wrap existing OR (search) in AND together with the ownership filter
        where.AND = [{ OR: where.OR }, ownershipFilter];
        delete where.OR;
      } else if (where.AND) {
        where.AND.push(ownershipFilter);
      } else {
        where.AND = [ownershipFilter];
      }
    }

    // Fast path: caller only needs titles for conflict detection (e.g., upload modal).
    // Skip joins, pagination count, and all non-essential fields.
    const titlesOnly = searchParams.get('titlesOnly') === 'true';
    if (titlesOnly) {
      const titles = await prisma.document.findMany({
        where,
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
        take: 1000,
      });
      return NextResponse.json({ status: 200, message: 'Documents retrieved successfully', data: titles });
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
    
    const [totalCount, documents] = await Promise.all([
      isLimitedRequest ? Promise.resolve(0) : prisma.document.count({ where }),

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
          content_extracted: true,
          visibility: true,
          createdByUser: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      })
    ]);
    
    // Derive contentExtracted boolean for UI (processing state in Vault).
    // null           → old/unknown document, treat as ready (no spinner)
    // { Bool: true } → extraction complete (no spinner)
    // { Bool: false } + age < 2 min → background job in-progress (show spinner)
    // { Bool: false } + age ≥ 2 min → job timed out / failed, treat as ready (no spinner)
    const parseContentExtracted = (raw: unknown, createdAt?: Date): boolean => {
      if (raw == null) return true;
      if (typeof raw === 'object' && raw !== null && 'Bool' in (raw as object)) {
        const extracted = Boolean((raw as { Bool?: boolean }).Bool);
        if (!extracted && createdAt) {
          const ageMs = Date.now() - createdAt.getTime();
          if (ageMs > 2 * 60 * 1000) return true; // give up after 2 min
        }
        return extracted;
      }
      return true;
    };

    // OPTIMIZATION 5: Lightweight response for simple requests
    const formattedDocuments = documents.map((doc: any) => {
      const base = {
        id: doc.id,
        title: doc.title,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        createdBy: doc.createdByUser?.fullName || 'Unknown',
        createdById: doc.created_by,
        createdAt: doc.created_at.toISOString(),
        contentExtracted: parseContentExtracted(doc.content_extracted, doc.created_at),
        // Only include these fields for detailed requests
        ...(!isLimitedRequest && {
          description: (doc as any).description || '',
          fileUrl: (doc as any).file_url,
          updatedAt: (doc as any).updated_at?.toISOString(),
          folderId: (doc as any).folderId,
          visibility: (doc as any).visibility ?? 'private',
        }),
      };
      return base;
    });
    
    const total = isLimitedRequest ? documents.length : totalCount;
    const pages = isLimitedRequest ? 1 : Math.ceil(total / limit);

    return NextResponse.json({
      status: 200,
      message: 'Documents retrieved successfully',
      data: formattedDocuments,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
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
    // Get user ID and organization from token (with JWT signature verification)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's active organization (supports org switching) and name
    const [organizationId, user] = await Promise.all([
      getActiveOrganizationId(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true }
      })
    ]);

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
    // Optional custom title supplied by the client (e.g. after rename-on-conflict)
    const customTitle = (formData.get('title') as string | null)?.trim() || null;

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
    // If folderId is provided, verify it exists and that the user can upload to it.
    // For restricted folders: only the creator or explicitly-permitted users may upload.
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId, organizationId },
        include: { permissions: { select: { userId: true } } }
      });

      if (!folder) {
        return NextResponse.json(
          { message: 'Folder not found', error: true },
          { status: 404 }
        );
      }

      const canUpload =
        folder.createdBy === userId ||
        folder.permissions.some((p: any) => p.userId === userId);

      if (!canUpload) {
        return NextResponse.json(
          { message: 'You do not have permission to upload to this folder', error: true },
          { status: 403 }
        );
      }
    }

    // Determine the document title and check for duplicates
    const fileBaseName = file.name.replace(/\.[^/.]+$/, '');
    const documentTitle = customTitle || fileBaseName;

    // Check for title conflict scoped to the target folder (or root when no folder)
    const titleConflict = await prisma.document.findFirst({
      where: {
        organization_id: organizationId,
        title: { equals: documentTitle, mode: 'insensitive' },
        folderId: folderId || null
      },
      select: { id: true }
    });
    if (titleConflict) {
      const location = folderId ? 'this folder' : 'the root folder';
      return NextResponse.json(
        { message: `A document named "${documentTitle}" already exists in ${location}. Please rename it before uploading.`, error: true },
        { status: 409 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to storage service
    const fileUrl = await blobStorageService.uploadFile(
      fileBuffer,
      fileName,
      file.type
    );
    
    // Extract text content from the file buffer.
    // We mark contentExtracted=true as long as extraction was ATTEMPTED for a
    // supported file type — there is no background job running after this response
    // returns, so leaving it false would cause the Vault to poll forever. If mammoth
    // fails on a DOCX, on-demand extraction (tryExtractDocumentContentOnDemand) retries
    // at chat time. For scanned PDFs/images the sentinel strings are stored as-is.
    const SUPPORTED_MIME_TYPES_FOR_EXTRACTION = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
    ]);
    let contentExtracted = SUPPORTED_MIME_TYPES_FOR_EXTRACTION.has(file.type);
    let extractedText = '';

    try {
      extractedText = await extractTextFromFile(fileBuffer, file.type);
    } catch (extractError) {
      console.error('Error extracting text from file:', extractError);
      // Continue without extracted text — on-demand extraction will run at chat time
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title: documentTitle,
        description: {
          String: description,
          Valid: description.length > 0
        },
        file_url: fileUrl,
        file_type: fileExt.toLowerCase(),
        file_size: file.size,
        status: 'active',
        visibility: 'private',
        created_by: userId,
        organization_id: organizationId,
        folderId: folderId || null,
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
    
    // If text was extracted, store it (only when non-empty)
    if (extractedText && extractedText.trim().length > 0) {
      try {
        await prisma.documentContent.create({
          data: {
            documentId: document.id,
            content: extractedText
          }
        });
      } catch (err) {
        console.error('Background text extraction failed for document', document.id, err);
        // Reset flag to null so the vault doesn't show the spinner forever
        try {
          await prisma.document.update({
            where: { id: document.id },
            data: { content_extracted: Prisma.JsonNull },
          });
        } catch (_) { /* best-effort */ }
      }
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
      contentExtracted: false,  // Extraction runs after response; vault polls for completion
      visibility: 'private'
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