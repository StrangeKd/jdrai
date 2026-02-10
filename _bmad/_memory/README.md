# BMAD Memory - Project Context

This folder contains project-specific customizations and memory files that persist across agent sessions.

## Files

### `project-context.md`

**Purpose**: Central customization file for JDRAI project  
**Loaded by**: All BMAD agents (via `.cursor/rules/jdrai-*-agents.md`)  
**Version**: 1.0

**Contains**:
- Architecture documentation loading rules
- UX documentation loading rules
- JDRAI-specific game context (web RPG vs. game engine)
- GDS module usage guidelines
- Tech stack information
- Language preferences (French default)

### Usage

**For Agents**:
All agents are configured to automatically load `project-context.md` during activation. This file takes **absolute precedence** over conflicting base agent instructions.

**For Users**:
Modify this file to update project-wide agent behavior. Changes will affect all future agent invocations.

### Maintenance

- **Update frequency**: When project context changes (new docs structure, tech stack changes, etc.)
- **Version control**: Track in git
- **Format**: Markdown with clear sections
- **Size**: Keep concise (<5000 tokens) for optimal LLM performance

---

**Last Updated**: 2026-02-10  
**Maintained by**: Ryan
