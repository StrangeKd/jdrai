# JDRAI

AI-powered tabletop RPG platform (D&D-style) with an AI Game Master, supporting solo and multiplayer sessions.

## Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Monorepo    | pnpm workspaces + Turborepo                   |
| Frontend    | React 18 + Vite + TanStack Router/Query       |
| UI          | Tailwind CSS v4 + ShadCN + React Hook Form    |
| Backend     | Express + TypeScript (tsx)                    |
| ORM         | Drizzle ORM + drizzle-zod                     |
| Auth        | Better Auth (httpOnly cookies)                |
| Database    | PostgreSQL 16 (Docker)                        |
| Testing     | Vitest + Supertest                            |

## Prerequisites

- **Node.js** 18+
- **pnpm** 10.29.3 — `npm install -g pnpm@10.29.3`
- **Docker** (for PostgreSQL)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker-compose -f docker/docker-compose.yml up -d

# 3. Configure environment
cp .env.example .env
# Fill in: BETTER_AUTH_SECRET (min 32 chars), LLM API keys

# 4. Push database schema + seed
pnpm db:push
pnpm db:seed
```

## Development

```bash
pnpm dev          # frontend (http://localhost:5173) + backend (http://localhost:3000)
pnpm dev:web      # frontend only
pnpm dev:api      # backend only
```

> The frontend proxies `/api/*` to the backend via Vite — this is required for Better Auth's same-origin httpOnly cookies to work correctly.

## Available Scripts

```bash
# Quality
pnpm lint           # ESLint check
pnpm lint:fix       # ESLint auto-fix
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm typecheck      # TypeScript check
pnpm test           # Vitest

# Build
pnpm build

# Database
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema to DB (dev only — skips migration files)
pnpm db:studio      # Open Drizzle Studio at http://local.drizzle.studio
pnpm db:seed        # Seed reference data (races, classes, adventure templates)
```

## Project Structure

```
jdrai/
├── apps/
│   ├── web/              # React + Vite frontend
│   │   └── src/
│   │       ├── components/   # UI + feature components
│   │       ├── routes/       # TanStack Router file-based routes
│   │       ├── hooks/
│   │       └── lib/
│   └── api/              # Express backend
│       └── src/
│           ├── modules/      # Feature modules (auth, users, …)
│           ├── routes/
│           ├── middleware/
│           ├── db/           # Drizzle schema + migrations
│           └── lib/
├── packages/
│   └── shared/           # Zod schemas + TypeScript types shared across apps
├── docker/
│   └── docker-compose.yml
└── docs/                 # PRD, architecture, UX wireframes, stories
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string                     |
| `BETTER_AUTH_SECRET` | Auth secret — **minimum 32 characters**          |
| `BETTER_AUTH_URL`    | Backend URL (used by Better Auth internally)     |
| `OPENAI_API_KEY`     | OpenAI API key (primary LLM provider)            |
| `ANTHROPIC_API_KEY`  | Anthropic API key (optional secondary provider)  |

## Notes

- **Zod versions**: the API (`@jdrai/api`) uses zod v4; the frontend (`@jdrai/web`) and `@jdrai/shared` currently use zod v3. Keep this in mind when writing shared schemas — a migration will be needed when Better Auth requires zod v4 transitively.
- **Architecture docs**: see `docs/architecture/README.md` for the modular architecture documentation index.
- **BMAD methodology**: see `CLAUDE.md` for AI-assisted development workflow details (agents, PRD, stories, etc.).
