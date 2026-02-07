# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Configuration

- **Language**: Respond in French (fr-FR) by default unless specified otherwise.
- **Always use Context7 MCP** for library/API docs, code generation, setup/config steps without explicit request.
- **Token Limit**: Keep responses concise; prioritize action over explanation.

## Project Overview

**JDRAI** est une plateforme de jeu de rôle (type D&D) avec un MJ IA, permettant de jouer en solo ou en multijoueur.

### Statut actuel

🔄 **Projet en reconstruction** — L'ancienne codebase (`jdrai-api/`, `jdrai-front/`) est abandonnée, et est d'ailleurs supprimée du projet depuis le commit `a81a97`. Le projet repart de zéro avec une nouvelle stack technique.

- **PRD validé** : `docs/prd.md` v1.3 (source de vérité pour les fonctionnalités)
- **Architecture validée** : `docs/architecture/` v1.2 (8 fichiers modulaires, voir `docs/architecture/README.md`)
- **UX Cartography** : `docs/ux/ux-cartography.md` v1.0 (Phase 1 — flows, écrans, composants, structure narrative §2.6)
- **UX Wireframes** : `docs/ux/wireframes/` v0.2 (Phase 2 — modulaire, 1 fichier par écran, voir `wireframes/README.md`)
- **Maquettes UX** : `mockups/` (inspiration libre, cf. UX cartography §1.2)
- **Phase actuelle** : Discovery + Architecture + UX Phase 1 terminées, wireframes E10 terminé, E8 Hub en cours (UX Phase 2), en attente stories (PO)

### Utilisation de la documentation architecture

⚠️ **IMPORTANT** : La documentation architecture est maintenant modulaire pour optimiser le contexte.

**Règle obligatoire (quand l'architecture est concernée) :**

1. **TOUJOURS** commencer par lire `docs/architecture/README.md` pour identifier les fichiers pertinents
2. **NE JAMAIS** charger tous les fichiers d'un coup — sélectionner UNIQUEMENT les sections nécessaires
3. **Si incertain** sur les fichiers à charger, demander une clarification à l'utilisateur
4. **Consulter les fichiers spécifiques** selon le besoin :
   - `data-models.md` — Schémas DB, DTOs, types partagés
   - `api.md` — Endpoints REST, erreurs, formats de réponse
   - `frontend.md` — Architecture React, routing, auth client, UX
   - `backend.md` — Structure API, LLM, auth service, middleware
   - `infrastructure.md` — Docker, sécurité, workflow dev, monitoring
   - `testing-conventions.md` — Tests, conventions de code
   - `checklist.md` — Validation par phase (P1, P2, P3)

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
