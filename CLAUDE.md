# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wansom AI is a legal tech AI-powered platform built with Next.js 16 that provides AI-powered legal workspace features including document management, AI-assisted legal drafting, contract review, and team collaboration tools for law firms.

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

**Build memory**: The build script sets `NODE_OPTIONS='--max-old-space-size=4096'` to prevent OOM failures on large builds.

**Turbopack external packages**: `next.config.ts` keeps Google AI SDKs, native modules (`sharp`, `canvas`, `tesseract.js`), and headless browser tools outside Turbopack bundling via `serverExternalPackages`. Add new native/AI deps there if you see "Invalid source map" or WASM errors.

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
- **Critical membership check**: A user's primary org is stored on `User.organizationId` (NOT in `UserOrganization`). Secondary org memberships live in `UserOrganization`. When checking if a user belongs to a given org, always check both: `user.organizationId === orgId` first, then fall back to `UserOrganization` lookup. Missing this causes false-403s for primary org members.

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
- Canvas tools (when canvas mode enabled): `draftNewDocument`, `editCanvasDocument`, `batchEditCanvasDocument`
- Integration tools: Google Calendar (`createCalendarEvent`, `searchCalendarEvents`, etc.), Gmail (`searchEmails`, `readEmail`, `draftEmail`)
- Execution handled by `src/lib/functionExecutor.ts` (core tools) and `src/lib/associateExecutor.ts` (associate-specific workflows)
- Services layer in `src/services/`:
  - `aiDocumentService.ts` - Document generation, review, and inline document creation
  - `googleCalendarService.ts` - Calendar event CRUD and availability checks
  - `gmailService.ts` - Email search, read, and draft operations
  - `kbSummaryService.ts` - Generates and caches AI-produced summaries and `rulesForThinking` for Associate KB documents; loaded at chat time via `loadKBDocumentsWithSummaries()`
  - `digestIngestService.ts` - Pre-ingests legal content from RSS feeds, LII scraper, and Tavily fallback into `DigestItem` table; runs via `/api/cron/digest-ingest`
- Associate executor (`src/lib/associateExecutor.ts`) runs a bounded agentic loop capped at `MAX_ITERATIONS = 5` — it invokes Gemini with the associate's tools until the model stops calling functions or the limit is reached
- Available tools registry: `src/lib/constants/associateToolDefaults.ts` contains `ASSOCIATE_AVAILABLE_TOOLS` (name → label map for all assignable tools) and `DEFAULT_TOOLS_BY_PRACTICE_AREA` (pre-selected tools per `PracticeArea` — no Gemini call required)
- Google OAuth client factory: `getGoogleOAuthClient(userId)` in `src/lib/googleOAuth.ts` retrieves stored NextAuth tokens from the `Account` table and returns an authenticated `googleapis` OAuth2 client; returns `null` if the user has no linked Google account

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
- **On-demand fallback** (`src/lib/documentContentFallback.ts`): if `DocumentContent` was never populated (e.g. a Vault DOCX added to a conversation), the messages route calls this to extract text on the fly before building the Gemini context
- **Scanned PDF threshold** (`src/lib/documentParser.ts`): if text extraction yields <100 chars or <10 meaningful words, the document is treated as scanned and the sentinel is stored
- Optional: Google Cloud Vision API for advanced OCR (requires `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT_ID`, and `GOOGLE_CLOUD_STORAGE_BUCKET`)

#### Document Export
- Canvas documents are exported to `.docx` using `html-docx-js` (HTML → Word conversion)
- Guest document exports trigger a Paystack payment then deliver the DOCX via email
- Project reports can be downloaded as HTML or PDF via `/api/projects/[id]/reports/[reportId]/download`

#### `.doc` / DOCX Import (three-path extraction)
`/api/projects/[id]/canvas/import-doc/route.ts` handles three cases in order:
1. **True `.docx`**: mammoth extraction
2. **`.doc` that is actually RTF** (Google Docs, LibreOffice export): custom RTF parser with CP1252 character mapping for bytes 0x80–0x9F (curly quotes, em-dash, etc.) and heading detection via `{\stylesheet}` block scanning
3. **Genuine Word 97-2003 binary `.doc`**: CFB binary parser fallback

