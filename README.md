# LOOP — AI Customer-Feedback Intelligence Platform

Multi-tenant customer feedback intelligence platform built for the Zidio internship (Milestone M1).

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (Auth.js) with credentials
- Zod for API validation

## M1 features

- Sign up / log in / log out with persistent sessions
- Automatic workspace creation on signup (creator becomes ADMIN)
- Role-based access control: ADMIN, ANALYST, VIEWER
- Workspace-scoped data isolation on every query
- Basic feedback create + list
- Member management for admins
- Seed script with demo data

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon or Supabase free tier recommended)

## Local setup

1. **Install dependencies**

```bash
cd loop
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL=postgresql://user:password@host:5432/loop
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=   # optional for M1
```

Generate a secret:

```bash
openssl rand -base64 32
```

3. **Run migrations and seed**

```bash
npm run db:migrate
npm run db:seed
```

4. **Start the dev server**

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

## Project structure

```
loop/
├── app/
│   ├── (auth)/login, signup     # Public auth pages
│   ├── (app)/dashboard, inbox, settings  # Protected app
│   └── api/                     # Route handlers (business logic)
├── components/                  # UI components only
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   ├── session.ts               # Server-side session helpers
│   ├── permissions.ts           # RBAC role checks
│   ├── services/                # Database business logic
│   └── validation/              # Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts                # Protects /dashboard, /inbox, /settings
```

## Security notes

- Every feedback query is scoped by `workspaceId` from the authenticated session
- The client never sends a trusted `workspaceId`
- API routes enforce roles server-side (403 on forbidden actions)
- Passwords are hashed with bcrypt (12 rounds)
- API keys belong in `.env` only — never in client code or Git

## What's next (Week 2+)

- CSV bulk import, simulated channels
- Inbox filters, search, pagination
- Analytics dashboard with Recharts
- Claude AI classification, themes, Ask LOOP, VoC reports
