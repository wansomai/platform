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
import { canUploadDocument } from '@/lib/subscription';

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
    // Optional org override — used when a user is editing an AI associate from
    // a different active organization than the one the associate lives in.
    // We still require the user to actually be a member of that org.
    const orgOverride = searchParams.get('organizationId') || undefined;

    let organizationId: string;
    if (orgOverride) {
      // Primary org membership is on User.organizationId; secondary orgs are in UserOrganization.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      });
      const isPrimaryOrg = user?.organizationId === orgOverride;
      if (!isPrimaryOrg) {
        const membership = await prisma.userOrganization.findUnique({
          where: { userId_organizationId: { userId, organizationId: orgOverride } },
          select: { userId: true }
        });
        if (!membership) {
          return NextResponse.json(
            { message: 'You are not a member of the requested organization', error: true },
            { status: 403 }
          );
        }
      }
      organizationId = orgOverride;
    } else {
      // ✅ Use helper to get active organization ID (supports org switching)
      organizationId = await getActiveOrganizationId(userId);
    }

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
    //   3. Its visibility is 'restricted' and they have an explicit
    //      DocumentPermission row (e.g. granted when the owner shared an
    //      AI associate whose knowledge base includes this document).
    // For folder-scoped requests we also verify the user can access that folder.

    const isFolderRequest = Boolean(folderId && folderId !== 'root');

    // --- Access enforcement ---
    //
    // Root view: show documents the user uploaded OR documents explicitly
    // shared with the user (via DocumentPermission). Sharing happens either
    // directly on the document or indirectly via an AI associate whose KB
    // includes the document.
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
      // Root / all-documents view — documents the user uploaded, plus documents
      // shared with them (e.g. KB documents cascade-shared via an associate).
      ownershipFilter = {
        OR: [
          { created_by: userId },
          { permissions: { some: { userId } } }
        ]
      };
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
    
    // Load the user first — the active-org fallback is only used if the client
    // does not explicitly override the target organization (see below).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true },
        { status: 404 }
      );
    }

    // JSON path: file was already uploaded directly to Vercel Blob by the client.
    // Only the metadata + blob URL are sent here — no file bytes in this request.
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        blobUrl,
        filename,
        fileType,
        fileSize,
        description: jsonDescription = '',
        folderId: jsonFolderId = null,
        customTitle: jsonCustomTitle = null,
      } = body;
      const jsonOrgOverride = body.organizationId?.trim() || null;

      if (!blobUrl || !filename) {
        return NextResponse.json({ message: 'blobUrl and filename are required', error: true }, { status: 400 });
      }
      if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        return NextResponse.json({ message: 'File type not supported', error: true }, { status: 400 });
      }
      if (fileSize > FILE_UPLOAD_CONFIG.MAX_SIZE) {
        return NextResponse.json(
          { message: `File exceeds the ${FILE_UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB limit`, error: true },
          { status: 400 }
        );
      }

      // Org resolution
      let jsonOrgId: string;
      if (jsonOrgOverride) {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
        const isPrimary = u?.organizationId === jsonOrgOverride;
        if (!isPrimary) {
          const membership = await prisma.userOrganization.findUnique({
            where: { userId_organizationId: { userId, organizationId: jsonOrgOverride } },
            select: { userId: true },
          });
          if (!membership) {
            return NextResponse.json({ message: 'You are not a member of the requested organization', error: true }, { status: 403 });
          }
        }
        jsonOrgId = jsonOrgOverride;
      } else {
        jsonOrgId = await getActiveOrganizationId(userId);
      }

      // Vault upload limit check for free-plan accounts
      const vaultCheck = await canUploadDocument(jsonOrgId, userId);
      if (!vaultCheck.allowed) {
        return NextResponse.json(
          { message: vaultCheck.reason, error: true, requiresUpgrade: true },
          { status: 403 }
        );
      }

      // Folder permission check
      if (jsonFolderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: jsonFolderId, organizationId: jsonOrgId },
          include: { permissions: { select: { userId: true } } },
        });
        if (!folder) return NextResponse.json({ message: 'Folder not found', error: true }, { status: 404 });
        const canUpload = folder.createdBy === userId || folder.permissions.some((p: any) => p.userId === userId);
        if (!canUpload) return NextResponse.json({ message: 'You do not have permission to upload to this folder', error: true }, { status: 403 });
      }

      // Title and duplicate check
      const jsonBaseName = filename.replace(/\.[^/.]+$/, '');
      const jsonTitle = jsonCustomTitle || jsonBaseName;
      const jsonConflict = await prisma.document.findFirst({
        where: { organization_id: jsonOrgId, created_by: userId, title: { equals: jsonTitle, mode: 'insensitive' }, folderId: jsonFolderId || null, status: 'active' },
        select: { id: true },
      });
      if (jsonConflict) {
        const location = jsonFolderId ? 'this folder' : 'the root folder';
        return NextResponse.json(
          { message: `A document named "${jsonTitle}" already exists in ${location}.`, error: true, existingDocumentId: jsonConflict.id },
          { status: 409 }
        );
      }

      const jsonFileExt = (filename.split('.').pop() || '').toLowerCase();
      const SUPPORTED_MIME_TYPES_FOR_EXTRACTION = new Set([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv', 'text/plain',
        'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      ]);
      const jsonExtractionAttempted = SUPPORTED_MIME_TYPES_FOR_EXTRACTION.has(fileType);

      const jsonDoc = await prisma.document.create({
        data: {
          title: jsonTitle,
          description: { String: jsonDescription, Valid: jsonDescription.length > 0 },
          file_url: blobUrl,
          file_type: jsonFileExt,
          file_size: fileSize || 0,
          status: 'active',
          visibility: 'private',
          created_by: userId,
          organization_id: jsonOrgId,
          folderId: jsonFolderId || null,
          metadata: { RawMessage: JSON.stringify({ originalName: filename, mimeType: fileType }), Valid: true },
          content_extracted: jsonExtractionAttempted ? { Bool: false, Valid: true } : Prisma.JsonNull,
        },
        include: { createdByUser: { select: { id: true, fullName: true } } },
      });

      if (jsonExtractionAttempted) {
        after(async () => {
          try {
            const fileBuffer = await blobStorageService.downloadFile(blobUrl);
            const extractedText = await extractTextFromFile(fileBuffer, fileType);
            const ok = extractedText.trim().length > 0;
            if (ok) {
              await prisma.documentContent.create({ data: { documentId: jsonDoc.id, content: extractedText } });
              await prisma.document.update({ where: { id: jsonDoc.id }, data: { content_extracted: { Bool: true, Valid: true } } });
            } else {
              await prisma.document.update({ where: { id: jsonDoc.id }, data: { content_extracted: Prisma.JsonNull } });
            }
          } catch (err) {
            console.error('Background extraction failed for document', jsonDoc.id, err);
            try { await prisma.document.update({ where: { id: jsonDoc.id }, data: { content_extracted: Prisma.JsonNull } }); } catch {}
          }
        });
      }

      return NextResponse.json({
        status: 201,
        message: 'Document uploaded successfully',
        data: {
          id: jsonDoc.id,
          title: jsonDoc.title,
          description: jsonDescription,
          fileUrl: jsonDoc.file_url,
          fileType: jsonDoc.file_type,
          fileSize: jsonDoc.file_size,
          createdBy: jsonDoc.createdByUser?.fullName || user?.fullName || 'Unknown',
          createdById: jsonDoc.created_by,
          createdAt: jsonDoc.created_at.toISOString(),
          updatedAt: jsonDoc.updated_at.toISOString(),
          contentExtracted: false,
          visibility: 'private',
        },
      }, { status: 201 });
    }

    // For multipart/form-data, need to use FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const folderId = formData.get('folderId') as string || null;
    // Optional custom title supplied by the client (e.g. after rename-on-conflict)
    const customTitle = (formData.get('title') as string | null)?.trim() || null;
    // Optional org override — used when uploading a KB document from an associate
    // owned in a different organization than the user's currently-active one.
    // Membership is verified before the upload proceeds.
    const orgOverride = (formData.get('organizationId') as string | null)?.trim() || null;

    let organizationId: string;
    if (orgOverride) {
      // Primary org membership is stored on User.organizationId, not in UserOrganization.
      // Secondary org memberships are in UserOrganization. Check both.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      });
      const isPrimaryOrg = user?.organizationId === orgOverride;
      if (!isPrimaryOrg) {
        const membership = await prisma.userOrganization.findUnique({
          where: { userId_organizationId: { userId, organizationId: orgOverride } },
          select: { userId: true }
        });
        if (!membership) {
          return NextResponse.json(
            { message: 'You are not a member of the requested organization', error: true },
            { status: 403 }
          );
        }
      }
      organizationId = orgOverride;
    } else {
      organizationId = await getActiveOrganizationId(userId);
    }

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

    // Vault upload limit check for free-plan accounts
    const vaultCheckMultipart = await canUploadDocument(organizationId, userId);
    if (!vaultCheckMultipart.allowed) {
      return NextResponse.json(
        { message: vaultCheckMultipart.reason, error: true, requiresUpgrade: true },
        { status: 403 }
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

    // Check for title conflict scoped to this user's documents in the target folder
    // (or root when no folder). Only active documents are considered — soft-deleted
    // or abandoned records must not permanently block re-uploads of the same file.
    // The check is intentionally user-scoped (not org-wide) so that two different
    // org members can each have a document with the same name.
    const titleConflict = await prisma.document.findFirst({
      where: {
        organization_id: organizationId,
        created_by: userId,
        title: { equals: documentTitle, mode: 'insensitive' },
        folderId: folderId || null,
        status: 'active',
      },
      select: { id: true }
    });
    if (titleConflict) {
      const location = folderId ? 'this folder' : 'the root folder';
      return NextResponse.json(
        {
          message: `A document named "${documentTitle}" already exists in ${location}.`,
          error: true,
          // Include the existing document's ID so callers (e.g. KB upload in associate pages)
          // can reuse it directly instead of failing on the conflict.
          existingDocumentId: titleConflict.id,
        },
        { status: 409 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // Get file buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to blob BEFORE creating the DB record so a dropped connection
    // during upload never leaves a zombie Document row that blocks retries (409).
    const fileUrl = await blobStorageService.uploadFile(
      fileBuffer,
      fileName,
      file.type
    );

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
    const extractionAttempted = SUPPORTED_MIME_TYPES_FOR_EXTRACTION.has(file.type);

    // Create the DB record immediately after the blob upload succeeds.
    // content_extracted is set to { Bool: false, Valid: true } for extractable
    // types so the Vault shows a "processing" spinner while text extraction runs
    // in the background via after(). Non-extractable types get JsonNull (no spinner).
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
        content_extracted: extractionAttempted
          ? { Bool: false, Valid: true }
          : Prisma.JsonNull,
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

    // Run text extraction after the response is sent so large files (dense PDFs,
    // big DOCX) do not push the request past Vercel's function timeout.
    // The Vault spinner resolves when content_extracted flips to true (or null on failure).
    if (extractionAttempted) {
      after(async () => {
        try {
          const extractedText = await extractTextFromFile(fileBuffer, file.type);
          const extractionComplete = extractedText.trim().length > 0;

          if (extractionComplete) {
            await prisma.documentContent.create({
              data: { documentId: document.id, content: extractedText }
            });
            await prisma.document.update({
              where: { id: document.id },
              data: { content_extracted: { Bool: true, Valid: true } },
            });
          } else {
            // Nothing extracted — clear the spinner
            await prisma.document.update({
              where: { id: document.id },
              data: { content_extracted: Prisma.JsonNull },
            });
          }
        } catch (extractError) {
          console.error('Background text extraction failed for document', document.id, extractError);
          // Clear the spinner so the Vault doesn't poll indefinitely
          try {
            await prisma.document.update({
              where: { id: document.id },
              data: { content_extracted: Prisma.JsonNull },
            });
          } catch (_) { /* best-effort */ }
        }
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
      contentExtracted: false,
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