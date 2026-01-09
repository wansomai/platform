# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wansom AI is a legal tech platform built with Next.js 16 that provides AI-powered legal workspace features including document management, AI-assisted legal drafting, contract review, and team collaboration tools for law firms.

## Development Commands

### Core Commands
```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build (includes Prisma client generation)
npm run build

# Production server
npm start

# Linting
npm run lint
```

### Database Commands
```bash
# Generate Prisma client (required after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js with JWT (credentials + Google OAuth)
- **State Management**: Zustand stores
- **UI Components**: Radix UI + TailwindCSS
- **AI Integration**: Google Gemini API
- **File Storage**: Vercel Blob Storage
- **OCR**: Google Cloud Vision API + Tesseract.js

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (account)/               # Authenticated user pages (dashboard, projects, vault, workflows)
│   ├── (admin)/                 # Admin-only pages
│   ├── (auth)/                  # Authentication pages (login, register, password reset)
│   ├── (landingpages)/          # Marketing and public pages
│   ├── (platform)/              # Main platform features
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── documents/          # Document management
│   │   ├── organization/       # Organization & team management
│   │   ├── projects/           # Project & workspace management
│   │   ├── workspace/          # Shared workspace features
│   │   └── submissions/        # Form submissions
│   └── layout.tsx              # Root layout with auth provider
├── components/                  # React components
│   ├── admin/                  # Admin dashboard components
│   ├── associates/             # AI associate management
│   ├── chat/                   # Chat interface components
│   ├── documents/              # Document viewer/editor
│   ├── home/                   # Landing page components
│   ├── layout/                 # Layout components (navbar, sidebar)
│   ├── organization/           # Organization settings
│   ├── projects/               # Project management UI
│   ├── ui/                     # Reusable UI components (shadcn/ui)
│   └── workspace/              # Workspace collaboration UI
├── lib/                        # Core utilities and services
│   ├── auth/                   # Authentication & authorization
│   │   ├── auth-options.ts    # NextAuth configuration
│   │   ├── permissions.ts     # Permission checking utilities
│   │   └── authorization.ts   # Role-based access control
│   ├── api/                    # API utilities
│   │   ├── middleware.ts      # API route middleware
│   │   ├── validation.ts      # Request validation
│   │   └── response.ts        # Standardized responses
│   ├── constants/              # App constants (roles, permissions)
│   ├── data/                   # Data adapters (Contentful, Sanity CMS)
│   ├── utils/                  # Utility functions
│   ├── documentParser.ts       # Parse various document formats
│   ├── ocrService.ts           # OCR processing (client-side)
│   ├── serverOcrService.ts     # OCR processing (server-side)
│   ├── geminiTools.ts          # Google Gemini API utilities
│   ├── functionExecutor.ts     # AI function calling execution
│   ├── associateExecutor.ts    # AI associate workflow execution
│   ├── email-service.ts        # Email sending (Nodemailer)
│   └── prisma.ts              # Prisma client instance
├── store/                      # Zustand state stores
│   ├── chat.store.ts          # Chat state management
│   ├── documents.store.ts     # Document state
│   ├── project.store.ts       # Project state
│   ├── associates.store.ts    # AI associates state
│   └── onboarding.store.ts    # Onboarding flow state
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts             # Authentication hooks
│   ├── useDocuments.ts        # Document operations
│   └── useProjects.ts         # Project operations
├── types/                      # TypeScript type definitions
├── services/                   # Service layer
│   ├── aiDocumentService.ts   # AI document generation
│   ├── gmailService.ts        # Gmail API integration
│   └── googleCalendarService.ts # Calendar API integration
├── providers/                  # React context providers
│   └── AuthProvider.tsx       # NextAuth session provider
└── prisma/                    # Generated Prisma client (output dir)
    └── client/
```

### Key Architectural Patterns