#### 6. Role-Based Access Control
- **Organization roles**: `owner` > `admin` > `member`
- **Project roles**: `admin` > `member` > `viewer` (TypeScript: `ProjectMember.role` in `src/types/projects.ts`)
- Permission checks via `src/lib/auth/permissions.ts` (org/project) and `src/lib/auth/workspace-permissions.ts` (shared workspace)
- Admin-only routes (`/api/admin/*`) are gated by `src/lib/auth/admin.ts` and `src/lib/auth/admin-middleware.ts`, separate from the standard middleware
- Enterprise-only features: member invitations, team management

#### 7. RAG / Legal Knowledge System
- Admin-managed legal knowledge documents are stored in the `legal_knowledge` DB table and managed via `/api/admin/legal-knowledge/*`
- On upload, documents are chunked (`src/services/chunkingService.ts`), classified (`src/services/legalClassificationService.ts`), and embedded (`src/services/embeddingService.ts`) into the `Embedding` table for vector similarity search
- At query time, `src/services/ragService.ts` performs similarity search and builds context for AI responses via `src/services/legalKnowledgeService.ts`
- `src/services/legalDatabaseService.ts` provides jurisdiction-aware legal database lookups
- RAG tuning env vars: `RAG_DEFAULT_TOP_K` (default `5`), `RAG_MIN_SIMILARITY_SCORE` (default `0.7`)

#### 8. Legal Digest System ("Briefly")
- `src/services/legalDigestService.ts` generates periodic legal digest emails for subscribed users (product name: **Briefly**)
- Cron trigger at `/api/cron/legal-digest` (`maxDuration = 300`); user subscriptions managed at `/api/digest/subscription`
- **Three-stage pipeline**:
  1. **Ingest** (`/api/cron/digest-ingest`, every 2–4 hrs): RSS feeds → LII scraper → Tavily fallback fills `DigestItem` table (priority order per jurisdiction)
  2. **Synthesis** (`/api/cron/legal-digest`): reads from `DigestItem` instead of doing live searches; two-phase — Phase 1 resolves fingerprints (no Gemini calls), Phase 2 generates and sends emails
  3. **Cleanup** (`/api/cron/digest-cleanup`): purges stale `DigestItem` rows
- **Idempotency**: digest fingerprinting prevents re-sending identical content; test email addresses bypass this gate
- **Jurisdiction tiers** (`src/lib/briefly-jurisdictions.ts`): Tier 1 (primary markets: KE, ZA, NG, GH, etc.) ingested every 4 hours; Tier 2 (expanded Africa) subscriber-driven; unsupported jurisdictions fall back to live Gemini grounding
- Other cron endpoints: `/api/cron/trial-expiry`, `/api/cron/subscription-renewal`, `/api/cron/notification-cleanup` (daily 2am — purges `dismissed=true` records older than 30 days)
- **Dev testing**: `/api/dev/digest-preview` — preview digest output without sending emails (not for production)

#### 9. Database Transaction Pattern
Use `prisma.$transaction()` for multi-table writes (e.g., org upgrades, bulk visibility fixes, associate session creation). Place email-sending calls **outside** transactions so a failed send does not roll back DB changes.

#### 10. Vercel `maxDuration` by Route Type
Routes set `maxDuration` based on expected runtime — never rely on the default:
- **120s**: streaming messages route, associate create/update (`processKBDocuments` makes multiple Gemini calls per KB document and can take 30-60s), document upload (`/api/documents`)
- **300s**: cron jobs (`legal-digest`, `digest-ingest`, `dev/digest-preview`)
- **60s**: all other routes (search, canvas, document reprocess, project documents, etc.)

#### 11. `requiresUpgrade` Pattern for 403 Upgrade Gates
When an API route hits a plan limit, it returns HTTP 403 with `{ error: '...', requiresUpgrade: true }` in the body:
```typescript
return NextResponse.json({ error: reason, requiresUpgrade: true }, { status: 403 });
```
The `apiService` interceptor (`src/lib/api.ts`) detects this flag and:
- Attaches `error.requiresUpgrade = true` to the thrown error object
- Suppresses the automatic toast (lets the component handle it instead)

