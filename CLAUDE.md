# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Configuration

- **Language**: Respond in French (fr-FR) by default unless specified otherwise.
- **Always use Context7 MCP** for library/API docs, code generation, setup/config steps without explicit request.
- **Token Limit**: Keep responses concise; prioritize action over explanation.

## Project Overview

**JDRAI** est une plateforme de jeu de rôle (type D&D) avec un MJ IA, permettant de jouer en solo ou en multijoueur.

### Statut actuel

🔄 **Projet en reconstruction** — L'ancienne codebase (`jdrai-api/`, `jdrai-front/`) est abandonnée. Le projet repart de zéro avec une nouvelle stack technique.

- **PRD validé** : `docs/prd.md` v1.2 (source de vérité pour les fonctionnalités)
- **Architecture en cours de mise à jour** : `docs/architecture.md` v1.1 (en cours de mise à jour post-audit)
- **UX Cartography** : `docs/ux-cartography.md` v1.0 (Phase 1 — flows, écrans, composants)
- **Maquettes UX** : `mockups/` (inspiration libre, cf. UX cartography §1.2)
- **Phase actuelle** : Discovery + Architecture + UX Phase 1 terminées, en attente wireframes (UX Phase 2) et stories (PO)

### Nouvelle stack (à implémenter)

| Couche   | Technologie                               |
| -------- | ----------------------------------------- |
| Monorepo | pnpm workspaces / Turborepo               |
| Frontend | React + Vite + TanStack Router/Query      |
| UI       | Tailwind + ShadCN + React Hook Form + Zod |
| Backend  | Express + TypeScript                      |
| ORM      | Drizzle + drizzle-zod                     |
| Auth     | Better Auth (cookies httpOnly)            |
| BDD      | PostgreSQL (Docker)                       |
| LLM      | Multi-provider                            |

### Structure cible

```
jdrai/
├── apps/
│   ├── web/          # React + Vite
│   └── api/          # Express
├── packages/
│   └── shared/       # Schémas Zod, types partagés
├── docs/             # Documentation BMAD
└── mockups/          # Maquettes UX/UI
```

## BMAD Methodology

Ce projet utilise BMAD pour le développement assisté par IA.

**Agents disponibles** : dev, architect, pm, po, qa, analyst, ux-expert, sm, bmad-orchestrator, bmad-master

**Documentation** : `docs/` — PRD, architecture, UX cartography, stories (`{epicNum}.{storyNum}.story.md`)