#### 1. Multi-Organization System
- Users belong to a primary `Organization` (auto-created on signup)
- Users can be invited to multiple organizations via `UserOrganization` join table
- Organizations have three account types: `personal` (default), `enterprise`
- Users can switch between organizations using `activeOrganizationId`
- Organization owners have full control; admins can manage members; members have basic access

#### 2. Authentication Flow
- JWT-based authentication via NextAuth.js
- Dual token system:
  - **Session token**: NextAuth JWT (30-day expiry)
  - **Access token**: Custom JWT (1-hour expiry, auto-refreshed)
- Google OAuth support with automatic account linking
- Tokens stored in session, accessible via `session.accessToken`
- API routes use `src/lib/api/middleware.ts` for authentication

#### 3. Project-Based Workspace Model
- `Project` → container for legal work
- `Conversation` → AI chat sessions within a project
- `Message` → chat messages with role (user/assistant)
- `Document` → uploaded files (linked to projects or org-wide)
- `KnowledgeBase` → project-specific instructions for AI
- `CanvasDocument` → collaborative rich-text editor content
- `SharedWorkspace` → external sharing of conversations with access control

#### 4. AI Associates System
- `AIAssociate` → customizable AI personas with specific practice areas
- `AssociateStep` → workflow steps for structured task execution
- `AssociateTool` → available tools (document generation, search, etc.)
- Associates can be assigned to projects via `ProjectAssociate`
- Execution handled by `lib/associateExecutor.ts`

#### 5. Document Management
- Documents stored in Vercel Blob Storage
- Text extraction on upload (PDF, DOCX, TXT, images via OCR)
- Content indexed in `DocumentContent` table
- Optional vector embeddings for semantic search (not currently active)
- Folder hierarchy via `Folder` table with parent-child relationships
- Document references tracked per conversation via `ConversationDocument`

#### 6. Role-Based Access Control (RBAC)
- **Organization roles**: `owner` > `admin` > `member`
- **Project roles**: `owner` > `editor` > `member`
- Permission utilities in `src/lib/auth/permissions.ts`
- Key permission types:
  - `INVITE_MEMBERS` (enterprise only, admin+)
  - `CHANGE_MEMBER_ROLES` (admin+)
  - `MANAGE_PROJECTS` (admin+)
  - `DELETE_ORGANIZATION_DOCUMENTS` (admin+)
  - `VIEW_ANALYTICS` (admin+)

#### 7. API Response Pattern
All API routes should use standardized responses from `src/lib/api/response.ts`:
```typescript
import { ApiResponse } from '@/lib/api/response';

// Success
return ApiResponse.success(data, statusCode);

// Error
return ApiResponse.error(message, statusCode);
```

#### 8. State Management
- Zustand stores for client-side state
- Server state fetched via API routes (no React Query/SWR)
- Stores typically follow pattern: `{ data, isLoading, error, fetch, update, delete }`

## Important Implementation Details

### Prisma Client Location
The Prisma client is generated to `src/prisma/client` (not the default location). Always import as:
```typescript
import { PrismaClient } from '@/prisma/client';
```

### Authentication in API Routes
Use the authentication middleware:
```typescript
import { authenticateRequest } from '@/lib/api/middleware';

export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.error(auth.error || 'Unauthorized', 401);
  }

  const userId = auth.userId;
  const organizationId = auth.organizationId;
  // ... route logic
}
```

### Organization Context
Most API operations require organization context:
- Get from JWT: `session.user.organizationId`
- Users can switch orgs, so always use `activeOrganizationId` or current session org
- Check permissions using `hasOrganizationPermission()` from `lib/auth/permissions.ts`

### Document Processing
- Client-side OCR: Use `lib/ocrService.ts` (Tesseract.js)
- Server-side OCR: Use `lib/serverOcrService.ts` (Google Vision API)
- PDF parsing: Uses `pdf-parse` for text extraction
- DOCX parsing: Uses `mammoth` for conversion to HTML
- Scanned PDFs require Google Cloud Storage bucket for Vision API processing

