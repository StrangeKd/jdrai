# BMAD v4 → v6 Migration Guide

**Date**: 2026-02-10  
**Status**: ✅ Completed  
**Version**: v6.0.0-Beta.8

---

## 📋 Migration Summary

Successfully migrated JDRAI project from BMAD v4 (Agile module only) to BMAD v6 (Core + BMM + GDS modules).

### What Changed

| Aspect            | v4                    | v6                                      |
| ----------------- | --------------------- | --------------------------------------- |
| **Format**        | XML agents            | Markdown agents                         |
| **Rules**         | `.cursor/rules/*.mdc` | `.cursor/rules/*.md` + `_bmad/_memory/` |
| **Commands**      | Embedded in rules     | Separate `.cursor/commands/*.md`        |
| **Modules**       | Agile only            | Core + BMM + GDS                        |
| **Customization** | Per-agent YAML        | Project-wide + per-module rules         |

---

## 🎯 Migration Goals Achieved

✅ **Goal 1**: Preserve custom architecture/UX documentation rules  
✅ **Goal 2**: Add Game Dev Studio (GDS) module for RPG design expertise  
✅ **Goal 3**: Clean migration without losing v4 reference (archived to `bmad-v4/`)  
✅ **Goal 4**: Maintain French language default  
✅ **Goal 5**: Optimize context usage (modular docs approach)

---

## 📁 New File Structure

```
jdrai/
├── _bmad/                              # BMAD v6 installation
│   ├── core/                           # Core module
│   │   ├── agents/
│   │   │   └── bmad-master.md
│   │   ├── tasks/
│   │   └── workflows/
│   ├── bmm/                            # Business + Methodology Module
│   │   ├── agents/                     # 9 Agile agents
│   │   ├── tasks/
│   │   └── workflows/                  # 24 workflows
│   ├── gds/                            # Game Dev Studio Module
│   │   ├── agents/                     # 7 game dev agents
│   │   ├── tasks/
│   │   └── workflows/                  # 24 game workflows
│   ├── _config/
│   │   ├── config.yaml                 # User: Ryan, Language: French
│   │   ├── agent-manifest.csv
│   │   ├── task-manifest.csv
│   │   └── workflow-manifest.csv
│   └── _memory/
│       └── project-context.md          # 🆕 JDRAI customizations
│
├── .cursor/
│   ├── commands/                       # 🆕 72 agent/workflow commands
│   │   ├── bmad-agent-bmm-*.md
│   │   ├── bmad-agent-gds-*.md
│   │   └── bmad-*.md
│   └── rules/                          # 🆕 JDRAI agent customizations (Cursor)
│       ├── jdrai-bmm-agents.md         # BMM agent rules
│       └── jdrai-gds-agents.md         # GDS agent rules
│
├── .claude/                            # 🆕 JDRAI customizations (Claude Code)
│   ├── README.md                       # Documentation
│   ├── jdrai-bmm-agents.md             # BMM agent rules
│   └── jdrai-gds-agents.md             # GDS agent rules
│
└── bmad-v4/                            # 📦 Archived v4 installation
    └── .cursor/rules/*.mdc             # Old v4 agent rules (reference)
```

---

## 🔧 Key Customizations Implemented

### 1. Project Context (`_bmad/_memory/project-context.md`)

Central customization file loaded by all agents containing:

- **Architecture Documentation Rule**: Always read `docs/architecture/README.md` first
- **UX Documentation Rule**: Always read `docs/ux/README.md` first
- **GDS Module Usage**: Guidelines on which GDS components are relevant
- **Tech Stack**: JDRAI-specific technologies
- **Language**: French default

### 2. Agent Rules (`.cursor/rules/`)

**`jdrai-bmm-agents.md`**:

- Applies to all 9 BMM agents (analyst, architect, dev, pm, sm, qa, ux-designer, tech-writer, quick-flow-solo-dev)
- Enforces architecture/UX README-first approach
- Sets French as default language

**`jdrai-gds-agents.md`**:

- Applies to relevant GDS agents (game-designer, tech-writer)
- Adds RPG-specific context (web-based, not game engine)
- Clarifies which GDS workflows are relevant vs. not

### 3. Updated Documentation

**`CLAUDE.md`**:

- Updated to reflect v6 installation
- Lists all available agents by module
- Documents customization files
- Clarifies GDS module usage

---

## 🎮 GDS Module: What's Relevant?

JDRAI is a **web-based RPG platform**, NOT a video game with a game engine.

### ✅ Relevant GDS Components

**Agents**:

- `game-designer` (Samus Shepard) — Core RPG design expertise
- `tech-writer` (Paige) — Game-specific documentation

**Workflows**:

- `narrative` — Story-driven design
- `brainstorm-game` — Game-specific brainstorming
- `gdd` — Game Design Document creation
- `create-game-brief` — Initial game vision

