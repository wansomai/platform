# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wansom AI is a legal tech  AI powered platform built with Next.js 16 that provides AI-powered legal workspace features including document management, AI-assisted legal drafting, contract review, and team collaboration tools for law firms.

## Development Commands

```bash
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build (runs prisma generate then next build)
npm run start         # Start production server
npm run lint          # ESLint
npx prisma generate   # Generate Prisma client (required after schema changes)
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio     # Database GUI
```

**Note**: No test suite is currently configured in this project.

**Package manager**: npm (not yarn or pnpm)

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16.x (App Router with Turbopack)
- **Database**: PostgreSQL via Prisma ORM (v7.x)
- **Authentication**: NextAuth.js v4 with JWT (credentials + Google OAuth)
- **State Management**: Zustand stores (`src/store/*.store.ts`)
- **UI Components**: Radix UI + shadcn/ui + TailwindCSS
- **AI Integration**: Google Gemini API via `@google/genai` (multimodal - text and vision)
- **File Storage**: Vercel Blob Storage
- **Rich Text Editors**: Lexical (primary), TipTap, Quill, TinyMCE
- **Form Handling**: React Hook Form + Zod validation

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
  - **Access token**: Custom JWT (7-day expiry, auto-refreshed)
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
- Tool definitions in `src/lib/geminiTools.ts` (standard chat tools) and `src/lib/associateTools.ts` (AI Associate-specific tools)
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
- Scanned PDFs/images that could not be text-extracted are stored with sentinel strings in `DocumentContent.content`:
  - `"[SCANNED_PDF_REQUIRES_PROCESSING]"` — scanned PDF, sent to Gemini vision API at chat time
  - `"[SCANNED_IMAGE_REQUIRES_PROCESSING]"` — image file, sent to Gemini vision API at chat time
- These sentinels are checked at message time; the raw file URL is fetched and passed as a Gemini inline data part
- Optional: Google Cloud Vision API for advanced OCR (requires `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT_ID`, and `GOOGLE_CLOUD_STORAGE_BUCKET`)

#### 6. Role-Based Access Control
- **Organization roles**: `owner` > `admin` > `member`
- **Project roles**: `owner` > `editor` > `member`
- Permission checks via `src/lib/auth/permissions.ts` (org/project) and `src/lib/auth/workspace-permissions.ts` (shared workspace)
- Admin-only routes (`/api/admin/*`) are gated by `src/lib/auth/admin.ts` and `src/lib/auth/admin-middleware.ts`, separate from the standard middleware
- Enterprise-only features: member invitations, team management

#### 7. RAG / Legal Knowledge System
- Admin-managed legal knowledge documents are stored in the `legal_knowledge` DB table and managed via `/api/admin/legal-knowledge/*`
- On upload, documents are chunked (`src/services/chunkingService.ts`), classified (`src/services/legalClassificationService.ts`), and embedded (`src/services/embeddingService.ts`) into the `Embedding` table for vector similarity search
- At query time, `src/services/ragService.ts` performs similarity search and builds context for AI responses via `src/services/legalKnowledgeService.ts`
- `src/services/legalDatabaseService.ts` provides jurisdiction-aware legal database lookups
- RAG tuning env vars: `RAG_DEFAULT_TOP_K` (default `5`), `RAG_MIN_SIMILARITY_SCORE` (default `0.7`)

#### 8. Legal Digest System
- `src/services/legalDigestService.ts` generates periodic legal digest emails for subscribed users
- Cron trigger at `/api/cron/legal-digest`; user subscriptions managed at `/api/digest/subscription`

## Important Implementation Details

### Prisma Client Location (Critical)
The Prisma client is generated to a custom location (`src/prisma/client`). Always import as:
```typescript
// For the PrismaClient class itself (rare, usually only in prisma.ts)
import { PrismaClient } from '@/prisma/client';
// NOT from '@prisma/client'

// For database operations, use the singleton instance:
import prisma from '@/lib/prisma';
```

