# LOOP — AI Customer-Feedback Intelligence Platform

Multi-tenant Voice-of-Customer product for the Zidio internship (Milestones **M1–M4**).

LOOP turns scattered support tickets, app-store reviews, surveys, and sales notes into themes, sentiment, trends, grounded answers, and a leadership-ready digest.

Headline for the demo: **LOOP turns scattered customer feedback into a ranked, evidence-backed list of what to do next.**

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (Auth.js) with credentials
- Zod for API validation
- Recharts for analytics
- Papaparse for CSV import
- Anthropic Claude API (`@anthropic-ai/sdk`) for classification, Ask LOOP, and VoC reports
- Google Gemini free-tier fallback (`@google/generative-ai`) when Claude is unavailable
- Optional Gemini or Ollama embeddings + pgvector for semantic retrieval

## Features

### M1 — Foundation

- Sign up / log in / log out with persistent sessions
- Automatic workspace creation on signup (creator becomes ADMIN)
- Role-based access control: ADMIN, ANALYST, VIEWER
- Workspace-scoped data isolation on every query
- Basic feedback create + list
- Member management for admins

### M2 — Core application

- CSV bulk upload with per-row validation reports
- Simulated support-ticket channel import
- Server-side pagination, search, and filters (channel, sentiment, theme, status, date)
- Inline status workflow: NEW → REVIEWED → ACTIONED
- Analytics dashboard with Recharts (volume, sentiment, top themes)
- Expanded seed: 125 feedback items + 8 themes

### M3 — AI features

- Server-side Anthropic Claude classification (structured JSON + Zod)
- Classify on ingest (single item awaited; bulk queued) plus manual re-classify
- Canonical theme clustering, trends vs previous period, and inbox drill-down
- Grounded Ask LOOP: question → embed → retrieve → evidence → optional Claude answer
- Validated citations; never fabricates answers, embeddings, or evidence

### M4 — Voice-of-Customer reports & production polish

- One-click VoC report for a chosen period (7 / 30 / 90 days or custom)
- Pre-computed stats (volume, sentiment shift, top themes, verbatim quotes) then Claude narrative
- Saved reports, shareable page, and Print / Save as PDF
- Loading, empty, error, 404, and 403 states
- Responsive navigation and skip-to-content

## Architecture

```
Browser (App Router UI)
    │  session cookie only — never a trusted workspaceId
    ▼
Next.js route handlers  (auth + RBAC + Zod)
    ├── Prisma → PostgreSQL  (every query filtered by session workspaceId)
    ├── Claude API           (server-side; ANTHROPIC_API_KEY never NEXT_PUBLIC_*)
    └── Embeddings           (optional Ollama + pgvector for Ask LOOP)
```

Business logic lives in `lib/services/*`. UI components call `/api/*` and do not talk to Claude or the database.

## Prerequisites

- Node.js 18+
- PostgreSQL (Docker Compose included, or Neon/Supabase)
- Anthropic Claude or Google Gemini API key (Gemini free tier works for demos)

## Local setup

1. **Start Postgres (Docker)**

```bash
cd loop
docker compose up -d
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

Copy `.env.example` to `.env`. `.env` is gitignored so you can push without keys.

```env
DATABASE_URL=postgresql://loop_user:loop_password@localhost:5433/loop
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
# ADD API (free): https://aistudio.google.com/apikey
GEMINI_API_KEY=
# Optional paid Claude (preferred when set)
ANTHROPIC_API_KEY=
# Ask LOOP embeddings: gemini (free) or ollama (local)
EMBEDDING_PROVIDER=gemini
```

**AI providers:** Claude is used when `ANTHROPIC_API_KEY` is set; otherwise LOOP uses **Google Gemini free tier**. For Ask LOOP, set `EMBEDDING_PROVIDER=gemini` so the same Gemini key also builds embeddings.

4. **Migrate and seed**

```bash
npm run db:migrate
npm run db:seed
```

> If Postgres was stopped, start it first: `docker compose up -d`

5. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo credentials (after seed)

| Role    | Email              | Password          |
|---------|--------------------|-------------------|
| Admin   | admin@demo.loop    | DemoAdmin123!     |
| Analyst | analyst@demo.loop  | DemoAnalyst123!   |
| Viewer  | viewer@demo.loop   | DemoViewer123!    |

Workspace name: **Acme SaaS (Demo)** — 125 feedback items across five channels.

## Sample CSV

Use [`sample-feedback.csv`](sample-feedback.csv) to test bulk import (includes intentional invalid rows).

## Product tour (what graders should click)

1. **Log in** as Admin, then switch to Analyst and Viewer to confirm RBAC (Viewers cannot ingest, classify, or generate reports).
2. **Dashboard** — volume, sentiment, top themes, and period-over-period theme trends. Click a theme name to open the filtered inbox.
3. **Inbox** — add one item, CSV upload, simulate support tickets, search/filter, change status NEW → REVIEWED → ACTIONED.
4. **Themes** — counts and drill-down into inbox items.
5. **Ask LOOP** — e.g. “What are users saying about onboarding?” Answers cite retrieved feedback only.
6. **Reports** — generate a last-30-days Voice-of-Customer digest, reopen it later, open the shareable page, Print / Save as PDF.

## Project structure

```
loop/
├── app/
│   ├── (auth)/login, signup
│   ├── (app)/dashboard, inbox, ask, themes, reports, settings
│   ├── share/reports/[id]     # print-friendly shareable VoC page
│   └── api/
│       ├── feedback/          # list, create, status, import, simulate, classify
│       ├── dashboard/
│       ├── themes/
│       ├── ask/
│       ├── reports/           # VoC generation + fetch
│       └── members/
├── components/
├── lib/
│   ├── ai/                    # Claude client, prompts, embeddings
│   ├── services/              # domain logic (no UI)
│   └── validation/            # Zod schemas
├── prisma/
└── middleware.ts
```

## Security notes

- Every feedback, theme, and report query is scoped by `workspaceId` from the authenticated session
- The client never sends a trusted `workspaceId`
- CSV / simulate / classify / report inserts always use the session workspace
- Anthropic API key is server-only (`ANTHROPIC_API_KEY`, never `NEXT_PUBLIC_*`)
- API routes enforce roles server-side (403 on forbidden actions)
- Passwords are hashed with bcrypt (12 rounds)
- VoC reports use pre-computed stats so Claude cannot invent counts

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the **loop** directory (or repo root that contains `loop/`) in Vercel.
3. In Vercel project settings, ADD API and other secrets as env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, optional `ANTHROPIC_API_KEY`, `EMBEDDING_PROVIDER=gemini`). Do not put keys in the repo.
4. Point `DATABASE_URL` at hosted Postgres (Neon or Supabase). Enable the `vector` extension if you use Ask LOOP embeddings.
5. Run migrations against production: `npx prisma migrate deploy` (from `loop/`) then `npx prisma db seed`.
6. Confirm the three demo roles can log in on the public URL.

## Submission checklist

- [ ] GitHub repository link
- [ ] Live Vercel URL with seeded demo data
- [ ] This README (setup, architecture, credentials)
- [ ] 3–5 minute demo video walking through every feature above
- [ ] Cohort submission form + 1–2 minute self-feedback video
