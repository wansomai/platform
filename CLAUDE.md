# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wansom AI is a legal tech platform built with Next.js 16 that provides AI-powered legal workspace features including document management, AI-assisted legal drafting, contract review, and team collaboration tools for law firms.

## Development Commands

```bash
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build (includes prisma generate)
npm run lint          # ESLint
npx prisma generate   # Generate Prisma client (required after schema changes)
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio     # Database GUI
```

**Note**: No test suite is currently configured in this project.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js with JWT (credentials + Google OAuth)
- **State Management**: Zustand stores (`src/store/*.store.ts`)
- **UI Components**: Radix UI + shadcn/ui + TailwindCSS
- **AI Integration**: Google Gemini API via `@google/genai` (multimodal - text and vision)
- **File Storage**: Vercel Blob Storage
- **Rich Text Editors**: TipTap, Quill, TinyMCE

### Key Architectural Patterns

#### 1. Multi-Organization Multi-Tenancy
- Users belong to a primary `Organization` (auto-created on signup)
- Users can be invited to multiple organizations via `UserOrganization` join table
- Account types: `personal` (default), `enterprise`
- Users switch between organizations using `activeOrganizationId`
- **Project access**: Users access projects via direct `ProjectMember` membership OR by belonging to the project's organization

#### 2. Authentication Flow
- JWT-based authentication via NextAuth.js
- Dual token system:
  - **Session token**: NextAuth JWT (30-day expiry)
  - **Access token**: Custom JWT (1-hour expiry, auto-refreshed)
- User ID extracted from Bearer token in API routes via `getUserIdFromRequest()` in `src/lib/auth/authorization.ts`

#### 3. Project-Based Workspace Model
```
Organization
  └── Project (legal matter/case)
        ├── Conversation (AI chat sessions)
        │     └── Message (user/assistant)
        ├── Document (uploaded files via ConversationDocument or ProjectDocument)
        ├── KnowledgeBase (project-specific AI instructions)
        ├── CanvasDocument (collaborative rich-text editor)
        └── SharedWorkspace (external sharing with access control)
```

#### 4. AI Function Calling System
- Tool definitions in `src/lib/geminiTools.ts`
- Core document tools (always available): `generateDocumentInline`, `reviewDocument`, `searchProjectDocuments`
- Canvas tools (when canvas mode enabled): `draftNewDocument`, `editCanvasDocument`
- Integration tools: Google Calendar (`createCalendarEvent`, `searchCalendarEvents`, etc.), Gmail (`searchEmails`, `readEmail`, `draftEmail`)
- Execution handled by `src/lib/functionExecutor.ts` (core tools) and `src/lib/associateExecutor.ts` (associate-specific workflows)
- Services layer in `src/services/`:
  - `aiDocumentService.ts` - Document generation, review, and inline document creation
  - `googleCalendarService.ts` - Calendar event CRUD and availability checks
  - `gmailService.ts` - Email search, read, and draft operations

#### 5. Document Processing Pipeline
- Upload → Vercel Blob Storage
- Text extraction on upload:
  - PDFs: `pdf-parse` library
  - DOCX: `mammoth` library
  - Excel: `xlsx` library
  - CSV: `csv-parse` library
- Extracted text stored in `DocumentContent` table (separate from `Document` to avoid loading large text unnecessarily)
- Scanned PDFs/images: Sent directly to Gemini's vision API during chat (no separate OCR)
- Optional: Google Cloud Vision API for advanced OCR (requires `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT_ID`, and `GOOGLE_CLOUD_STORAGE_BUCKET`)

#### 6. Role-Based Access Control
- **Organization roles**: `owner` > `admin` > `member`
- **Project roles**: `owner` > `editor` > `member`
- Permission checks via `src/lib/auth/permissions.ts`
- Enterprise-only features: member invitations, team management

## Important Implementation Details

### Prisma Client Location (Critical)
The Prisma client is generated to a custom location. Always import as:
```typescript
import { PrismaClient } from '@/prisma/client';
// NOT from '@prisma/client'
```

