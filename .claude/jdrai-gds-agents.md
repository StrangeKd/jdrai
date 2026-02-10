# JDRAI - GDS Agents Customization (Claude Code)

**Version**: 1.0
**IDE**: Claude Code (claude.ai/code)
**Purpose**: JDRAI-specific customizations for GDS (Game Dev Studio) agents

---

## Applicable Agents

This customization applies when working with relevant GDS agents via BMAD commands:

- **Game Designer** (Samus Shepard) — `/bmad-agent-gds-game-designer` — **RELEVANT**
- **Game Architect** (Cloud Dragonborn) — `/bmad-agent-gds-game-architect` — **PARTIAL**
- **Technical Writer** (Paige) — `/bmad-agent-gds-tech-writer` — **RELEVANT**

### Important Note on GDS Agents

Other GDS agents are installed but **NOT relevant** for JDRAI:
- `game-dev`, `game-qa`, `game-scrum-master`, `game-solo-dev` — Engine-specific (Unity/Unreal/Godot)
- Most `gametest-*` workflows — Engine-specific testing

**Rationale**: JDRAI is a **web-based RPG platform**, NOT a video game with a game engine. Use **BMM agents for implementation** instead.

---

## MANDATORY Project Context

**CRITICAL**: When any GDS agent is activated, you MUST immediately read:

```
_bmad/_memory/project-context.md
```

This file contains project-specific rules that take **ABSOLUTE PRECEDENCE** over any conflicting instructions from your base agent definition, including critical context about JDRAI being a web RPG, not a game engine project.

---

## CRITICAL Customization Rules

### Rule #1: Architecture Documentation Protocol

When architecture information is needed, you MUST follow this exact sequence:

**Step 1**: Read the architecture index
```
docs/architecture/README.md
```

**Step 2**: Based on the index, load ONLY the specific files needed:
- `docs/architecture/data-models.md` — Database schemas, DTOs, shared types
- `docs/architecture/api.md` — REST endpoints, errors, response formats
- `docs/architecture/frontend.md` — React architecture, routing, client auth, UX
- `docs/architecture/backend.md` — API structure, LLM, auth service, middleware
- `docs/architecture/infrastructure.md` — Docker, security, dev workflow, monitoring
- `docs/architecture/testing-conventions.md` — Tests, code conventions
- `docs/architecture/checklist.md` — Phase validation (P1, P2, P3)

**Step 3**: Apply these constraints:
- **NEVER** load all architecture files at once
- **NEVER** load files without consulting README.md first
- Load maximum 3 files unless explicitly approved by user
- If unsure which files to load, **ASK USER FOR CLARIFICATION**

**Rationale**: The architecture is modular (8 files) to optimize LLM context usage. Loading everything wastes tokens and reduces effectiveness.

---

### Rule #2: UX Documentation Protocol

When UX information is needed, you MUST follow this exact sequence:

**Step 1**: Read the UX index
```
docs/ux/README.md
```

**Step 2**: Based on the index, load ONLY the specific files needed:
- `docs/ux/ux-cartography.md` — Phase 1: flows, screens, components, narrative structure
- `docs/ux/wireframes/README.md` — Phase 2 index: wireframe organization
- Specific wireframe files:
  - `docs/ux/wireframes/E1-E2-auth.md`
  - `docs/ux/wireframes/E5-E6-E7-onboarding.md`
  - `docs/ux/wireframes/E8-hub.md`
  - `docs/ux/wireframes/E9-lancement-aventure.md`
  - `docs/ux/wireframes/E10-session-de-jeu.md`
  - `docs/ux/wireframes/E11-ecran-de-fin.md`

**Step 3**: Apply these constraints:
- **NEVER** load all UX files at once
- **NEVER** load files without consulting README.md first
- Load maximum 3 files unless explicitly approved by user
- If unsure which files to load, **ASK USER FOR CLARIFICATION**

**Rationale**: UX documentation is structured in phases (cartography → wireframes) to prevent context overload.

---

### Rule #3: JDRAI-Specific Game Context

**CRITICAL**: JDRAI is a **web-based RPG platform** with AI Game Master, NOT a video game with a game engine.

#### What to Focus On (Web RPG Context)

When working as a GDS agent on JDRAI, focus on:

- **Tabletop RPG Mechanics** (D&D-style gameplay)
  - Turn-based combat and decision-making
  - Dice rolling, skill checks, ability scores
  - Character classes, races, backgrounds
  
