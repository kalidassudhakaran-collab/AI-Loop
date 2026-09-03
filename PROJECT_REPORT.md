# LOOP — AI Customer-Feedback Intelligence Platform  
## Project Report

| Field | Detail |
|--------|--------|
| **Intern ID** | CITS8123 |
| **Project** | LOOP — Customer Feedback Intelligence |
| **Live URL** | https://ai-loop-lime.vercel.app |
| **GitHub** | https://github.com/kalidassudhakaran-collab/AI-Loop |
| **Internship** | Zidio / CodTech — Milestones M1–M4 |

---

## 1. Overview

**LOOP** is a multi-tenant **Voice-of-Customer (VoC)** web application that helps product teams turn scattered customer feedback into clear, evidence-backed decisions.

Feedback arrives from support tickets, app-store reviews, surveys, sales notes, and CSV uploads. LOOP then:

- Classifies sentiment and themes with AI  
- Shows trends on an analytics dashboard  
- Answers natural-language questions with **Ask LOOP** (retrieval-augmented, citation-backed)  
- Generates leadership-ready **Voice-of-Customer reports** (shareable / printable PDF)  

**Headline:** *LOOP turns scattered customer feedback into a ranked, evidence-backed list of what to do next.*

### Problem

Product teams drown in unstructured feedback across channels. Manual tagging is slow, answers are often opinion-based, and leadership digests take hours to assemble.

### Solution

LOOP provides one workspace where:

1. Feedback is ingested and stored securely per organization  
2. AI assists classification and Q&A **without inventing quotes**  
3. Roles (Admin / Analyst / Viewer) control who can write vs only read  
4. Reports are generated from **pre-computed stats**, then narrated by AI  

### Roles (RBAC)

| Role | Capabilities |
|------|----------------|
| **ADMIN** | Full access: members, ingest, classify, embed, reports |
| **ANALYST** | Ingest, classify, embed, Ask LOOP, generate reports |
| **VIEWER** | Read-only: dashboard, inbox browse, saved reports |

Demo workspace: **Acme SaaS (Demo)** — 125 seeded feedback items and 8 themes.

| Role | Email | Password |
|------|--------|----------|
| Admin | admin@demo.loop | DemoAdmin123! |
| Analyst | analyst@demo.loop | DemoAnalyst123! |
| Viewer | viewer@demo.loop | DemoViewer123! |

---

## 2. Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Auth | NextAuth (Auth.js) — credentials + JWT sessions |
| API / validation | Next.js Route Handlers, Zod |
| Database | PostgreSQL (Neon in production), Prisma ORM |
| Vectors | pgvector (`vector(768)`) for semantic search |
| Charts | Recharts |
| CSV import | Papaparse |
| AI (text) | Anthropic Claude (preferred) / Google Gemini (free-tier fallback) |
| AI (embeddings) | Gemini `gemini-embedding-001` @ 768-d (or optional Ollama) |
| Hosting | Vercel (app) + Neon (database) |
| Local DB | Docker Compose (`pgvector/pgvector`) |

### Milestone coverage

- **M1** — Auth, workspaces, RBAC, basic feedback  
- **M2** — CSV / simulate import, filters, dashboard analytics  
- **M3** — Classification, themes/trends, Ask LOOP + embeddings  
- **M4** — VoC reports, share/print, production polish (loading / 404 / 403 / mobile)  

---

## 3. Architecture & Screenshots

### 3.1 High-level architecture

```
Browser (Next.js App Router UI)
    │  session cookie only — never a trusted workspaceId from the client
    ▼
Next.js Route Handlers  (auth + RBAC + Zod)
    ├── Prisma → PostgreSQL (+ pgvector)
    ├── Claude / Gemini API   (server-only; keys never NEXT_PUBLIC_*)
    └── Embeddings            (Gemini or Ollama → vector(768))
```

**Design principles**

- UI calls `/api/*` only; domain logic lives in `lib/services/*`  
- Every data query is filtered by `workspaceId` from the authenticated session  
- AI keys stay in server environment variables (Vercel / local `.env`, gitignored)  
- Ask LOOP never fabricates evidence: retrieve → select → answer with validated citations  
- VoC reports use pre-computed counts so the model cannot invent volume/sentiment numbers  

### 3.2 Ask LOOP flow (M3)

`Question → embed → retrieve similar feedback → select evidence → optional LLM answer with citations`

If the LLM is rate-limited, LOOP can still return an evidence-based summary from retrieved quotes.

### 3.3 Project structure (summary)

```
app/           → pages + API routes
components/    → UI (dashboard, inbox, ask, themes, reports)
lib/ai/        → Claude/Gemini clients, embeddings, prompts
lib/services/  → business logic (feedback, ask-loop, reports, themes)
prisma/        → schema, migrations, seed
middleware.ts  → lightweight pass-through (auth enforced in layouts/APIs)
```

### 3.4 Deployment

| Component | Service |
|-----------|---------|
| Application | Vercel — https://ai-loop-lime.vercel.app |
| Database | Neon Postgres + `vector` extension |
| Secrets | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, `EMBEDDING_PROVIDER` |

Health check: https://ai-loop-lime.vercel.app/api/health  

### 3.5 Screenshots

> **For the PDF you submit:** capture these from the live site while logged in as **Admin**, then paste them under each heading (or keep this Markdown on GitHub and attach a PDF with images).

**Figure 1 — Login**  
Page: `/login` — demo credentials and workspace entry.

**Figure 2 — Dashboard**  
Volume, sentiment mix, top themes, period trends.

**Figure 3 — Feedback inbox**  
Search/filters, status workflow, CSV / simulate panels (Admin/Analyst).

**Figure 4 — Themes & embeddings**  
Theme list + embedding infrastructure (Ready / Still to embed).

**Figure 5 — Ask LOOP**  
Natural-language question with retrieved evidence and answer.

**Figure 6 — Voice-of-Customer reports**  
Generate report + saved report list; share/print view.

**Figure 7 — Viewer RBAC**  
Same pages as Viewer showing read-only banners (cannot ingest / classify / generate).

---

## 4. Conclusion

LOOP delivers a complete M1–M4 internship product: secure multi-tenant feedback ops, analytics, grounded AI Q&A, and leadership reports — deployed live on Vercel with Neon.

The system prioritizes **trustworthy AI**: workspace isolation, role enforcement, no fake embeddings, and answers/reports grounded in stored feedback and pre-computed metrics.

### Outcomes

- End-to-end web product from auth to VoC PDF  
- Production deployment with seeded demo data  
- Clear separation of UI, API, services, and AI providers  
- Documented setup and demo path for graders  

### Future improvements

- Auto-embed on ingest (background jobs)  
- More channel integrations (Zendesk, Intercom, Slack)  
- Stronger free-tier rate-limit queues for embeddings  
- Optional Claude-only production path when billing is available  

---

## References / links

- **Live demo:** https://ai-loop-lime.vercel.app  
- **Source code:** https://github.com/kalidassudhakaran-collab/AI-Loop  
- **Setup guide:** repository `README.md`  

*Prepared for CodTech / Zidio internship submission — Intern ID CITS8123.*