### API Response Pattern
Use functions from `src/lib/api/response.ts`:
```typescript
import { createApiResponse, createErrorResponse } from '@/lib/api/response';
import { AppError } from '@/types/error';

// Success
return createApiResponse(data, 'Success message', 200);

// Error
return createErrorResponse('Error message', 500);
return createErrorResponse(new AppError('Message', 'ERROR_CODE', 401));
```

### Authentication in API Routes
```typescript
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return createErrorResponse(new AppError('Unauthorized', 'AUTH_REQUIRED', 401));
  }

  // For project-scoped operations
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return createErrorResponse(new AppError('Forbidden', 'ACCESS_DENIED', 403));
  }
  // ...
}
```

### Higher-Order API Middleware
```typescript
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

export const GET = withErrorHandler(
  withAuth(async (request, userId) => {
    // userId is already validated
    return createApiResponse(data);
  })
);
```

### Path Alias
All imports use `@/*` which maps to `./src/*`:
```typescript
import { Something } from '@/components/ui/something';
import { prisma } from '@/lib/prisma';
```

### Route Groups
- `(account)` - Authenticated user pages (dashboard, projects, vault)
- `(auth)` - Login, register, password reset
- `(landingpages)` - Public marketing pages
- `(admin)` - Admin-only pages

### Document Field Mapping
The `Document` model uses `@map` to customize database column names. In TypeScript, use the Prisma field name (left side), NOT the database column name:
```prisma
project_id             String?  @map("projectId")      // TypeScript: document.project_id
organization_id        String   @map("organizationId") // TypeScript: document.organization_id
file_url               String   @map("fileUrl")        // TypeScript: document.file_url
created_by             String   @map("createdBy")      // TypeScript: document.created_by
```
Similar pattern applies to `ProjectDocument` and `ConversationDocument` join tables.

### Environment Variables
Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL`
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Gemini API
- `GOOGLE_AUTH_CLIENT_ID` / `GOOGLE_AUTH_CLIENT_SECRET` - OAuth
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage

Optional (for Google Cloud Vision OCR):
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket for temporary PDF processing

## Key Database Models

### Core Entities
- `User` → `Organization` (primary org) + `UserOrganization` (multi-org membership)
- `Project` → `ProjectMember`, `Conversation`, `Document`, `KnowledgeBase`, `CanvasDocument`
- `Conversation` → `Message`, `ConversationDocument`, `ConversationAction`
- `Document` → `DocumentContent`, `Embedding` (vector search), `Folder` (hierarchy)

### AI System
- `AIAssociate` - Custom AI personas with practice areas (`PracticeArea` enum)
- `AssociateStep` - Workflow steps for structured execution
- `AssociateTool` - Available tools per associate
- `ProjectAssociate` - Many-to-many assignment to projects

### Sharing & Collaboration
- `SharedWorkspace` - External sharing of conversations
- `SharedWorkspaceAccess` - Access tracking
- `SharedMessage` / `SharedMessageReference` - Messages in shared context

### Billing
- `Subscription` - Paystack integration
- `Payment` - Payment history

## Content Management
- Primary: **Sanity CMS** for blogs, lawyer profiles, legal documents
- Legacy: Contentful integration exists
- Adapters in `src/lib/data/`

## Zustand Stores
State management uses Zustand stores in `src/store/`:
- `chat.store.ts` - Conversation and message state
- `project.store.ts` - Project management
- `documents.store.ts` - Document state (vault/organization-level)
- `workspace-documents.store.ts` - Project workspace documents
- `canvas.store.ts` - Canvas editor state
- `associates.store.ts` - AI associate management
- `folder.store.ts` - Folder hierarchy
- `ui.store.ts` - UI state (modals, sidebars)
- `profile.store.ts` - User profile state
- `workspace-instructions.store.ts` - Project knowledge base instructions
- `workspace-settings.store.ts` - Project workspace settings
- `content.store.ts` - Content management (SEO pages)
- `onboarding.store.ts` - User onboarding flow
