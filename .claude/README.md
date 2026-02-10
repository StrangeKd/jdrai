# Claude Code Customizations for JDRAI

This folder contains project-specific customizations for Claude Code (claude.ai/code).

## 📁 Files

### `jdrai-bmm-agents.md`

**Purpose**: Customizations for BMM (Business + Methodology Module) agents  
**Applies to**: 9 BMM agents (analyst, architect, dev, pm, sm, qa, ux-designer, tech-writer, quick-flow-solo-dev)

**Key customizations**:
- Architecture documentation protocol (README.md first)
- UX documentation protocol (README.md first)
- French language default
- Context optimization rules

### `jdrai-gds-agents.md`

**Purpose**: Customizations for GDS (Game Dev Studio) agents  
**Applies to**: 3 relevant GDS agents (game-designer, game-architect, tech-writer)

**Key customizations**:
- JDRAI-specific game context (web RPG vs. game engine)
- Workflow usage guidelines (design vs. implementation)
- Architecture/UX documentation protocols
- French language default

## 🎯 How Claude Code Uses These Files

Claude Code automatically loads project rules from `.claude/` when working in this workspace. These customizations ensure that BMAD agents follow JDRAI-specific protocols.

### Activation

When a BMAD agent is invoked (e.g., `/bmad-agent-bmm-analyst`), Claude Code will:

1. Load the relevant customization file (BMM or GDS)
2. Apply the customization rules with **absolute precedence**
3. Follow the architecture/UX documentation protocols
4. Communicate in French by default

### Critical Rules Applied

All agents will:
- ✅ Read `_bmad/_memory/project-context.md` first
- ✅ Always consult `docs/architecture/README.md` before loading architecture files
- ✅ Always consult `docs/ux/README.md` before loading UX files
- ✅ Load maximum 3 files without explicit user approval
- ✅ Ask for clarification when unsure which files to load
- ✅ Communicate in French (fr-FR) by default

## 🔄 Relationship with Cursor Customizations

**Cursor equivalents**: `.cursor/rules/jdrai-bmm-agents.md` and `.cursor/rules/jdrai-gds-agents.md`

These files provide identical functionality but are formatted for their respective IDEs:

| Feature | Cursor | Claude Code |
|---------|--------|-------------|
| Location | `.cursor/rules/` | `.claude/` |
| Format | Markdown with YAML frontmatter | Pure Markdown |
| Activation | Via rule triggers | Automatic project-wide |
| Content | Same customizations | Same customizations |

**Maintenance**: When updating customizations, update BOTH Cursor and Claude Code versions to maintain consistency.

## 📚 Documentation Hierarchy

```
JDRAI customizations (ordered by precedence):

1. _bmad/_memory/project-context.md    [Highest precedence]
   └─ Loaded first by all agents
   
2. .claude/jdrai-{module}-agents.md    [IDE-specific rules]
   └─ Claude Code agents
   
3. .cursor/rules/jdrai-{module}-agents.md
   └─ Cursor agents
   
4. _bmad/{module}/agents/{name}.md     [Base agent definitions]
   └─ Default BMAD behavior (lowest precedence)
```

## ✅ Compliance

These customizations are **MANDATORY** for all BMAD agents working on JDRAI. They optimize context usage, prevent token waste, and ensure consistent behavior across development sessions.

## 🔗 Related Documentation

- **Project Context**: `_bmad/_memory/project-context.md`
- **Migration Guide**: `_bmad/MIGRATION-V4-TO-V6.md`
- **BMAD Config**: `_bmad/_config/config.yaml`
- **Architecture Index**: `docs/architecture/README.md`
- **UX Index**: `docs/ux/README.md`

---

**Maintained by**: Ryan  
**Last updated**: 2026-02-10  
**IDE Support**: Claude Code (claude.ai/code)
