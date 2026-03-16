<div align="center">

# Velamini

**Your AI-powered digital twin — for individuals and organizations.**

Velamini lets users build a personalized AI replica of themselves that learns from their knowledge, communicates in their voice, and can be shared with the world. Organizations can deploy a branded AI agent via an embeddable chat widget — no coding required.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Local Setup](#local-setup)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Project Structure](#project-structure)
8. [Development Workflow](#development-workflow)
9. [Code Conventions](#code-conventions)
10. [Key Concepts](#key-concepts)
11. [Branching Strategy](#branching-strategy)
12. [Submitting a Pull Request](#submitting-a-pull-request)

---

## Features

- **Personal Digital Twin** — Train an AI on your knowledge, personality, and experience. Share a public link so anyone can talk to your virtual self.
- **Persistent Chat History** — ChatGPT-style session management: resume past conversations, start new ones, and delete old ones.
- **Organization AI Agents** — Deploy a branded AI agent for your business. Manage it from a team dashboard with analytics, billing, and custom training data.
- **Embeddable Widget** — Drop a single ``<script>`` tag into any website to add your AI agent. No framework required.
- **WhatsApp Integration** — Connect your organization agent to a Twilio WhatsApp number for real customer conversations.
- **Quota & Billing** — Per-organization monthly message limits with Flutterwave payment integration and a built-in grace period.
- **Admin Panel** — Platform-wide user management, content moderation, and system settings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + scoped CSS custom properties |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| Database | PostgreSQL · Prisma 7 · `@prisma/adapter-pg` |
| AI | DeepSeek Chat Completions API |
| Messaging | Twilio WhatsApp API |
| Payments | Flutterwave |
| Animation | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |

---

## Prerequisites

Ensure the following are installed before you begin:

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x |
| Git | 2.x |

---

## Local Setup

> **Contributors:** Please fork the repository before cloning so you can open a pull request from your own copy.

```bash
# 1. Clone the repository (replace with your fork URL if contributing)
git clone https://github.com/your-org/velamini.git
cd velamini/velamini-front

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your values
cp .env.example .env.local

# 4. Apply database migrations
npx prisma migrate dev

# 5. Generate the Prisma client
npx prisma generate

# 6. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Environment Variables

Copy `.env.example` to `.env.local` and provide the values below. Variables marked *optional* are only needed for specific features.

```env
# -- Database ------------------------------------------------------------------
DATABASE_URL="postgresql://user:password@localhost:5432/velamini"

# -- Authentication (NextAuth v5) ----------------------------------------------
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""   # generate: openssl rand -base64 32

# -- Google OAuth (optional -- enables Google sign-in) -------------------------
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# -- AI ------------------------------------------------------------------------
DEEPSEEK_API_KEY=""

# -- WhatsApp / Twilio (optional -- org WhatsApp features) ---------------------
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER="whatsapp:+14155238886"

# -- Search (optional -- web-search tool in personal chat) ---------------------
TAVILY_API_KEY=""

# -- Payments / Flutterwave (optional -- billing flows) ------------------------
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_PUBLIC_KEY=""

# -- App -----------------------------------------------------------------------
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Security:** Never commit `.env.local`. It is already listed in `.gitignore`.

---

## Database Setup

Velamini uses **PostgreSQL** managed through **Prisma ORM**. The schema lives at [`prisma/schema.prisma`](prisma/schema.prisma) and all migrations are committed to the repository.

```bash
# Apply all pending migrations (first-time setup or after pulling new migrations)
npx prisma migrate dev

# Browse your data visually
npx prisma studio

# Reset the database -- drops all data (development only)
npx prisma migrate reset
```

Whenever you change the schema, always create a named migration:

```bash
npx prisma migrate dev --name describe_your_change
```

> Migration files must be committed alongside any schema change. Never use `db push` on a shared environment.

---

## Project Structure

```
velamini-front/
├── prisma/
│   ├── schema.prisma           # Data model
│   └── migrations/             # Migration history (committed)
│
├── public/
│   └── embed/
│       └── agent.js            # Drop-in embeddable chat widget (vanilla JS)
│
└── src/
    ├── app/                    # Next.js App Router -- pages and API routes
    │   ├── api/
    │   │   ├── agent/          # Public agent endpoints (embed widget)
    │   │   ├── chat/           # Personal & shared virtual-self chat
    │   │   ├── organizations/  # Org CRUD, analytics, training
    │   │   ├── billing/        # Flutterwave payment & invoice routes
    │   │   └── admin/          # Admin-only platform management
    │   ├── Dashboard/          # Authenticated personal dashboard
    │   ├── admin/              # Admin panel pages
    │   └── chat/               # Public shared virtual-self chat
    │
    ├── components/
    │   ├── admin/              # Admin UI components
    │   ├── chat-ui/            # Reusable chat primitives
    │   ├── dashboard/          # Personal dashboard views
    │   └── organization/       # Org dashboard (overview, analytics, billing)
    │
    ├── lib/
    │   ├── prisma.ts           # Singleton Prisma client
    │   ├── ai-config.ts        # DeepSeek system prompts
    │   ├── quota.ts            # Org message quota helpers
    │   ├── rateLimiter.ts      # In-memory rate limiting
    │   ├── logger.ts           # Server-side structured logger
    │   ├── agentAuth.ts        # API key validation for agent endpoints
    │   └── rag/                # Retrieval-Augmented Generation helpers
    │
    ├── types/
    │   ├── next-auth.d.ts      # NextAuth session type extensions
    │   └── organization/       # Shared org TypeScript interfaces
    │
    ├── auth.ts                 # NextAuth configuration
    └── middleware.ts           # Route protection middleware
```

---

## Development Workflow

```bash
# Start the dev server with hot reload
npm run dev

# Type-check the entire project without emitting files
npx tsc --noEmit

# Lint all source files
npm run lint

# Production build (also runs prisma generate)
npm run build
```

**Prisma quick-reference:**

```bash
npx prisma studio          # Visual database browser at localhost:5555
npx prisma db push         # Prototype schema changes without a migration (dev only)
npx prisma migrate deploy  # Apply migrations in production / CI
```

---

## Code Conventions

### TypeScript

- Avoid `any`. Use proper interfaces or let Prisma infer types from the schema.
- Do not commit `console.log`. Use `logger.ts` (server) or `client-logger.ts` (browser) instead.

### React & Next.js

- Add `"use client"` only when truly needed — interactivity, browser APIs, or React hooks.
- Prefer server components and server-side data fetching for initial page loads.
- Never expose secrets through client components or `NEXT_PUBLIC_` variables.

### Styling

- All colours must use the CSS custom property system (`--c-bg`, `--c-surface`, `--c-accent`, `--c-muted`, etc.). Do not hard-code hex values.
- Prefix component-scoped class names with a short unique identifier (e.g. `.dc-` for Dashboard Chat, `.ov-` for Org Overview).

### API Routes

- One concern per route file. Keep route handlers focused and thin.
- Validate all user input at the API boundary before touching the database.
- Never perform unfiltered `count()` queries in user-facing routes — always scope with a `where` clause.
- When counting messages for display, filter by `role: "user"` to exclude AI responses.
- Always verify record ownership (`userId` or `ownerId`) before reading or mutating any resource.

---

## Key Concepts

### Account Types

| Type | Description |
|---|---|
| **Personal** | Individuals who create a virtual self (digital twin) and optionally share a public chat link. |
| **Organization** | Businesses that deploy a branded AI agent, manage a team, and track usage analytics. |

### Quota System

Each organization has `monthlyMessageCount` and `monthlyMessageLimit` fields in the `Organization` table. The helper `checkQuota()` in `src/lib/quota.ts` must be called before every AI inference in org-facing routes. When the limit is reached, a 3-day grace period kicks in via `tokensExhaustedAt` before the agent stops responding.

### Agent Authentication

The embeddable widget and third-party integrations authenticate via a hashed API key — not a session cookie. Always use `authenticateAgent(req)` from `src/lib/agentAuth.ts`. Never re-implement key validation inline.

### Admin Routes

All `/api/admin/*` handlers require `session.user.isAdminAuth === true`. Admin authentication is checked separately from regular user authentication and must be explicitly verified in every admin route handler.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Vercel on merge |
| `dev` | Integration — merge all feature branches here before `main` |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Tooling, dependencies, refactors |

```bash
# Always branch off dev, not main
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

---

## Submitting a Pull Request

1. **One change per PR.** Keep the diff focused and reviewable.
2. **Target `dev`**, not `main` — unless it is an urgent production hotfix.
3. **Write a clear description** covering what changed, why, and how it was tested.
4. **Verify the build passes** before opening the PR:
   ```bash
   npm run lint && npx tsc --noEmit && npm run build
   ```
5. **Never include** secrets, `.env` files, or generated artifacts (e.g. `prisma/generated/`) in the diff.
6. **Include migration files** whenever the Prisma schema changes.

**PR title format:** `type: short description`

| Type | When to use |
|---|---|
| `feat` | New user-facing functionality |
| `fix` | Bug fixes |
| `chore` | Build, tooling, dependency updates |
| `docs` | Documentation only |
| `refactor` | Internal restructuring with no behaviour change |

> Example titles: `feat: add org monthly token reset cron` · `fix: prevent AI reply leaking into chat history`
