# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Configuration

- **Language**: Respond in French (fr-FR) by default unless specified otherwise.
- **Context7 MCP**: Use **Context7** (resolve-library-id then query-docs) only when it is clearly useful, to limit context consumption:
  - **Strategic libraries**: when the task depends on a core or critical library (e.g. ORM, auth, LLM client) and up-to-date API/docs matter.
  - **Performance or optimization**: when the task explicitly involves performance, optimization, or non-trivial patterns where current best practices are needed.
  Do **not** invoke Context7 on every code write or for routine implementation; reserve it for these targeted cases.
- **Token Limit**: Keep responses concise; prioritize action over explanation.

## Project Overview

**JDRAI** is a tabletop RPG platform (D&D-style) with an AI game master, for solo or multiplayer play.

### Current Status

🔄 **Project under reconstruction** — The previous codebase (`jdrai-api/`, `jdrai-front/`) has been abandoned and removed from the project since commit `a81a97`. The project is starting over with a new tech stack.

- **Validated PRD**: `docs/prd.md` v1.4 (source of truth for features)
- **Validated architecture**: `docs/architecture/` v1.4 (8 modular files; see `docs/architecture/README.md`)
- **Validated UX**: `docs/ux/` (1 cartography file, 6 wireframe files; see `docs/ux/README.md`)
- **UX mockups**: `mockups/` (free inspiration; see UX cartography §1.2)
- **Current phase**: Discovery + Architecture + UX Phase 1 done; P1 wireframes done (UX Phase 2); epics and stories in progress (SM + PO)

### Using the Architecture Documentation

⚠️ **IMPORTANT**: Architecture documentation is modular to optimize context usage.

**Mandatory rule (when architecture is involved):**

1. **ALWAYS** start by reading `docs/architecture/README.md` to identify relevant files.
2. **NEVER** load all files at once — select ONLY the sections you need.
3. **If unsure** which files to load, ask the user for clarification.
4. **Open specific files** as needed:

- `data-models.md` — DB schemas, DTOs, shared types
- `api.md` — REST endpoints, errors, response formats
- `frontend.md` — React architecture, routing, auth client, UX
- `backend.md` — API structure, LLM, auth service, middleware
- `infrastructure.md` — Docker, security, dev workflow, monitoring
- `testing-conventions.md` — Tests, code conventions
- `checklist.md` — Phase validation (P1, P2, P3)

### Using the UX Documentation

⚠️ **IMPORTANT**: UX documentation is modular to optimize context usage.

**Mandatory rule (when UX is involved):**

1. **ALWAYS** start by reading `docs/ux/README.md` to identify relevant files.
2. **NEVER** load all wireframe files at once — select ONLY the screens you need.
3. **If unsure** which files to load, ask the user for clarification.
4. **Open specific files** as needed:

- `ux-cartography.md` — User flows, tree, component inventory, cross-cutting edge cases
- `wireframes/README.md` — Wireframe index + cross-cutting design decisions (mobile-first, milestones & events)
- `wireframes/E1-E2-auth.md` — Auth (login, register, forgot/reset pwd)
- `wireframes/E5-E6-E7-onboarding.md` — Onboarding (welcome, nickname, tutorial)
- `wireframes/E8-hub.md` — Hub (main post-auth screen)
- `wireframes/E9-lancement-aventure.md` — Adventure launch (config, templates, random)
- `wireframes/E10-session-de-jeu.md` — Game session (core product)
- `wireframes/E11-ecran-de-fin.md` — End screen (summary, milestones, rewards)

### New Stack (to implement)

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Monorepo | pnpm workspaces / Turborepo         |
| Frontend | React + Vite + TanStack Router/Query|
| UI      | Tailwind + ShadCN + React Hook Form + Zod |
| Backend  | Express + TypeScript                |
| ORM      | Drizzle + drizzle-zod               |
| Auth     | Better Auth (httpOnly cookies)      |
| DB       | PostgreSQL (Docker)                 |
| LLM      | Multi-provider                      |

### Target Structure

```
jdrai/
├── apps/
│   ├── web/          # React + Vite
│   └── api/          # Express
├── packages/
│   └── shared/       # Zod schemas, shared types
├── docs/             # BMAD documentation
└── mockups/         # UX/UI mockups
```

## BMAD Methodology

This project uses **BMAD v6.0** (Beta.8) for AI-assisted development.

### Installed Modules

- ✅ **CORE**: bmad-master, editorial tasks, party-mode
- ✅ **BMM** (Business + Methodology Module): Agile agents for implementation
- ✅ **GDS** (Game Dev Studio): Game design agents for RPG conception

### Available Agents

**BMM Agents** (implementation):

- `/bmad-agent-bmm-analyst` — Mary (Business Analyst)
- `/bmad-agent-bmm-architect` — Winston (Architect)
- `/bmad-agent-bmm-dev` — Amelia (Developer)
- `/bmad-agent-bmm-pm` — John (Product Manager)
- `/bmad-agent-bmm-sm` — Bob (Scrum Master)
- `/bmad-agent-bmm-qa` — Quinn (QA Engineer)
- `/bmad-agent-bmm-ux-designer` — Sally (UX Designer)
- `/bmad-agent-bmm-tech-writer` — Paige (Technical Writer)
- `/bmad-agent-bmm-quick-flow-solo-dev` — Barry (Quick Flow Solo Dev)

**GDS Agents** (game design) — _Relevant for JDRAI_:

- `/bmad-agent-gds-game-designer` — Samus Shepard (Game Designer)
- `/bmad-agent-gds-tech-writer` — Paige (Technical Writer)

**Core Agents**:

- `/bmad-agent-bmad-master` — BMad Master (Orchestrator)

**Note**: GDS agents for game engines (game-dev, game-qa, game-architect, etc.) are installed but NOT relevant for JDRAI (web platform). Use BMM for implementation.

### JDRAI Customizations

**Customization files**:

- `_bmad/_memory/project-context.md` — Project context + critical rules (auto-loaded by agents)
- `.cursor/rules/jdrai-bmm-agents.md` — BMM agent customizations (Cursor)
- `.cursor/rules/jdrai-gds-agents.md` — GDS agent customizations (Cursor)
- `.claude/jdrai-bmm-agents.md` — BMM agent customizations (Claude Code)
- `.claude/jdrai-gds-agents.md` — GDS agent customizations (Claude Code)

**Critical rules** (already included in customizations):

1. Architecture: Always read `docs/architecture/README.md` first (modular structure).
2. UX: Always read `docs/ux/README.md` first (modular structure).
3. Load ONLY the specific files needed (never load everything at once).
4. Ask for clarification if more than 3 files seem necessary.

**IDE support**:

- ✅ Cursor: Customizations in `.cursor/rules/`
- ✅ Claude Code: Customizations in `.claude/`

### Documentation

`docs/` — PRD, architecture, UX cartography, stories (`{epicNum}.{storyNum}.story.md`)

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
