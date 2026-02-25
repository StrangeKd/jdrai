# JDRAI - BMM Agents Customization (Claude Code)

**Version**: 1.1
**IDE**: Claude Code (claude.ai/code)
**Purpose**: JDRAI-specific customizations for BMM (Business + Methodology Module) agents

---

## Applicable Agents

This customization applies when working with BMM agents via BMAD commands:

- **Analyst** (Mary) — `/bmad-agent-bmm-analyst`
- **Architect** (Winston) — `/bmad-agent-bmm-architect`
- **Developer** (Amelia) — `/bmad-agent-bmm-dev`
- **Product Manager** (John) — `/bmad-agent-bmm-pm`
- **Scrum Master** (Bob) — `/bmad-agent-bmm-sm`
- **QA Engineer** (Quinn) — `/bmad-agent-bmm-qa`
- **UX Designer** (Sally) — `/bmad-agent-bmm-ux-designer`
- **Technical Writer** (Paige) — `/bmad-agent-bmm-tech-writer`
- **Quick Flow Solo Dev** (Barry) — `/bmad-agent-bmm-quick-flow-solo-dev`

---

## MANDATORY Project Context

**CRITICAL**: When any BMM agent is activated, you MUST immediately read:

```
_bmad/_memory/project-context.md
```

This file contains project-specific rules that take **ABSOLUTE PRECEDENCE** over any conflicting instructions from your base agent definition.

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

### Rule #4: UI Implementation — ShadCN First (Dev Agent)

When implémentant any UI component or frontend HTML/JSX content, the dev agent MUST follow this priority order:

**Step 1**: Check if a ShadCN component covers the use case
- Check `apps/web/src/components/ui/` for already-installed components
- Reference: https://ui.shadcn.com/docs/components

**Step 2**: Use or install the ShadCN component
```bash
pnpm dlx shadcn@latest add <component>
```

**Step 3**: Apply TD-001 fix after any `shadcn add`
- React 18 requires `React.forwardRef` on sub-components wrapping a `*Primitive.Content/Overlay`
- Already corrected on `dialog.tsx` — apply same pattern

**Step 4**: Only write raw HTML/JSX + Tailwind if **no ShadCN component** covers the use case

**Mandatory ShadCN usage** (non-exhaustive):
- `Button` → never `<button>`
- `Input`, `Form`, `FormField` → never `<input>`, `<form>` alone
- `Dialog` → never custom modal with raw HTML
- `Card` → never `<div className="card">`
- `Alert`, `Badge`, `Avatar`, `Tabs`, `NavigationMenu`, `Sonner`

**Rationale**: ShadCN ensures design system consistency, accessibility (a11y), and proper integration with Tailwind v4. Raw HTML bypasses these guarantees.

---

### Rule #5: Async Pattern — Prefer async/await

For any asynchronous TypeScript/JavaScript code, agents MUST prefer `async/await` over Promise chaining with `.then()`.

**Mandatory policy**:

- Use `async` functions and `await` for API calls, service methods, and asynchronous workflows
- Avoid `.then()`/`.catch()` chains in new code and refactors when behavior can be expressed with `async/await`
- Keep `try/catch` explicit when error handling is needed
- Use `.then()` only when there is a clear technical reason (e.g. functional Promise composition that is cleaner than `await`), and justify it briefly in code review notes

**Rationale**: `async/await` improves readability, debugging, and consistency across the codebase.

---

### Rule #3: Communication Standards

**Language**:

- **Default**: French (fr-FR) for all user communication
- **Code**: English for code, comments, and technical artifacts (standard practice)
- **Documentation**: French for user-facing docs, English for technical specs
- **Exception**: Respond in English only if user explicitly requests it

**Tone**:

- Professional and direct
- Action-oriented (prioritize doing over explaining)
- Concise responses (respect token limits)

---

## Compliance Requirements

These customizations are **MANDATORY** and override any conflicting base agent instructions.

**When in doubt**:

1. Check `_bmad/_memory/project-context.md`
2. Read relevant README.md before loading specific files
3. ASK USER FOR CLARIFICATION rather than loading excessive documentation
4. Communicate in French by default

**Violation consequences**:

- Loading all architecture/UX files at once → Context waste, reduced effectiveness
- Skipping README.md → Loading wrong files, inefficient workflow
- Not asking for clarification → Wasting time on wrong files

---

## Quick Reference

**Architecture docs**: `docs/architecture/` (8 files, always start with README.md)
**UX docs**: `docs/ux/` (cartography + wireframes/, always start with README.md)
**Project context**: `_bmad/_memory/project-context.md` (load first)
**Language**: French (default)

---

## Related Files

- **Project context**: `_bmad/_memory/project-context.md`
- **GDS agents customization**: `.claude/jdrai-gds-agents.md`
- **BMAD config**: `_bmad/_config/config.yaml`
- **Migration guide**: `_bmad/MIGRATION-V4-TO-V6.md`

---

**Maintained by**: Ryan
**Last updated**: 2026-02-25
**Version**: 1.1