Components check for this signal to open the upgrade gate rather than show a generic error:
```typescript
} catch (err: any) {
  if (err?.status === 403 && err?.requiresUpgrade) {
    setShowAssociateGate(true); // or setShowProAccess(true)
  } else {
    notify.error(err?.message ?? 'Something went wrong');
  }
}
```
This pattern appears in `ChatInput`, `CreateProjectModal`, vault page, and all workflow pages. The `requiresUpgrade` flag is also surfaced on Zustand stores (`chat.store.ts`, `project.store.ts`) for components that read plan-limit state reactively.

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

### Two Validation Files — Don't Confuse Them
- `src/lib/api/validation.ts` — API request body validation (`validateRequest()`, pre-built schemas for common endpoints)
- `src/lib/validations.ts` — Zod schemas for law firm profile/onboarding flow (`practiceInfoSchema`, `practiceAreasSchema`, `locationSchema`, etc.). Used by React Hook Form in onboarding UI, not in API routes.

### Request Validation
Use `validateRequest()` from `src/lib/api/validation.ts` to validate request bodies against Zod schemas. Pre-built schemas cover common cases:
```typescript
import { validateRequest, schemas } from '@/lib/api/validation';

const body = await req.json();
const data = validateRequest(schemas.projectCreate, body); // throws AppError(400) on failure
```
Available schemas: `pagination`, `documentFilters`, `projectCreate`, `conversationCreate`, `messageCreate`.

### Organization Resolution in API Routes
Use helpers from `src/lib/api/org-helpers.ts` to resolve the correct organization context:
```typescript
import { getUserOrganizationId, getActiveOrganizationId, getUserWithOrganization } from '@/lib/api/org-helpers';

// Primary org (for user-owned resources)
const orgId = await getUserOrganizationId(userId);

// Active org (for multi-org context — respects org switching)
const orgId = await getActiveOrganizationId(userId); // falls back to primary if no active org set

// User + org details in one query
const user = await getUserWithOrganization(userId); // { id, organizationId, organization: { id, name, accountType, ownerId } }
```
Prefer `getActiveOrganizationId` over `getUserOrganizationId` when the operation should respect the user's current org context (e.g., creating projects, listing org members).

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

- Streaming routes must export `export const maxDuration = 120;` (Vercel function timeout — the messages route uses 120s, not 60s, because tool calls and KB loading can take >60s)
- The `withAuth`/`withProjectAccess` middleware wrappers cannot be used for streaming routes — use manual `getUserIdFromRequest()` auth instead
- User message is created in DB **only after** validation passes (Phase 1 checks access, subscription, conversation existence; Phase 2 creates the message and opens the stream)

#### Client-side streaming message pattern
`chat.store.ts` manages optimistic streaming via a `tempId` lifecycle:
1. A message is added immediately with a generated `tempId` and `isStreaming: true`
2. Each chunk updates it: `updateStreamingMessage(tempId, { content: accumulated })`
3. On `complete`, the temp message is replaced: `finalizeStreamingMessage(tempId, finalMessage)` — sets `isStreaming: false` and clears `tempId`

After finalization, `notifyResearchComplete()` fires a browser push notification **only when** `Notification.permission === 'granted'` AND `document.visibilityState !== 'visible'` AND the `wansom.notifyPromptSeen.v1` localStorage flag is `'1'`. Notifications are best-effort and never interrupt the chat flow. The function uses `ServiceWorkerRegistration.showNotification()` when an active SW is controlling the page (required on Android Chrome where `new Notification()` is blocked) and falls back to `new Notification()` on desktop. It guards against `navigator.serviceWorker.ready` hanging forever by checking `navigator.serviceWorker.controller` before awaiting.

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
- `(account)` - Authenticated user pages: dashboard, projects, vault; **`/workflows/*` is the UI for managing AI Associates** (create, edit, delete `AIAssociate` entities — the name "workflows" is legacy); project workspace UI is at `(account)/projects/[id]`. The `/workflows/[id]` detail page has unsaved-changes detection (compares live form state against the snapshot loaded from the server) and a discard dialog before navigation. It also has a "Use in Chat" button that creates a new project pre-linked to the associate and navigates directly into it.
- `(auth)` - Login, register, password reset, `/accept-invitation` (org invite acceptance), `/verify-email`
- `(landingpages)` - Public marketing pages; includes `/law360` (Briefly by Wansom product pages), `/pricing`, `/blogs`, `/events`, `/solutions`
- `(admin)` - Admin-only pages
- `/legal-documents/[slug]` - Public legal document pages (outside route groups): renders `GuestCanvasChatSplitView` for unauthenticated document drafting, sourced from Sanity CMS