### AI Document Generation
- Service: `services/aiDocumentService.ts` or `src/aiDocumentService.ts`
- Uses Google Gemini 2.0 Flash
- Context includes: jurisdiction, project instructions, uploaded documents, conversation history
- Outputs HTML for rich text editors (Quill/TipTap)
- Streaming support available via `generateDocumentStreaming()`

### Environment Variables
Key variables (see `.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth JWT secret
- `NEXTAUTH_URL` - App URL (http://localhost:3000 in dev)
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Google Gemini API
- `GOOGLE_AUTH_CLIENT_ID/SECRET` - Google OAuth
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to GCP service account JSON (for Vision API)
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket for OCR temp files
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage token
- Email credentials for Nodemailer (SMTP)

### Route Groups
- `(account)` - Requires authentication, shows account layout
- `(auth)` - Authentication pages, redirects if logged in
- `(landingpages)` - Public marketing pages
- `(admin)` - Admin-only pages with permission checks
- `(platform)` - Main application features

### Testing Project Locally
1. Set up PostgreSQL database
2. Copy `.env` and configure environment variables
3. Run `npx prisma generate` to generate Prisma client
4. Run `npx prisma migrate deploy` to apply migrations
5. Run `npm run dev` to start development server
6. Create test user via `/register` or seed database

### Common Gotchas
- Prisma client path is custom (`@/prisma/client`)
- Always regenerate Prisma client after schema changes
- Organization switching requires session update (`update` trigger in NextAuth)
- Google OAuth tokens are stored in `Account` table and auto-refreshed
- Personal accounts cannot invite members (enterprise feature)
- Document content is separated into `DocumentContent` table to avoid loading large text unnecessarily

## Content Management
- Marketing content sourced from **Sanity CMS** (blogs, lawyer profiles, legal documents)
- Adapters in `src/lib/data/` for fetching and transforming CMS data
- Some legacy Contentful integration exists but Sanity is primary

## Key Database Models

### Core Models
- `User` - user accounts
- `Organization` - tenant/workspace
- `UserOrganization` - many-to-many org membership
- `Project` - legal projects/matters
- `ProjectMember` - project team membership
- `Document` - files uploaded to platform
- `Conversation` - AI chat sessions
- `Message` - individual chat messages

### AI & Collaboration
- `AIAssociate` - custom AI assistants
- `KnowledgeBase` - project-specific AI instructions
- `SharedWorkspace` - external sharing of conversations
- `CanvasDocument` - collaborative document editor

### Organization Management
- `Invitation` - pending invites to projects/orgs
- `Subscription` - billing/payment tracking (Paystack)
- `OnboardingAnalytics` - onboarding step tracking

### Content (CMS-like features)
- `Content` - lawyer/firm marketing content
- `ContentSection` - structured content sections

## API Route Patterns

### Standard CRUD Pattern
```typescript
// GET /api/resource - List
export async function GET(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return ApiResponse.error('Unauthorized', 401);

  const resources = await prisma.resource.findMany({
    where: { organizationId: auth.organizationId }
  });

  return ApiResponse.success(resources);
}

// POST /api/resource - Create
export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return ApiResponse.error('Unauthorized', 401);

  const body = await req.json();
  const resource = await prisma.resource.create({
    data: { ...body, organizationId: auth.organizationId }
  });

  return ApiResponse.success(resource, 201);
}
```

### Dynamic Route Pattern
```typescript
// app/api/resource/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return ApiResponse.error('Unauthorized', 401);

  const resource = await prisma.resource.findFirst({
    where: {
      id: params.id,
      organizationId: auth.organizationId
    }
  });

  if (!resource) return ApiResponse.error('Not found', 404);
  return ApiResponse.success(resource);
}
```

## Testing Considerations
- No formal test suite currently exists
- Manual testing via development server
- Use Prisma Studio to inspect database state
- Check API endpoints with tools like Postman or curl