### ❌ NOT Relevant (Installed but Skip)

**Agents**:

- `game-architect` — Game engine architecture
- `game-dev` — Unity/Unreal/Godot implementation
- `game-qa` — Engine-specific testing
- `game-scrum-master` — Engine-specific scrum
- `game-solo-dev` — Engine-specific solo dev

**Workflows**:

- `gametest-*` (6 workflows) — Unity/Unreal/Godot testing
- `game-architecture` — Engine architecture

**Why**: These are for traditional video game development with game engines. JDRAI uses web technologies, so use **BMM workflows for implementation** instead.

---

## 🚀 How to Use v6

### Invoke Agents

Use Cursor commands (slash commands):

```
/bmad-agent-bmad-master          # Start BMad Master orchestrator
/bmad-agent-bmm-analyst          # Mary - Business Analyst
/bmad-agent-bmm-architect        # Winston - Architect
/bmad-agent-bmm-dev              # Amelia - Developer
/bmad-agent-gds-game-designer    # Samus Shepard - Game Designer
```

### Run Workflows

```
/bmad-bmm-create-prd             # Create PRD
/bmad-bmm-create-architecture    # Create architecture
/bmad-bmm-create-epics-and-stories  # Create stories
/bmad-bmm-dev-story              # Implement a story
/bmad-gds-narrative              # Design narrative
```

### Get Help

```
/bmad-help                       # Get BMAD help
/bmad-agent-bmad-master          # Access orchestrator menu
```

---

## 📖 Agent Behavior Changes

### v4 Agents

- XML-based configuration
- Embedded in `.cursor/rules/*.mdc`
- Customizations in YAML `customization:` field
- Invoked via `@agent-name`

### v6 Agents

- Markdown-based configuration
- Defined in `_bmad/{module}/agents/*.md`
- Invoked via `/bmad-agent-{module}-{name}`
- Customizations via:
  1. Project-wide: `_bmad/_memory/project-context.md`
  2. Module-wide: `.cursor/rules/jdrai-{module}-agents.md`

**Critical Rules** (preserved from v4):

1. ✅ Architecture: README.md first, then specific files
2. ✅ UX: README.md first, then specific files
3. ✅ French language default
4. ✅ Ask for clarification if >3 files needed

---

## ✅ Migration Checklist

- [x] Install BMAD v6 (Core + BMM + GDS)
- [x] Archive v4 installation to `bmad-v4/`
- [x] Create `_bmad/_memory/project-context.md`
- [x] Create `.cursor/rules/jdrai-bmm-agents.md`
- [x] Create `.cursor/rules/jdrai-gds-agents.md`
- [x] Update `CLAUDE.md` with v6 info
- [x] Update `.gitignore` to preserve BMAD files
- [x] Document migration in `MIGRATION-V4-TO-V6.md`

---

## 🔍 Testing the Migration

To verify the migration worked:

1. **Test BMad Master**:

   ```
   /bmad-agent-bmad-master
   ```

   Should greet Ryan in French and show menu

2. **Test BMM Agent**:

   ```
   /bmad-agent-bmm-analyst
   ```

   Should load project-context.md and follow architecture/UX rules

3. **Test GDS Agent**:

   ```
   /bmad-agent-gds-game-designer
   ```

   Should understand JDRAI is web-based RPG, not game engine

4. **Verify Customizations**:
   - Agents should communicate in French
   - Agents should read `docs/architecture/README.md` before loading architecture files
   - Agents should read `docs/ux/README.md` before loading UX files

---

## 📝 Notes

- **v4 Archive**: Kept in `bmad-v4/` for reference, not tracked in git
- **GDS Cleanup**: Decided NOT to remove unused GDS components (minimal cost, future flexibility)
- **Context Optimization**: Modular docs + README-first approach maintains low token usage
- **Language**: All agents default to French, matching v4 behavior

---

## 🆘 Troubleshooting

**Problem**: Agent doesn't load project-context.md  
**Solution**: Check `.cursor/rules/jdrai-{module}-agents.md` is present and not ignored

**Problem**: Agent loads all architecture files at once  
**Solution**: Verify customization rules are active, remind agent to check project-context.md

**Problem**: GDS agent suggests game engine solutions  
**Solution**: Remind agent to check `_bmad/_memory/project-context.md` Rule #3 (JDRAI-specific game context)

---

## 📚 Resources

- **BMAD v6 Documentation**: https://github.com/bmad-agent/bmad (hypothetical)
- **Project Context**: `_bmad/_memory/project-context.md`
- **Agent Manifests**: `_bmad/_config/*-manifest.csv`
- **v4 Archive**: `bmad-v4/.cursor/rules/`

---

**Migration completed by**: BMad Master  
**Date**: 2026-02-10  
**User**: Ryan