### Template Route Dual Behavior
`/workflows/template/[slug]` renders two completely different UIs depending on the template type:
- **Regular templates** (no `isDigest` flag): renders an associate creation form that calls `createAssociate()` and then runs the KB document upload pipeline (`AssociateSetupProgressModal`)
- **Digest templates** (`template.isDigest === true`): renders `DigestSubscriptionForm` for configuring Briefly email subscriptions (frequency, topics, jurisdictions) — no associate is created; calls `/api/digest/subscription` directly

The branch is: `if ('isDigest' in template && template.isDigest) return <DigestSubscriptionForm template={template} />;`

### Upgrade Gate Modal Pattern
Two-modal upgrade flow used across dashboard, `/workflows`, `/workflows/new`, `/workflows/[id]`, and `/workflows/template/[slug]`:
1. **`AssociateGateModal`** (`src/components/modals/AssociateGateModal.tsx`) — soft gate: shows Free vs Explorer feature comparison with a trial CTA. Triggered on 403 responses from associate APIs or when free-tier limits are hit.
2. **`ProAccessModal`** (`src/components/modals/ProAccess.tsx`) — hard paywall: renders the Paystack payment form for Explorer/Pro upgrade.

Standard wiring pattern:
```tsx
const [showAssociateGate, setShowAssociateGate] = useState(false);
const [showProAccess, setShowProAccess] = useState(false);

// On 403 from API:
setShowAssociateGate(true);

<AssociateGateModal
  open={showAssociateGate}
  onClose={() => setShowAssociateGate(false)}
  onUpgrade={() => setShowProAccess(true)}
/>
<ProAccessModal open={showProAccess} onClose={() => setShowProAccess(false)} />
```

Components that need to trigger this flow from inside a dialog (e.g. `PrepareCaseModal` in `src/components/dashboard/`) use an `onUpgradeRequired` callback prop to bubble the 403 up to the page level where both modals are rendered.

### Email Verification Modal
`EmailVerificationModal` (`src/components/auth/EmailVerificationModal.tsx`) auto-mounts in the authenticated layout. Behavior:
- Checks once per browser session via `sessionStorage` key `wansom_email_verify_shown` — never shows twice in the same session
- Skips for Google OAuth users (`authProvider === 'google'`) and already-verified accounts
- Auto-sends the verification email on first open; handles 429 (`RESEND_TOO_SOON`) by parsing the remaining cooldown seconds from the error message and starting a countdown timer

### Guest / Public Drafting Flow
Unauthenticated users can draft legal documents on the `/legal-documents/[slug]` page without an account. The flow:
1. Page loads Sanity CMS document data (type, title, description, jurisdiction)
2. `GuestCanvasChatSplitView` (`src/components/guest/`) auto-calls `/api/public/generate` on mount to stream an AI-drafted document
3. User can refine via `GuestChatPanel` which calls `/api/public/chat`
4. **Export is gated behind Paystack payment** — jurisdiction-specific pricing is hardcoded in `GuestCanvasChatSplitView` (NGN 2,500 / KES 350 / ZAR 45 / GHS 75 / USD 5 default); on payment success a DOCX export/email is triggered (note: `/api/public/export` route is not currently implemented as a file — check `GuestCanvasChatSplitView` for the current export mechanism)
- These `/api/public/*` routes are unauthenticated — do NOT add `getUserIdFromRequest()` or auth middleware
- Guest components do not use `apiService` (no Bearer token) — they use raw `fetch`

