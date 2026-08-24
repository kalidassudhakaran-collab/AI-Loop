# LOOP — AI Customer-Feedback Intelligence Platform

Multi-tenant customer feedback intelligence platform built for the Zidio internship (Milestones M1–M3-A).

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (Auth.js) with credentials
- Zod for API validation
- Recharts for analytics
- Papaparse for CSV import
- Anthropic Claude API (`@anthropic-ai/sdk`) for classification

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

### M3-A — Claude classification

- Server-side Anthropic Claude classification (structured JSON + Zod)
- Single-item and controlled batch classify APIs
- Stores sentiment, score, themes, feature area, confidence
- ADMIN/ANALYST only; never runs on page load

### M3-B — Themes, trends & embedding infrastructure

- Deterministic canonical theme normalization + duplicate consolidation
- Theme trends (current vs previous period) on the dashboard
- Themes page with counts and embedding status
- Optional Ollama embedding provider (never fakes vectors)
- pgvector-ready Embedding model + semantic retrieval helper for M3-C

## Prerequisites

- Node.js 18+
- PostgreSQL (Docker Compose included, or Neon/Supabase)

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

Copy `.env.example` to `.env`:

```env
DATABASE_URL=postgresql://loop_user:loop_password@localhost:5432/loop
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=   # required for M3-A classification
ANTHROPIC_MODEL=     # optional — defaults to claude-sonnet-4-6
```

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

## Sample CSV

Use [`sample-feedback.csv`](sample-feedback.csv) to test bulk import (includes intentional invalid rows).

## Project structure

```
loop/
├── app/
│   ├── (auth)/login, signup
│   ├── (app)/dashboard, inbox, settings
│   └── api/
│       ├── feedback/          # list, create, status, import, simulate, classify
│       ├── dashboard/
│       └── members/
├── components/
│   ├── feedback/
│   └── dashboard/
├── lib/
│   ├── ai/                    # Claude client, prompts, theme normalize
│   ├── services/
│   │   └── ai/                # classification orchestration + DB save
│   └── validation/
├── prisma/
└── middleware.ts
```

## Security notes

- Every feedback query is scoped by `workspaceId` from the authenticated session
- The client never sends a trusted `workspaceId`
- CSV/simulate/classify inserts always use the session workspace
- Anthropic API key is server-only (`ANTHROPIC_API_KEY`, never `NEXT_PUBLIC_*`)
- API routes enforce roles server-side (403 on forbidden actions)
- Passwords are hashed with bcrypt (12 rounds)

## What's next (M3-C)

- Ask LOOP chat UI
- RAG grounded answers with evidence citations
- Voice-of-Customer reports (Week 4)
