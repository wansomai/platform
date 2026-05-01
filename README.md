# Wansom AI — Legal Workspace Platform

AI-powered legal workspace for law firms and solo practitioners. Built with Next.js 16 App Router.

## What it does

- **AI chat workspace** — Gemini-powered conversations scoped to client matters, with document context and tool calling
- **AI Associates** — Custom AI personas with practice areas, knowledge bases, and structured workflows
- **Document Vault** — Upload, extract, and semantically search legal documents (PDF, DOCX, Excel, CSV)
- **Canvas editor** — Rich-text collaborative document drafting with AI inline generation
- **Briefly** — Periodic AI-curated legal digest emails, jurisdiction-aware across Africa
- **RAG** — Admin-managed legal knowledge base with pgvector similarity search

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL + Prisma ORM v7 + pgvector |
| Auth | NextAuth.js v4 (credentials + Google OAuth) |
| AI | Google Gemini via `@google/genai` |
| Storage | Vercel Blob |
| Payments | Paystack (localized pricing per country) |
| State | Zustand |
| UI | Radix UI + shadcn/ui + Tailwind CSS |
| CMS | Sanity (blogs, legal documents) |
| Email | Nodemailer (SMTP) |

## Development

```bash
npm install
cp .env.example .env.local   # fill in required vars (see below)
npx prisma generate          # generate Prisma client to src/prisma/client
npx prisma migrate dev --name init
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run build          # prisma generate + next build (sets --max-old-space-size=4096)
npm run lint           # ESLint
npx prisma studio      # Database GUI
npx prisma migrate dev --name <name>   # create + apply a migration
```

One-off admin scripts in `scripts/` — run with `npx tsx scripts/<file>.ts` or `node scripts/<file>.mjs`.

> **Note:** No test suite is configured.

## Required environment variables

Copy `.env.example` to `.env.local`. The minimum set to run locally:

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=
JWT_REFRESH_SECRET=

# AI (Gemini)
WANSOM_API_KEY=        # main platform
BRIEFLY_API_KEY=       # Briefly digest pipeline (can be same key)

# File storage
BLOB_READ_WRITE_TOKEN= # Vercel Blob

# Email (SMTP)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Payments
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_PLAN_CODE=
PAYSTACK_TEAMS_PLAN_CODE=

# Google OAuth (for calendar/gmail integrations)
GOOGLE_AUTH_CLIENT_ID=
GOOGLE_AUTH_CLIENT_SECRET=

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Admin access
ADMIN_EMAILS=you@example.com
CRON_SECRET=
```

Optional: `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_STORAGE_BUCKET` for Cloud Vision OCR on scanned PDFs. `LII_SCRAPER_URL` + `LII_SCRAPER_API_KEY` for the Pan-African legal scraper on Digital Ocean.

## Project structure

```
src/
  app/
    (account)/        # authenticated app — dashboard, projects, vault, /workflows (AI Associates)
    (auth)/           # login, register, magic-link, password reset
    (landingpages)/   # public marketing pages + /pricing
    (admin)/          # admin dashboard, legal knowledge, email broadcast
    api/              # all API routes
  components/         # shared React components
  store/              # Zustand stores (*.store.ts)
  lib/                # utilities, auth helpers, API middleware, Gemini tools
  services/           # server-side services (RAG, digest, AI document ops)
  hooks/              # custom React hooks
  types/              # TypeScript types
  prisma/client/      # generated Prisma client (do not edit)
prisma/
  schema.prisma
```

> **Important:** The Prisma client is generated to `src/prisma/client`. Always import from `@/prisma/client` (or use the singleton at `@/lib/prisma`) — never from `@prisma/client`.

## Database

PostgreSQL with pgvector extension (required for RAG embeddings). The `Embedding` table and `legal_knowledge_chunks` table both use a native `vector` column.

```bash
# After pulling schema changes from git:
npx prisma migrate dev
npx prisma generate
```

`prisma.config.ts` auto-loads `.env` then `.env.local` before any Prisma CLI command, so `DATABASE_URL` from `.env.local` is picked up without extra flags.

## Deployment

Deployed on Vercel. Both `vercel.json` (root) and `src/vercel.json` must be kept in sync — they define cron schedules and function timeouts. The root file is primary.

Cron jobs (all require `Authorization: Bearer <CRON_SECRET>`):
- `/api/cron/digest-ingest` — ingest legal content every 2–4 hours
- `/api/cron/legal-digest` — synthesise and send Briefly emails
- `/api/cron/digest-cleanup` — purge stale digest items
- `/api/cron/trial-expiry` — mark expired trials
- `/api/cron/subscription-renewal` — handle Paystack renewals
- `/api/cron/notification-cleanup` — purge old dismissed notifications
- `/api/cron/onboarding-emails` — drip email sequence (every 30 min)