### Document `content_extracted` Field
`Document.content_extracted` is a nullable JSON field with special semantics (not a plain boolean):
- `null` — old/unknown document; treat as extraction complete (no Vault spinner)
- `{ Bool: true, Valid: true }` — extraction complete
- `{ Bool: false, Valid: true }` + age < 2 min — background job in-progress (show processing spinner)
- `{ Bool: false, Valid: true }` + age ≥ 2 min — job timed out/failed; treat as complete

When creating a document, set `content_extracted: { Bool: true, Valid: true }` only if text extraction actually succeeded; use `Prisma.JsonNull` if extraction wasn't attempted.

### `/api/documents` Access Model
- **Root view** (no `folderId`): shows documents the user uploaded (`created_by = userId`) OR documents explicitly shared via a `DocumentPermission` row (e.g. KB documents cascade-shared via an AI associate).
- **Folder view** (`?folderId=<id>`): checks folder access first (owner, org-wide, or explicit `FolderPermission`). If accessible, all documents in the folder are returned without per-document filtering.
- `?titlesOnly=true` — fast path that skips joins/pagination and returns `{ id, title }` only (used for duplicate detection before upload).
- `?organizationId=<id>` — org override for cross-org KB document operations; membership is verified server-side before proceeding.

On **document upload (POST)**, a `409` response with `existingDocumentId` in the body means a document with that title already exists for this user. KB upload code in associate pages catches this and reuses the existing document ID rather than erroring.

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

The access token is cached client-side for 5 minutes to avoid session lookups on every request. On 401 the cache is cleared and the token is re-fetched. Transient errors (408, 429, 5xx) are retried automatically with exponential backoff.

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

After a successful Google OAuth callback, the page receives `?connection=success|error|cancelled` query params. It auto-enables the relevant setting (`googleCalendar` or `gmail`) via `updateSetting()`, dispatches `window.dispatchEvent(new CustomEvent('googleConnectionSuccess'))` so `ChatInput` can refresh its connection state, then removes the query params via `router.replace`.

### ChatInput Modes
`ChatInput` (`src/components/chat/ChatInput.tsx`) has two operating modes:
- **Normal mode** (default): sends messages within an existing project/conversation
- **Homepage mode** (`homepageMode={true}`): no `projectId` in params; on submit it creates a new workspace first (calls `/api/projects`) then navigates to it. An `onWorkspaceCreated` callback is also available. The `onDocumentsAdded` prop notifies the parent when files are attached.

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
- `EMAIL_USER` / `EMAIL_PASSWORD` - Email sending (nodemailer via `src/lib/email-service.ts`). The transporter uses a pooled singleton with `maxConnections: 2` and `maxMessages: 100` to stay within Outlook/Gmail SMTP limits — do not create additional transporters
- `EMAIL_HOST` / `EMAIL_PORT` - SMTP server (default: `smtp.gmail.com:587`)
- `PAYSTACK_TEAMS_PLAN_CODE` - Paystack plan code for enterprise/teams tier (separate from `PAYSTACK_PLAN_CODE`)
- `LAW360KENYA_PLAN_CODE` - Paystack plan code for Briefly KES pricing variant
- `NEXT_PUBLIC_CLARITY_PROJECT_ID` - Microsoft Clarity analytics project ID
- `ADMIN_EMAILS` - Comma-separated list of admin email addresses (checked by admin middleware)

Optional (for Google Cloud Vision OCR):
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - GCS bucket for temporary PDF processing

Optional (for Pan-African legal scraper):
- `LII_SCRAPER_URL` - URL of the Python scraper service on Digital Ocean (e.g. `http://<DROPLET_IP>`)
- `LII_SCRAPER_API_KEY` - API key matching `LII_API_KEY` set on the droplet

Optional (for RAG tuning):
- `RAG_DEFAULT_TOP_K` - Number of chunks to retrieve per query (default: `5`)
- `RAG_MIN_SIMILARITY_SCORE` - Minimum cosine similarity threshold (default: `0.7`)

## Key Database Models