### API Response Pattern
Use functions from `src/lib/api/response.ts`:
```typescript
import { createApiResponse, createErrorResponse, createNotFoundResponse, createBadRequestResponse, createPaginatedResponse, calculatePagination } from '@/lib/api/response';
import { AppError } from '@/types/error';

// Success
return createApiResponse(data, 'Success message', 200);

// Paginated response
const pagination = calculatePagination(total, page, limit);
return createPaginatedResponse(items, pagination);

// Error (multiple options)
return createErrorResponse('Error message', 500);
return createErrorResponse(new AppError('Message', 'ERROR_CODE', 401));

// Shorthand helpers
return createNotFoundResponse('User');           // 404: "User not found"
return createBadRequestResponse('Invalid input'); // 400
return createForbiddenResponse('Access denied');  // 403
return createUnauthorizedResponse();              // 401
return createCreatedResponse(data);               // 201
```

### Authentication in API Routes
```typescript
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req); // Note: async function
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
Use middleware from `src/lib/api/middleware.ts` for cleaner route handlers:
```typescript
import { withAuth, withErrorHandler, withProjectAccess, withOrganizationAccess, OrganizationPermission } from '@/lib/api/middleware';

// Basic auth
export const GET = withErrorHandler(
  withAuth(async (request, userId) => {
    return createApiResponse(data);
  })
);

// Project-scoped (auto-extracts projectId from route params)
export const GET = withErrorHandler(
  withProjectAccess(async (request, { userId, projectId }, params) => {
    return createApiResponse(data);
  })
);

