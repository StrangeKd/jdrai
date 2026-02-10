# JDRAI Project Context - Agent Customizations

**Version**: 1.0  
**Last Updated**: 2026-02-10  
**Purpose**: Critical project-specific rules for all BMAD agents working on JDRAI

---

## 🎯 Project Overview

**JDRAI** is a role-playing game (RPG) platform with an AI Game Master, supporting solo and multiplayer gameplay. The project is being rebuilt from scratch with a new tech stack.

**Current Phase**: Architecture + UX complete, implementing wireframes, awaiting user stories

---

## 📚 Documentation Architecture Rules

### CRITICAL Rule #1: Architecture Documentation

When architecture information is needed, agents MUST follow this sequence:

1. **ALWAYS** start by reading `docs/architecture/README.md` to identify relevant modules
2. Load ONLY the specific files needed from:
   - `data-models.md` — Database schemas, DTOs, shared types
   - `api.md` — REST endpoints, errors, response formats
   - `frontend.md` — React architecture, routing, client auth, UX
   - `backend.md` — API structure, LLM, auth service, middleware
   - `infrastructure.md` — Docker, security, dev workflow, monitoring
   - `testing-conventions.md` — Tests, code conventions
   - `checklist.md` — Phase validation (P1, P2, P3)
3. **NEVER** load all architecture files at once
4. If unsure which files to load or if >3 files seem needed, **ASK USER FOR CLARIFICATION**

**Why**: The architecture is modular (8 files) to optimize LLM context usage. Loading everything wastes tokens.

---

### CRITICAL Rule #2: UX Documentation

When UX information is needed, agents MUST follow this sequence:

1. **ALWAYS** start by reading `docs/ux/README.md` to identify relevant documents
2. Load ONLY the specific files needed from:
   - `ux-cartography.md` — Phase 1: flows, screens, components, narrative structure
   - `wireframes/README.md` — Phase 2 index: wireframe organization
   - Specific wireframe files:
     - `wireframes/E8-hub.md` — Main hub/menu screen
     - `wireframes/E10-session-de-jeu.md` — Game session interface
     - `wireframes/E1-onboarding.md` — Onboarding flow
     - `wireframes/E2-creation-personnage.md` — Character creation
     - (Other wireframes as needed)
3. **NEVER** load all UX files at once
4. If unsure which files to load or if >3 files seem needed, **ASK USER FOR CLARIFICATION**

**Why**: UX documentation is structured in phases (cartography → wireframes → mockups) to prevent context overload.

---

## 🎮 Game Dev Studio (GDS) Module Notes

**Status**: GDS module installed but partially relevant for JDRAI

### Relevant GDS Components

✅ **Keep & Use**:

- `game-designer` agent — Core RPG design expertise
- `narrative` workflow — Story-driven game design
- `brainstorm-game` workflow — Game-specific brainstorming
- `gdd` workflow — Game Design Document creation

❌ **Installed but NOT Relevant** (can ignore):

- `gametest-*` workflows — Unity/Unreal/Godot specific (we're web-based)
- `game-architect` agent — Game engine architecture (not using game engines)
- `game-dev`, `game-qa`, `game-scrum-master` agents — Engine-specific implementation

**Rationale**: JDRAI is a web-based RPG platform, NOT a video game with a game engine. We use BMM (Business + Methodology Module) for implementation, GDS for design/narrative only.

---

## 🌍 Language & Communication

- **Default Language**: French (fr-FR)
- **Code/Documentation**: English for technical artifacts when standard practice
- **User Communication**: French unless user requests otherwise

---

## 📖 Documentation Hierarchy

```
docs/
├── prd.md                      # Product Requirements (v1.3 - source of truth)
├── architecture/               # Modular architecture (v1.2)
│   ├── README.md              # 🚪 ENTRY POINT - read this first
│   ├── data-models.md
│   ├── api.md
│   ├── frontend.md
│   ├── backend.md
│   ├── infrastructure.md
│   ├── testing-conventions.md
│   └── checklist.md
└── ux/                        # User experience design
    ├── README.md              # 🚪 ENTRY POINT - read this first
    ├── ux-cartography.md      # Phase 1 - validated
    └── wireframes/            # Phase 2 - in progress
        ├── README.md          # Wireframe organization
        ├── E8-hub.md
        ├── E10-session-de-jeu.md
        └── ...
```

---

## 🔧 Tech Stack (To Be Implemented)

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Monorepo | pnpm workspaces / Turborepo               |
| Frontend | React + Vite + TanStack Router/Query      |
| UI       | Tailwind + ShadCN + React Hook Form + Zod |
| Backend  | Express + TypeScript                      |
| ORM      | Drizzle + drizzle-zod                     |
| Auth     | Better Auth (httpOnly cookies)            |
| Database | PostgreSQL (Docker)                       |
| LLM      | Multi-provider                            |

---

## ✅ Agent Compliance

All BMAD agents working on JDRAI MUST:

1. ✅ Read this file during activation/initialization
2. ✅ Follow the Architecture Documentation Rule (README.md first)
3. ✅ Follow the UX Documentation Rule (README.md first)
4. ✅ Communicate in French by default
5. ✅ Ask for clarification when unsure which docs to load
6. ✅ Use BMM workflows for implementation, GDS for design/narrative only

---

**Note**: This file is automatically loaded by agent activation. When in doubt, ASK rather than loading excessive documentation.