### Core Entities
- `User` → `Organization` (primary org) + `UserOrganization` (multi-org membership)
- `Project` → `ProjectMember`, `Conversation`, `Document`, `KnowledgeBase`, `CanvasDocument`
- `Conversation` → `Message`, `ConversationDocument`, `ConversationAction` (AI-triggered action records with `actionType`, `status`, `resultUrl`), `ConversationMeta` (title/summary metadata)
- `Message` → `MessageReference` (citation links — stores quoted `text`, `page`, and the source `documentId` for each passage the AI referenced)
- `Document` → `DocumentContent`, `Embedding` (vector search), `Folder` (hierarchy)

### Supporting Entities
- `Invitation` - Org member invitations scoped to both `organizationId` and `projectId`; contains `token`, `role`, and `expiresAt`. Acceptance flow is at `/accept-invitation`
- `Event` / `EventRegistration` - Law school launch events and opt-in tracking
- `Content` / `ContentSection` - CMS content for SEO pages (managed via `content.store.ts`)
- `OnboardingAnalytics` - Onboarding funnel step tracking
- `Publications` - Law firm publication listings
- `AdminLog` - Audit log for admin actions

### Legal Digest (Briefly)
- `DigestSubscription` - User subscriptions to Briefly digest emails
- `DigestItem` - Pre-ingested legal content from RSS/scraper/Tavily (source of truth for synthesis)
- `DigestCache` - Cached digest output to avoid re-generation
- `DigestHistory` - Record of sent digests per user for idempotency

### AI System
- `AIAssociate` - Custom AI personas with practice areas (`PracticeArea` enum)
- `AssociateStep` - Workflow steps for structured execution
- `AssociateTool` - Available tools per associate
- `ProjectAssociate` - Many-to-many assignment to projects
- `AIAssociateShare` - User-level sharing of associates (join table: `associateId`, `userId`, `grantedById`)

#### Associate Access Model
Associates are **user-level**, not org-level. Access is granted to the creator and explicitly-shared org members regardless of active org. Sharing cascades document permissions:
- When an associate is shared, every KB document owned by the creator is promoted from `private` → `restricted` and a `DocumentPermission` row is added for each shared user
- When sharing is revoked, permissions are only removed if no other shared associate from the same owner still grants access to the same (doc, user) pair
- Cascade logic lives in `src/lib/auth/associateSharing.ts` (`syncAssociateShareCascade`, `syncAssociateKBDocumentPermissions`)
- Sharing API: `GET/PUT /api/associates/[id]/permissions`

#### Associate Deletion Flow
`DELETE /api/associates/[id]` returns `{ code: 'ASSOCIATE_IN_USE', details: { projectCount, conversationCount, projects } }` (HTTP 409) when the associate is bound to active projects. The caller must re-issue with `?force=true` to hard-delete and strip the association from those projects. The `/workflows` page surfaces a two-step confirmation dialog for this.

The `associates.store.ts` maintains an `associatesMap: Map<string, AIAssociate>` alongside the `associates` array for O(1) `getAssociateById()` lookups. `isFetching` tracks list-fetch state only; `isLoading` tracks mutation (create/update/toggle) state — never conflate the two.

#### Premade Associates
Template associates are defined in `src/lib/constants/premadeAssociates.ts`. `POST /api/associates/start-premade-session` finds-or-creates the associate for the user's org and creates a new project, returning a `projectId` for immediate navigation.

### Sharing & Collaboration
- `SharedWorkspace` - External sharing of conversations
- `SharedWorkspaceAccess` - Access tracking
- `SharedMessage` / `SharedMessageReference` - Messages in shared context

### Legal Knowledge & RAG
- `legal_knowledge` - Admin-uploaded legal documents (statutes, precedents, etc.) with classification metadata
- `legal_knowledge_chunks` - Chunked text of legal knowledge docs with native pgvector `embedding` column (type `vector`, stored as `Unsupported("vector")` in Prisma). Separate from the `Embedding` table — used exclusively for legal knowledge RAG, not user documents
- `Embedding` - Vector embeddings (chunks) of user documents for similarity search

### Billing
- `Subscription` - Paystack integration
- `Payment` - Payment history
- `Notification` - In-app user notifications (`type`, `read`, `dismissed`, `dismissedAt`, `title`, `message`); see Notification API below