// Organization-scoped with permission check
export const GET = withErrorHandler(
  withOrganizationAccess(OrganizationPermission.VIEW_MEMBERS, async (request, { userId, organizationId }) => {
    return createApiResponse(data);
  })
);
```

### Streaming AI Responses
The messages route (`src/app/api/projects/[id]/conversations/[conversationId]/messages/route.ts`) returns a `ReadableStream` of newline-delimited JSON (NDJSON). Each line is a complete JSON object:

```typescript
// Stream chunk types emitted by the messages endpoint
{ type: 'status', status: 'started', statusMessage: string, conversationId: string, content: '' }
{ type: 'text', content: string }          // incremental text chunk
{ type: 'function_call', name: string, args: object }
{ type: 'function_result', name: string, result: object }
{ type: 'complete', content: string, messageId: string }
{ type: 'error', error: string }
```

- Streaming routes must export `export const maxDuration = 60;` (Vercel function timeout)
- The `withAuth`/`withProjectAccess` middleware wrappers cannot be used for streaming routes — use manual `getUserIdFromRequest()` auth instead
- User message is created in DB **only after** validation passes (Phase 1 checks access, subscription, conversation existence; Phase 2 creates the message and opens the stream)

### Gemini Conversation History Format
Gemini requires a specific format for `history` — note the differences from standard AI conventions:
- Role must be `'model'` (not `'assistant'`) for AI turns
- History **must start with a `'user'` message** — leading `'model'` messages are stripped
- Consecutive messages with the same role are deduplicated (keep last)
- System-role messages are filtered out entirely (Gemini has a separate `systemInstruction` field)

### Jurisdiction System
Legal jurisdiction is stored in workspace settings (`KnowledgeBase.settings` JSON). Resolution priority:
1. `settings.jurisdiction` (explicit user selection)
2. `settings.jurisdictions[0]` (first in list, legacy)
3. Auto-detected from Vercel's `x-vercel-ip-country` request header

Jurisdiction registry and instructions are in `src/lib/jurisdictions.ts`. Each jurisdiction has `id`, `legalSystem`, `citationStyle`, `courtSystem`, and `languages`. The full jurisdiction object is looked up via `getJurisdictionById()` when an `id` is present, providing richer instructions via `getJurisdictionInstructions()`.

### No Next.js Edge Middleware
This project does NOT use Next.js Edge middleware (`middleware.ts`). All authentication and authorization is handled via API route middleware (`withAuth`, `withProjectAccess`, etc.) in `src/lib/api/middleware.ts`.

### Database Connection
Uses `@prisma/adapter-pg` with a PostgreSQL connection pool (`pg` Pool). Both the Prisma client and pg Pool use a global singleton pattern to persist connections in development.

### Path Alias
All imports use `@/*` which maps to `./src/*`:
```typescript
import { Something } from '@/components/ui/something';
import prisma from '@/lib/prisma';
```

### Route Groups
- `(account)` - Authenticated user pages: dashboard, projects, vault; **`/workflows/*` is the UI for managing AI Associates** (create, edit, delete `AIAssociate` entities — the name "workflows" is legacy); project workspace UI is at `(account)/projects/[id]`
- `(auth)` - Login, register, password reset
- `(landingpages)` - Public marketing pages
- `(admin)` - Admin-only pages
- `/legal-documents/[slug]` - Public legal document pages (outside route groups): renders `GuestCanvasChatSplitView` for unauthenticated document drafting, sourced from Sanity CMS

### Guest / Public Drafting Flow
Unauthenticated users can draft legal documents on the `/legal-documents/[slug]` page without an account. The flow:
1. Page loads Sanity CMS document data (type, title, description, jurisdiction)
2. `GuestCanvasChatSplitView` (`src/components/guest/`) auto-calls `/api/public/generate` on mount to stream an AI-drafted document
3. User can refine via `GuestChatPanel` which calls `/api/public/chat`
4. **Export is gated behind Paystack payment** — jurisdiction-specific pricing is hardcoded in `GuestCanvasChatSplitView` (NGN 2,500 / KES 350 / ZAR 45 / GHS 75 / USD 5 default); on payment success a DOCX export/email is triggered (note: `/api/public/export` route is not currently implemented as a file — check `GuestCanvasChatSplitView` for the current export mechanism)
- These `/api/public/*` routes are unauthenticated — do NOT add `getUserIdFromRequest()` or auth middleware
- Guest components do not use `apiService` (no Bearer token) — they use raw `fetch`

### Document Field Mapping
The `Document` model uses `@map` to customize database column names. In TypeScript, use the Prisma field name (left side), NOT the database column name:
```prisma
project_id             String?  @map("projectId")      // TypeScript: document.project_id
organization_id        String   @map("organizationId") // TypeScript: document.organization_id
file_url               String   @map("fileUrl")        // TypeScript: document.file_url
created_by             String   @map("createdBy")      // TypeScript: document.created_by
```
Similar pattern applies to `ProjectDocument` and `ConversationDocument` join tables.

### Client-Side API Service
Client components make API calls using `apiService` from `src/lib/api.ts` (axios-based). It automatically attaches the Bearer token, handles 401s by clearing the token cache, and retries transient errors (408, 429, 5xx):
```typescript
import { apiService } from '@/lib/api';

// GET/POST/PUT/DELETE
const response = await apiService.get('/api/projects');
const result = await apiService.post('/api/projects', { title: 'New Matter' });
```
Do **not** use raw `fetch` in client components—always use `apiService`.

### Custom Hooks
Reusable hooks in `src/hooks/`:
- `useAuth` - User session and authentication state
- `useNotifications` - Toast notifications (`notify.success()`, `notify.error()`, `notify.info()`)
- `useFileUpload` - File upload with progress tracking
- `useDocuments` / `useProjects` / `useAssociates` / `useProjectAssociates` - Data fetching wrappers

### Project Workspace View Modes
The project workspace page (`(account)/projects/[id]/page.tsx`) renders one of three views based on state:
- `DocumentPreviewSplitView` - When a document is selected for preview (`selectedPreviewDocument` in `ui.store`)
- `CanvasChatSplitView` - When canvas mode is active (`view=canvas` query param, or `canvasMode` setting). `legalDrafting` is a legacy alias for `canvasMode` in workspace settings; both map to the same behavior
- `ChatInterface` - Default AI chat view

### Environment Variables
See `.env.example` for the full list. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` - NextAuth configuration
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - Custom token handling
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) - Gemini API (only one required)
- `GEMINI_MODEL` - Gemini model to use (default: `gemini-3-flash-preview`)
- `GOOGLE_AUTH_CLIENT_ID` / `GOOGLE_AUTH_CLIENT_SECRET` - Google OAuth
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_PLAN_CODE` - Payments
- `GOOGLE_API_KEY` / `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - Legal citation verification (`verifyLegalCitation` tool). Without these the tool fails gracefully and the AI tells the user to verify manually.
- `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` - Sanity CMS
- `EMAIL_USER` / `EMAIL_PASSWORD` - Email sending (nodemailer via `src/lib/email-service.ts`)
- `EMAIL_HOST` / `EMAIL_PORT` - SMTP server (default: `smtp.gmail.com:587`)

Optional (for Google Cloud Vision OCR):
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket for temporary PDF processing

Optional (for RAG tuning):
- `RAG_DEFAULT_TOP_K` - Number of chunks to retrieve per query (default: `5`)
- `RAG_MIN_SIMILARITY_SCORE` - Minimum cosine similarity threshold (default: `0.7`)

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

### Legal Knowledge & RAG
- `legal_knowledge` - Admin-uploaded legal documents (statutes, precedents, etc.) with classification metadata
- `Embedding` - Vector embeddings (chunks) of documents and legal knowledge for similarity search

### Billing
- `Subscription` - Paystack integration
- `Payment` - Payment history

#### 9. Visibility & Permissions System
- `Project`, `Document`, and `Folder` each have a `visibility` field:
  - `Project.visibility`: `"restricted"` (default — only explicit members) | `"public"` (all org members)
  - `Document.visibility`: `"private"` (default — only creator) | `"restricted"` (explicit grants) | `"public"` (all org members)
  - `Folder.visibility`: `"restricted"` (default) | `"public"`
- Fine-grained access is granted via join tables: `DocumentPermission` (per-document user grants) and `FolderPermission` (per-folder user grants)
- Permission management endpoints: `GET/POST /api/documents/[id]/permissions` and `GET/POST /api/projects/[id]/permissions`
- The org owner always has implicit access regardless of visibility/permission settings

### Subscription Limits (`src/lib/subscription.ts`)
- **Free plan**: 2 projects, 8 messages/month
- **Pro/Enterprise plan**: Unlimited projects and messages
- AI Associates are a premium feature (Pro/Enterprise only)
- Enterprise accounts (`accountType: 'enterprise'`) automatically get Pro features

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

## API Route Structure
API routes follow Next.js App Router conventions in `src/app/api/`:
- `/api/auth/*` - Authentication (NextAuth, login, register, password reset, Google connection)
- `/api/projects/[id]/*` - Project-scoped operations (conversations, documents, members, associates, canvas, settings, instructions)
- `/api/organization/*` - Organization management (members, invitations, switching)
- `/api/documents/*` - Vault/organization-level document operations
- `/api/folders/*` - Folder hierarchy for documents
- `/api/associates/*` - AI associate CRUD
- `/api/workspace/[id]/*` - Shared workspace settings, member management, and visibility controls
- `/api/payments/*` - Payment processing
- `/api/subscription/*` - Subscription management
- `/api/profile/*` - User profile operations
- `/api/admin/*` - Admin-only: organization management + legal knowledge CRUD (`/api/admin/legal-knowledge/*`)
- `/api/digest/*` - Legal digest subscriptions
- `/api/cron/*` - Cron job endpoints (legal digest generation)
- `/api/events/*` - Event registrations (law school launch, opt-ins)
- `/api/public/*` - Unauthenticated guest document generation (`generate`, `chat`)
- `/api/search` - Pan-African legal search (authenticated; calls `searchAfricanLegalSources` from `src/lib/legalScraper.ts`)
- `/api/projects/[id]/reports/[reportId]/download` - Download project reports in HTML or PDF format
- `/api/prorequests` - Pro plan upgrade requests
- `/api/law360/*` - Law360 activation and email-check endpoints
- `/api/submissions/*` - Form submissions and demo requests

### Deployment Note
`src/vercel.json` lives inside `src/` (not the project root) — this is intentional for this project's Vercel configuration. It also contains permanent redirects from the legacy domain `wakili.chat` → `wansom.ai`.