- **Narrative Design & Storytelling**
  - Quest design and branching narratives
  - World-building and lore
  - NPC personalities and dialogue systems
  
- **AI Game Master Systems**
  - LLM-powered storytelling
  - Dynamic encounter generation
  - Rules interpretation and adjudication
  
- **Character Progression**
  - Experience points and leveling
  - Skill trees and abilities
  - Equipment and inventory
  
- **Multiplayer Coordination**
  - Party dynamics and roles
  - Turn order management
  - Shared world state
  
- **Web-Based UI/UX for RPG**
  - Character sheets as web forms
  - Chat-based interaction with GM
  - Dice rolling interfaces
  - Map/battle grid visualization

#### What NOT to Focus On (Game Engine Context)

**DO NOT** focus on traditional video game concerns:

- Game engine architecture (Unity/Unreal/Godot)
- Real-time rendering or graphics pipelines
- 60fps performance optimization
- Physics engines or collision detection
- Console/mobile platform considerations (Xbox, PlayStation, Switch)
- Game engine-specific testing frameworks
- Shader programming or visual effects
- Audio engines or spatial sound

**Rationale**: These are irrelevant to a web-based RPG platform. JDRAI uses React, Express, and PostgreSQL, NOT game engines.

---

### Rule #4: Workflow Usage Guidelines

#### For game-designer Agent

**Relevant workflows**:
- `/bmad-gds-narrative` — Story and world-building design
- `/bmad-gds-brainstorm-game` — RPG mechanics brainstorming
- `/bmad-gds-gdd` — Game Design Document creation
- `/bmad-gds-create-game-brief` — Initial game vision

**Adaptation required**:
- When using `gdd` workflow, **adapt templates to web RPG context**
- Remove engine-specific sections (rendering, physics, platform requirements)
- Add web-specific sections (API design, LLM integration, database schema)

#### For Implementation Tasks

**Critical rule**:
- **DO NOT** use GDS implementation workflows:
  - `dev-story`, `sprint-planning`, `code-review`, etc.
- **USE BMM implementation workflows instead**:
  - `/bmad-bmm-dev-story`
  - `/bmad-bmm-sprint-planning`
  - `/bmad-bmm-code-review`

**Rationale**: GDS implementation workflows are for game engines. JDRAI is web-based, so use BMM (Business + Methodology Module) for all implementation work.

**Division of responsibilities**:
- **GDS agents** → Design expertise (mechanics, narrative, systems)
- **BMM agents** → Implementation execution (code, tests, deployment)

---

### Rule #5: Communication Standards

**Language**:
- **Default**: French (fr-FR) for all user communication
- **Code**: English for code, comments, and technical artifacts (standard practice)
- **Game Design Docs**: French for JDRAI-specific content
- **Exception**: Respond in English only if user explicitly requests it

**Game Design Communication**:
- Use RPG terminology (character, campaign, session, GM/DM, party, encounter)
- Reference D&D 5e mechanics when applicable (widely known)
- Explain game mechanics clearly for web implementation team
- Bridge design concepts to technical requirements

---

## Compliance Requirements

These customizations are **MANDATORY** and override any conflicting base agent instructions.

**Critical reminders**:
1. JDRAI is a web RPG platform, NOT a game engine project
2. Check `_bmad/_memory/project-context.md` for full context
3. Read relevant README.md before loading specific files
4. Use GDS for design, BMM for implementation
5. Communicate in French by default

**When in doubt**:
- "Is this feature about game engines?" → **ASK USER**, don't assume engine context
- "Should I use GDS or BMM workflow?" → Design = GDS, Implementation = BMM
- "Which docs to load?" → Read README.md first, then ASK if unsure

---

## Quick Reference

**Project type**: Web-based RPG platform (NOT game engine)
**Tech stack**: React + Express + PostgreSQL + LLM (NOT Unity/Unreal)
**GDS usage**: Design & narrative ONLY (implementation uses BMM)
**Architecture docs**: `docs/architecture/` (always start with README.md)
**UX docs**: `docs/ux/` (always start with README.md)
**Project context**: `_bmad/_memory/project-context.md` (load first)
**Language**: French (default)

---

## Related Files

- **Project context**: `_bmad/_memory/project-context.md`
- **BMM agents customization**: `.claude/jdrai-bmm-agents.md`
- **BMAD config**: `_bmad/_config/config.yaml`
- **Migration guide**: `_bmad/MIGRATION-V4-TO-V6.md`

---

**Maintained by**: Ryan
**Last updated**: 2026-02-10
**Version**: 1.0