### Visibility & Permissions System
- `Project`, `Document`, and `Folder` each have a `visibility` field:
  - `Project.visibility`: `"restricted"` (default — only explicit members) | `"public"` (all org members)
  - `Document.visibility`: `"private"` (default — only creator) | `"restricted"` (explicit grants) | `"public"` (all org members)
  - `Folder.visibility`: `"restricted"` (default) | `"public"`
- Fine-grained access is granted via join tables: `DocumentPermission` (per-document user grants) and `FolderPermission` (per-folder user grants)
- Permission management endpoints: `GET/POST /api/documents/[id]/permissions` and `GET/POST /api/projects/[id]/permissions`
- The org owner always has implicit access regardless of visibility/permission settings

### Subscription Limits (`src/lib/subscription.ts`)
- **Free plan**: 2 projects, 8 messages/month
- **Explorer plan**: 14-day full Pro access, identified by `subscription.planName === 'explorer'` with a valid `currentPeriodEnd`; takes priority over Free but not over Pro/Trial
- **Pro/Enterprise plan**: Unlimited projects and messages
- **Trial**: `Organization.trialExpiresAt` / `Organization.trialExpired` — active trial grants Pro access; cron job `/api/cron/trial-expiry` marks trials expired
- AI Associates are a premium feature (Explorer/Pro/Enterprise only)
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
- `legal-knowledge.store.ts` - Admin legal knowledge document management

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
- `/api/notifications` - `GET` active (unread, non-dismissed) notifications; `?history=true` returns read, non-dismissed ones; `PATCH /api/notifications/[id]/read` - mark read; `PATCH /api/notifications/[id]/dismiss` - marks dismissed+read (stays in DB for 30 days, then deleted by `/api/cron/notification-cleanup`)
- `/api/support` - Authenticated POST; sends support ticket email to `law@wansom.ai`
- `/api/user` - User account operations
- `/api/digest/*` - Legal digest subscriptions
- `/api/cron/*` - Cron job endpoints (legal digest generation)
- `/api/dev/*` - Dev-only endpoints (e.g. `/api/dev/digest-preview` for testing digest without sending)
- `/api/events/*` - Event registrations (law school launch, opt-ins)
- `/api/public/*` - Unauthenticated guest document generation (`generate`, `chat`)
- `/api/search` - Pan-African legal search (authenticated; calls `searchAfricanLegalSources` from `src/lib/legalScraper/index.ts` — a thin client that delegates scraping to a Python service on Digital Ocean)
- `/api/projects/[id]/reports/[reportId]/download` - Download project reports in HTML or PDF format
- `/api/prorequests` - Pro plan upgrade requests
- `/api/law360/*` - Law360 activation and email-check endpoints
- `/api/submissions/*` - Form submissions and demo requests

### Pricing & Currency
- **Guest export pricing** (`src/lib/exportPricing.ts`): PPP-adjusted per country (NGN/KES/ZAR/GHS/USD); falls back to `DEFAULT_EXPORT_PRICING`
- **Subscription pricing** (`src/lib/subscriptionPricing.ts`): localized per country; payment channels differ (mobile money for Kenya vs card-only elsewhere)

### Role Hierarchy Constants
`src/lib/constants/` provides type-safe role helpers:
- `RoleHierarchy` map for numeric comparison: `OWNER=3`, `ADMIN=2`, `MEMBER=1`
- `isValidOrganizationRole()` / `isValidWorkspaceRole()` type guards
- `OrganizationRolePermissions` record maps each role to its allowed permissions

### Admin Middleware
`/api/admin/*` routes use separate middleware (`src/lib/auth/admin-middleware.ts`) that checks the `ADMIN_EMAILS` env var list and returns 403 for all others — independent of the standard `withAuth`/`withOrganizationAccess` chain.

### Deployment Note
Both `vercel.json` (project root) and `src/vercel.json` exist and must be kept in sync. They carry the same crons/redirects but differ in function path format: the root file uses `src/app/api/...` (full paths from repo root), while `src/vercel.json` uses `app/api/...` (relative to `src/`). Both contain permanent redirects from the legacy domain `wakili.chat` → `wansom.ai`. The root file is the primary one; update both when adding new crons or function overrides.
