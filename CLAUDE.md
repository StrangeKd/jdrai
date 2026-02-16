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

- **PRD validé** : `docs/prd.md` v1.4 (source de vérité pour les fonctionnalités)
- **Architecture validée** : `docs/architecture/` v1.4 (8 fichiers modulaires, voir `docs/architecture/README.md`)
- **UX validée** : `docs/ux/` (1 fichier cartographie, 6 fichiers wireframes, voir `docs/ux/README.md`)
- **Maquettes UX** : `mockups/` (inspiration libre, cf. UX cartography §1.2)
- **Phase actuelle** : Discovery + Architecture + UX Phase 1 terminées, wireframes P1 terminées (UX Phase 2), epics et stories en cours (SM + PO)

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

### Utilisation de la documentation UX

⚠️ **IMPORTANT** : La documentation UX est maintenant modulaire pour optimiser le contexte.

**Règle obligatoire (quand l'UX est concernée) :**

1. **TOUJOURS** commencer par lire `docs/ux/README.md` pour identifier les fichiers pertinents
2. **NE JAMAIS** charger tous les fichiers wireframes d'un coup — sélectionner UNIQUEMENT les écrans nécessaires
3. **Si incertain** sur les fichiers à charger, demander une clarification à l'utilisateur
4. **Consulter les fichiers spécifiques** selon le besoin :

- `ux-cartography.md` — Flows utilisateur, arborescence, inventaire composants, edge cases transversaux
- `wireframes/README.md` — Index wireframes + décisions de design transversales (mobile-first, milestones & events)
- `wireframes/E1-E2-auth.md` — Auth (login, register, forgot/reset pwd)
- `wireframes/E5-E6-E7-onboarding.md` — Onboarding (welcome, pseudo, tutoriel)
- `wireframes/E8-hub.md` — Hub (écran central post-auth)
- `wireframes/E9-lancement-aventure.md` — Lancement aventure (config, templates, aléatoire)
- `wireframes/E10-session-de-jeu.md` — Session de jeu (cœur produit)
- `wireframes/E11-ecran-de-fin.md` — Écran de fin (résumé, milestones, récompenses)

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

Ce projet utilise **BMAD v6.0** (Beta.8) pour le développement assisté par IA.

### Modules installés

- ✅ **CORE** : bmad-master, tâches éditoriales, party-mode
- ✅ **BMM** (Business + Methodology Module) : Agents Agile pour l'implémentation
- ✅ **GDS** (Game Dev Studio) : Agents game design pour conception RPG

### Agents disponibles

**BMM Agents** (implémentation) :

- `/bmad-agent-bmm-analyst` — Mary (Business Analyst)
- `/bmad-agent-bmm-architect` — Winston (Architect)
- `/bmad-agent-bmm-dev` — Amelia (Developer)
- `/bmad-agent-bmm-pm` — John (Product Manager)
- `/bmad-agent-bmm-sm` — Bob (Scrum Master)
- `/bmad-agent-bmm-qa` — Quinn (QA Engineer)
- `/bmad-agent-bmm-ux-designer` — Sally (UX Designer)
- `/bmad-agent-bmm-tech-writer` — Paige (Technical Writer)
- `/bmad-agent-bmm-quick-flow-solo-dev` — Barry (Quick Flow Solo Dev)

**GDS Agents** (game design) — _Pertinents pour JDRAI_ :

- `/bmad-agent-gds-game-designer` — Samus Shepard (Game Designer)
- `/bmad-agent-gds-tech-writer` — Paige (Technical Writer)

**Core Agents** :

- `/bmad-agent-bmad-master` — BMad Master (Orchestrateur)

**Note** : Les agents GDS spécifiques aux moteurs de jeu (game-dev, game-qa, game-architect, etc.) sont installés mais NON pertinents pour JDRAI (plateforme web). Utiliser BMM pour l'implémentation.

### Customisations JDRAI

**Fichiers de customisation** :

- `_bmad/_memory/project-context.md` — Contexte projet + règles critiques (chargé automatiquement par agents)
- `.cursor/rules/jdrai-bmm-agents.md` — Customisations agents BMM (Cursor)
- `.cursor/rules/jdrai-gds-agents.md` — Customisations agents GDS (Cursor)
- `.claude/jdrai-bmm-agents.md` — Customisations agents BMM (Claude Code)
- `.claude/jdrai-gds-agents.md` — Customisations agents GDS (Claude Code)

**Règles critiques** (déjà intégrées dans les customisations) :

1. Architecture : Toujours lire `docs/architecture/README.md` en premier (structure modulaire)
2. UX : Toujours lire `docs/ux/README.md` en premier (structure modulaire)
3. Charger UNIQUEMENT les fichiers spécifiques nécessaires (ne jamais tout charger d'un coup)
4. Demander clarification si >3 fichiers semblent nécessaires

**Support IDE** :
- ✅ Cursor : Customisations dans `.cursor/rules/`
- ✅ Claude Code : Customisations dans `.claude/`

### Documentation

`docs/` — PRD, architecture, UX cartography, stories (`{epicNum}.{storyNum}.story.md`)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
