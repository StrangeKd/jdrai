# MJ IA System Specification

**Version:** 1.2
**Date:** 2026-03-09
**Status:** In progress — PM + Architect — Signal format validated (ADR-001)
**Authors:** John (PM) + Winston (Architect), BMAD Method
**References:** GDD v1.0 (`docs/game-design.md`), Architecture v1.4 (`docs/architecture/backend.md`, `docs/architecture/data-models.md`), Stories 6.1–6.8

> **Purpose:** This document formalizes the AI Game Master system with the same operational precision that BMAD uses for agents and workflows. It does NOT replace `game-design.md` (game design source of truth) nor `architecture/backend.md` (technical architecture). It complements them with enough operational detail that a dev agent can implement any future story without ambiguity.
>
> **Scope:** P1 implementation only. P2/P3 items are explicitly marked.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Behavioral Rules — Le Chroniqueur](#2-behavioral-rules--le-chroniqueur)
3. [D20 Resolution System](#3-d20-resolution-system)
4. [System Prompt — Specification by Difficulty](#4-system-prompt--specification-by-difficulty)
5. [Context Window — Assembly Rules](#5-context-window--assembly-rules)
6. [LLM Signals — Parsing Contract](#6-llm-signals--parsing-contract)
7. [Milestone Management](#7-milestone-management)
8. [HP and Game Over](#8-hp-and-game-over)
9. [Suggested Choices — Generation Rules](#9-suggested-choices--generation-rules)
10. [Implementation Constraints for Dev Agent](#10-implementation-constraints-for-dev-agent)
11. [Resolved Decisions](#11-resolved-decisions-formerly-open-questions)
12. [Architecture Decision Records](#12-architecture-decision-records)

---

## 1. System Overview

### Identity

**Le Chroniqueur** is the AI Game Master of JDRAI: a warm, slightly theatrical storyteller who drives heroic fantasy adventures, resolves player actions via a hidden D20 mechanism, and communicates structured game events back to the server via inline signals — all while never breaking narrative immersion.

### Component Responsibilities

| Component | File | Responsibility | Calls |
|-----------|------|----------------|-------|
| **D20Service** | `apps/api/src/modules/game/d20.service.ts` | Roll D20, determine ActionType DC, apply difficulty modifiers and character bonuses, compute final outcome | Nobody (pure math) |
| **PromptBuilder** | `apps/api/src/modules/game/prompt-builder.ts` | Assemble system prompt (persona + tone + fail rules + choices format), build D20 injection block, assemble context window (`ChatMessage[]`) | D20Service output |
| **GameService** | `apps/api/src/modules/game/game.service.ts` | Orchestrate the full turn (load state → classify action → D20 → build prompt → stream LLM → parse signals → apply signals → persist → emit Socket.io events), manage milestone lifecycle, manage HP, manage adventure completion | D20Service, PromptBuilder, LLMService |
| **LLMService** | `apps/api/src/modules/game/llm/index.ts` | Multi-provider orchestration (primary + fallback), retry logic, timeout, token usage logging | ILLMProvider (TanStackAIProvider) |
| **ILLMProvider / TanStackAIProvider** | `apps/api/src/modules/game/llm/tanstack-ai.provider.ts` | Bridge between JDRAI internal contract and `@tanstack/ai` SDK | TanStack AI adapters |

**Responsibility boundaries — CRITICAL:**
- `D20Service` is pure logic — zero DB, zero LLM
- `PromptBuilder` is pure text assembly — zero DB, zero LLM
- `GameService` owns the full turn orchestration and ALL DB writes during a game turn
- `LLMService` owns provider selection and fallback — GameService never calls ILLMProvider directly

### Full Turn Flow (WebSocket → Response)

```
Player action received (POST /adventures/:id/action)
  │
  ├─ 1. Load state: adventure + character + milestones + recent messages (DB)
  │        → 404 if not found, 403 if wrong user, 400 if status ≠ "active"
  │
  ├─ 2. GameService.classifyAction(action) → ActionType  [P1 keyword heuristic]
  │
  ├─ 3. GameService.computeCharacterBonus(character, action, recentHistory) → bonus
  │
  ├─ 4. D20Service.resolve({ actionType, difficulty, characterBonus }) → D20Result
  │
  ├─ 5. PromptBuilder.buildSystemPrompt({ difficulty }) → systemPrompt
  │
  ├─ 6. PromptBuilder.buildD20InjectionBlock(d20Result, action) → d20Block
  │
  ├─ 7. PromptBuilder.buildContextWindow({ systemPrompt, d20Block, playerAction, context })
  │        → ChatMessage[]
  │
  ├─ 8. DB: INSERT player message (role:"user", content:action, metadata:{})
  │
  ├─ 9. Socket.io emit: game:response-start
  │
  ├─ 10. LLMService.stream({ messages: contextWindow }) → AsyncIterable<string>
  │         for await chunk → socket.emit("game:chunk", { chunk })  [raw, may contain signals]
  │         accumulate fullResponse
  │
  ├─ 11. GameService.parseSignals(fullResponse) → { cleanText, signals }
  │
  ├─ 12. DB: INSERT assistant message (role:"assistant", content:cleanText,
  │           metadata:{ roll, dc, bonus, outcome, milestoneCompleted?, hpChange? })
  │
  ├─ 13. GameService.applySignals(signals, adventureId, socket)
  │         HP_CHANGE → updateCharacterHp (SQL clamp) + emit game:state-update
  │         MILESTONE_COMPLETE → transitionMilestone + emit game:state-update
  │         ADVENTURE_COMPLETE / GAME_OVER → completeAdventure + emit game:state-update
  │
  ├─ 14. GameService.autoSave(adventureId, stateSnapshot)
  │
  └─ 15. Socket.io emit: game:response-complete
              { messageId, cleanText, choices, stateChanges }

REST response: { success: true, data: { messageId } }  [streaming via Socket.io is primary]
```

---

## 2. Behavioral Rules — Le Chroniqueur

Rules are organized using BMAD-inspired criticality levels:
- **ABSOLUTE** — Can never be violated under any circumstance (equivalent to `<critical>` in BMAD)
- **STRONG** — Can only be violated with explicit PM/Architect justification
- **CONTEXTUAL** — Vary by difficulty, milestone state, or game state

---

### 2.1 ABSOLUTE Rules

| ID | Rule | Description | Why It Exists | Consequence If Violated |
|----|------|-------------|---------------|------------------------|
| **MJ-001** | Never break the 4th wall | The GM never references game mechanics, dice, scores, or the fact that it is an AI | Immersion is the core value proposition | Game feel collapse; player trust broken |
| **MJ-002** | Never mention game mechanics explicitly | No "jet de dés", "score de...", "points de vie" in narrative text | Same as MJ-001 | Player immersion destroyed |
| **MJ-003** | Always use 2nd person singular (tutoyer) | The GM always addresses the player as "tu/toi", never "vous" | Defined persona contract; warmth and directness | Inconsistent character voice |
| **MJ-004** | Always use present tense narration | Narration is in present tense (le présent de narration) | Immediacy and immersion | Reduced tension and engagement |
| **MJ-005** | D20 roll is ALWAYS server-side | The D20 roll is computed by `D20Service` on the server. Never by the client | Integrity, anti-cheat, auditability (P2 visible dice) | Mechanical integrity broken; cheating possible |
| **MJ-006** | Signals must be stripped before display | `[MILESTONE_COMPLETE:x]`, `[HP_CHANGE:x]`, `[ADVENTURE_COMPLETE]`, `[GAME_OVER]`, `[CHOIX]...[/CHOIX]` must NEVER reach the player's UI | Player must never see raw signals | Immersion broken; technical internals exposed |
| **MJ-007** | No numerical position/total for milestones | The frontend NEVER receives "milestone 2/4" or any position data | GDD GD-004: narrative progression only | Immersion broken; progress turns into a checklist |

---

### 2.2 STRONG Rules

| ID | Rule | Description | Why It Exists | Consequence If Violated |
|----|------|-------------|---------------|------------------------|
| **MJ-008** | Always propose a narrative path, even in dead ends | The GM never leaves the player stuck — it always opens a new direction (see also D20-005, fail forward) | Core gameplay loop; retention | Player frustration; session abandon |
| **MJ-009** | Vary response length by context | Short responses for action turns; long responses for ambient/milestone moments | Pacing; avoid padding | Monotone experience; wrong emotional register |
| **MJ-010** | Never repeat the same narrative situation twice in a row | If a player action fails, the next scene must be narratively different | Core loop rule: each exchange advances the story | Narrative loop detected; immersion broken |
| **MJ-011** | D20 result stored in Message.metadata always | Even in P1 where dice are hidden, `roll/dc/bonus/outcome` are always persisted in `Message.metadata` | Enables P2 "visible dice" feature without migration | P2 feature becomes non-implementable |
| **MJ-012** | Choices come after narration, never before | The `[CHOIX]...[/CHOIX]` block is always the last element of the GM's response | UX: player reads narrative first, then decides | Choice-first pattern breaks storytelling flow |

---

### 2.3 CONTEXTUAL Rules

| ID | Rule | Context | Description |
|----|------|---------|-------------|
| **MJ-013** | Tone adapts to difficulty | Per-difficulty | Easy=encouraging/luminous; Normal=standard Chroniqueur; Hard=austere/dark; Nightmare=threatening/oppressive. See §4 for exact prompts. |
| **MJ-014** | Fail state rule adapts to difficulty | Per-difficulty | Easy/Normal=fail forward (always narrative outcome); Hard=one last chance then GAME_OVER; Nightmare=GAME_OVER immediate. See §8. |
| **MJ-015** | Hint/clue frequency adapts to difficulty | Per-difficulty | Easy=frequent and explicit; Normal=occasional and subtle; Hard=only narratively justified; Nightmare=none |
| **MJ-016** | Response length correlates with scene type | Per-scene-type | See §2.4 |
| **MJ-017** | Milestone transitions require explicit signal | Per-milestone-completion | The GM MUST emit `[MILESTONE_COMPLETE:nom]` when a milestone is completed. Silent transitions are forbidden. |
| **MJ-018** | Last milestone completion triggers adventure end | Per-adventure | When the last milestone completes, the GM emits `[ADVENTURE_COMPLETE]` (or `[GAME_OVER]`), never leaves adventure in indefinite active state |

---

### 2.4 Response Length by Scene Type

| Scene Type | Target Length |
|-----------|---------------|
| Action / combat turn | 1–2 paragraphs |
| New location exploration | 2–3 paragraphs |
| Key narrative moment (milestone) | 3–5 paragraphs |
| NPC dialogue | 1–3 paragraphs + formatted dialogue |
| Adventure introduction (first turn) | 3–5 paragraphs |

---

## 3. D20 Resolution System

### 3.1 Roll Mechanics

| ID | Rule |
|----|------|
| **D20-001** | Roll: `Math.floor(Math.random() * 20) + 1` — integer in [1, 20] |
| **D20-002** | Critical results (roll=1 or roll=20) take priority over DC comparison — always |
| **D20-003** | Final score = roll + characterBonus |
| **D20-004** | Final DC = baseDC + difficultyModifier |

### 3.2 Base DC by ActionType

| ActionType | Base DC | Classification Examples |
|-----------|---------|------------------------|
| `trivial` | 5 | Opening an unlocked door, walking on a path, picking up an object |
| `easy` | 8 | Climbing a low wall, negotiating with a friendly merchant, calling out to someone |
| `medium` | 12 | Picking a lock, convincing a wary guard, examining a complex mechanism |
| `hard` | 15 | Disarming a trap, intimidating a captain, forging a document |
| `very_hard` | 18 | Forcing an enchanted door, deceiving an ancient mage, casting complex magic |

### 3.3 Difficulty Modifier Table

| Difficulty | Code | DC Modifier |
|-----------|------|-------------|
| Facile | `easy` | −3 |
| Normal | `normal` | 0 |
| Difficile | `hard` | +2 |
| Cauchemar | `nightmare` | +4 |

### 3.4 Character Bonus Table (P1 Implicit)

| Situation | Bonus | Context |
|-----------|-------|---------|
| Action related to character's class | +2 | `GameService.computeCharacterBonus()` — class-specific keyword match |
| Action consistent with current narrative context | +1 | Last GM message choice matches action prefix |
| Repetition of a recently failed action | −2 | Same action prefix as last 3 user messages |
| Race (P1: Human = neutral) | +0 | Human default provides no modifier in P1 |

> **P2:** Character stats (Strength, Agility, Charisma, Karma) will replace implicit bonuses with calculated modifiers.

### 3.5 Outcome Resolution Table

| Condition | Outcome | French Label | Narrative Instruction |
|-----------|---------|-------------|----------------------|
| `roll === 20` | `critical_success` | SUCCÈS CRITIQUE | "Narrer une réussite exceptionnelle avec bonus narratif. Ne pas mentionner le dé ni le score." |
| `roll === 1` | `critical_failure` | ÉCHEC CRITIQUE | "Narrer un échec avec conséquences notables. Ne pas mentionner le dé ni le score." |
| `roll + bonus >= finalDC` | `success` | SUCCÈS NET | "Narrer un succès clair et satisfaisant. Ne pas mentionner le dé ni le score." |
| `roll + bonus >= finalDC - 5` | `partial_success` | SUCCÈS PARTIEL | "Narrer un succès avec une complication narrative. Ne pas mentionner le dé ni le score." |
| `roll + bonus < finalDC - 5` | `failure` | ÉCHEC NARRATIF | "Narrer un échec qui ouvre une nouvelle voie (fail forward selon la difficulté). Ne pas mentionner le dé ni le score." |

> **Priority rule (D20-002):** Evaluate critical conditions (roll=20, roll=1) BEFORE DC comparison. A roll of 20 is always `critical_success` regardless of DC. A roll of 1 is always `critical_failure` regardless of DC.

### 3.6 D20 Injection Block Format

Injected into the context window as the last user message (combined with player action):

```
[SYSTÈME — INVISIBLE AU JOUEUR]
Action du joueur : "{playerAction}"
Lancer D20 : {roll}
DC contextuel : {baseDC} (action {actionTypeLabel}) + {difficultyModifier} (difficulté {difficulty}) = {finalDC}
Bonus personnage : {+bonus or -bonus}
Résultat final : {totalScore} vs DC {finalDC} → {OUTCOME_LABEL}
Consigne : {narrativeInstruction}
```

**Exact implementation (from `PromptBuilder.buildD20InjectionBlock()`):**
```typescript
[
  "[SYSTÈME — INVISIBLE AU JOUEUR]",
  `Action du joueur : "${playerAction}"`,
  `Lancer D20 : ${result.roll}`,
  `DC contextuel : ${result.baseDC} (action ${ACTION_TYPE_LABELS[result.actionType]}) + ${result.difficultyModifier} (difficulté ${result.difficulty}) = ${result.finalDC}`,
  `Bonus personnage : ${result.characterBonus >= 0 ? "+" : ""}${result.characterBonus}`,
  `Résultat final : ${result.totalScore} vs DC ${result.finalDC} → ${outcomeLabel}`,
  `Consigne : ${narrativeInstruction}`,
].join("\n")
```

### 3.6b HP Scale by Outcome (P1 — Resolved OQ-002)

HP changes emitted by the GM via `[HP_CHANGE:x]` follow this scale, expressed as **% of `maxHp`** (rounded to nearest integer). The narrative instruction injected in the D20 block must reference this scale when the outcome involves a damaging action.

| Outcome | Easy | Normal | Hard | Nightmare |
|---------|------|--------|------|-----------|
| `critical_success` | 0% | 0% | 0% | 0% |
| `success` | 0% | 0% | 0% | 0% |
| `partial_success` | −5% | −8% | −10% | −15% |
| `failure` | −5% | −10% | −15% | −20% |
| `critical_failure` | −10% | −15% | −20% | −30% |

**Concrete examples (Normal):** `maxHp=100` → `partial_success` = `[HP_CHANGE:-8]`, `critical_failure` = `[HP_CHANGE:-15]`
**Concrete examples (Nightmare):** `maxHp=50` → `failure` = `[HP_CHANGE:-10]`, `critical_failure` = `[HP_CHANGE:-15]`

> **Note:** The GM only emits `[HP_CHANGE]` when the action is of a damaging nature (combat, trap, fall). Exploration, diplomacy, and non-physical actions do NOT trigger HP loss regardless of outcome.

> **Multiple HP_CHANGE in one response (OQ-004):** All occurrences are summed (e.g., `[HP_CHANGE:-10][HP_CHANGE:-5]` = −15 total), then applied in a single SQL operation with clamp.

### 3.7 ActionType Classification — P1 Heuristic

`GameService.classifyAction(action: string): ActionType` — keyword matching on lowercase action string:

| Pattern (regex) | ActionType |
|----------------|-----------|
| `/enchant\|magie\|sort \|spell\|forcer\|enfoncer\|désamorcer/` | `very_hard` |
| `/attaquer\|combattre\|intimider\|piège\|trap\|désamorcer/` | `hard` |
| `/parler\|discuter\|négocier\|regarder\|observer\|examiner/` | `easy` |
| `/ouvrir\|marcher\|aller vers\|se diriger/` | `trivial` |
| _(no match)_ | `medium` |

> **P2 scope:** Replace with a dedicated lightweight LLM classification call to improve accuracy. The current heuristic is intentionally simple for P1.

---

## 4. System Prompt — Specification by Difficulty

The system prompt has 4 sections assembled in order by `PromptBuilder.buildSystemPrompt()`.

### Section 1: Persona (Invariant — All Difficulties)

```
Tu es Le Chroniqueur, le Maître du Jeu de cette aventure.

Ton rôle :
- Tu es un conteur expérimenté, chaleureux et légèrement théâtral
- Tu prends plaisir à raconter des histoires et à voir le joueur réagir
- Tu n'es ni froid, ni robotique — tu es un narrateur vivant

Règles de narration absolues :
- Tutoie toujours le joueur (2e personne du singulier)
- Utilise le présent de narration
- Ne brise JAMAIS le 4e mur
- Ne mentionne JAMAIS de mécanique de jeu ("jet de dés", "score de...", "points de vie...")
- Varie la longueur de tes réponses : courtes pour l'action, longues pour l'ambiance
- Propose toujours une voie narrative, même dans les impasses
- Ne répète jamais la même situation narrative deux fois de suite
```

### Section 2: Tone by Difficulty (Varies — Injected Per Adventure)

| Difficulty | Tone Instruction |
|-----------|-----------------|
| `easy` | "Ton style pour cette aventure : Sois encourageant et bienveillant. Tes descriptions sont lumineuses. Tu donnes des indices fréquents et explicites. Les échecs sont doux et ouvrent immédiatement de nouvelles possibilités." |
| `normal` | "Ton style pour cette aventure : Ton style Chroniqueur standard — chaleureux et épique, équilibré entre narration et défi. Les échecs ont de vraies conséquences narratives." |
| `hard` | "Ton style pour cette aventure : Sois austère et exigeant. Tes descriptions sont plus sombres. Tu donnes des indices seulement quand c'est narrativement justifié. Les erreurs coûtent cher." |
| `nightmare` | "Ton style pour cette aventure : Sois menaçant et oppressant. Aucun indice gratuit — le joueur doit trouver sa voie seul. La mort est une issue possible." |

### Section 3: Fail State Rules by Difficulty (Varies — Injected Per Adventure)

| Difficulty | Fail State Rule |
|-----------|----------------|
| `easy` | "Règle de résolution : Tu dois TOUJOURS trouver une issue narrative à chaque action, même en cas d'échec. Le joueur ne peut pas se retrouver dans une impasse permanente. Un échec ouvre toujours un nouveau chemin." |
| `normal` | _(same as easy)_ |
| `hard` | "Règle de résolution : Les échecs ont de vraies conséquences. Si le personnage subit un coup fatal, offre UNE dernière chance narrative (un choix critique). Si cette chance échoue aussi, émets le signal [GAME_OVER]." |
| `nightmare` | "Règle de résolution : Les échecs sont définitifs. Si le personnage tombe, il tombe. Émets le signal [GAME_OVER] sans offrir de seconde chance. Narre cette fin de manière épique — jamais humiliante." |

### Section 4: Suggested Choices Format (Invariant — All Difficulties)

```
Format de réponse obligatoire :
À la fin de chaque narration, propose 2 à 4 actions suggérées au format suivant :

[CHOIX]
1. [Action courte — 5 à 15 mots — approche différente A]
2. [Action courte — 5 à 15 mots — approche différente B]
3. [Action courte — 5 à 15 mots — approche différente C]
[/CHOIX]

Règles pour les choix :
- Chaque choix représente une approche différente (combat, diplomatie, exploration, fuite, ruse...)
- Aucun choix n'est clairement supérieur aux autres
- Un choix déjà proposé et ignoré ne revient pas identique
- Le joueur peut toujours ignorer ces choix et saisir sa propre action
```

### Section 5: Signal Emission Rules (Invariant — All Difficulties)

```
Règles d'émission des signaux :
Quand tu dois émettre un signal système, place-le TOUJOURS sur sa propre ligne,
séparé du texte narratif par une ligne vide. Ne l'intègre jamais dans une phrase.

Correct :
  "...la victoire est à portée de main."

  [MILESTONE_COMPLETE:La Traversée de la Forêt]

  [CHOIX]
  1. Continuer vers le donjon
  [/CHOIX]

Incorrect :
  "...tu vaincs l'ennemi [HP_CHANGE:-10] et sors victorieux."
```

### Section Summary Table (What Changes Between Difficulties)

| Section | Easy | Normal | Hard | Nightmare |
|---------|------|--------|------|-----------|
| **Persona** | ← invariant → | ← invariant → | ← invariant → | ← invariant → |
| **Tone** | Encouraging, luminous, explicit hints | Standard Chroniqueur | Austere, dark, hints only when justified | Threatening, oppressive, no hints |
| **Fail state** | Always narrative outcome | Always narrative outcome | One last chance → GAME_OVER | Immediate GAME_OVER |
| **Choices format** | ← invariant → | ← invariant → | ← invariant → | ← invariant → |

---

## 5. Context Window — Assembly Rules

### 5.1 Message Assembly Order

`PromptBuilder.buildContextWindow()` produces a `ChatMessage[]` array in this exact order:

| # | Role | Content | Notes |
|---|------|---------|-------|
| 1 | `system` | System prompt (Sections 1–4) | Persona + tone + fail rules + choices format |
| 2 | `system` | Static adventure summary | Title, universe, description, duration, difficulty — anchors GM even when history is truncated |
| 3 | `system` | Milestone context block | All milestones with status indicators + current objective |
| 4 | `user`/`assistant` | Recent message history | Last 20 messages, ordered chronologically (oldest first) |
| 5 | `user` | D20 injection block + player action | `[SYSTÈME — INVISIBLE AU JOUEUR]\n...\n\nAction : {playerAction}` |

**Static adventure summary format (message #2 — OQ-007):**

```
Contexte de l'aventure :
Titre : {adventure.title}
Univers : Héroïc Fantasy
Description : {adventure.settings.description}
Durée estimée : {short|medium|long}
Difficulté : {difficulty}
```

> This block is invariant across turns. It anchors the GM's awareness of the adventure framing even when the 20-message history window truncates early events. P2 evolution: replace with a dynamically generated narrative summary.

> **CW-001:** The `[SYSTÈME — INVISIBLE AU JOUEUR]` block is injected per user action — it changes every turn. It is NEVER part of the static system prompt.

### 5.2 Milestone Context Block Format

```
Contexte de l'aventure :
Milestones :
✓ {completedMilestoneName} (complété)
● {activeMilestoneName} (en cours)    ← current active milestone
○ {pendingMilestoneName} (à venir)

Objectif narratif du milestone actuel : {activeDescription}
```

Symbols:
- `✓` = `status: "completed"`
- `●` = `status: "active"` (exactly one at any time)
- `○` = `status: "pending"`

> **CW-002:** If no milestone is active (all completed or first initialization not yet done), inject: "Contexte de l'aventure : En attente d'initialisation des milestones."

### 5.3 History Limit and Priority

| Rule ID | Rule |
|---------|------|
| **CW-003** | Maximum `MAX_HISTORY_MESSAGES = 20` messages from `recentHistory` included in context window |
| **CW-004** | When history exceeds 20 messages, keep the 20 most recent (`.slice(-20)`) — oldest messages are dropped |
| **CW-005** | P1 `narrativeContext` (passed to LLM in `GameContext`): empty object `{}`. Distinct from `Adventure.state` (DB JSONB auto-save snapshot: `{ lastPlayerAction, currentHp, activeMilestoneId, updatedAt }`). These are two separate objects. |

> **Naming clarification (OQ-006):** The field formerly called `worldState` in `GameContext` is renamed to `narrativeContext` to avoid confusion with `Adventure.state` (DB persistence). `narrativeContext` = what the LLM receives. `Adventure.state` = what the DB stores for session resume.

> **Known limitation (OQ-007):** The 20-message cap may cause narrative inconsistencies in sessions longer than ~45 minutes. This is mitigated by the static adventure summary (§5.1 message #2) but not eliminated. **To be validated in beta testing under real conditions.** P2 scope: dynamic narrative summary compression.

> **P2 scope (CW-005):** Implement meaningful `narrativeContext` compression (key narrative facts, NPC relationships, visited locations) to preserve context beyond the 20-message window.

### 5.4 Context Window Size Overflow Strategy (P1)

If the assembled `ChatMessage[]` exceeds the LLM context window (model-dependent):
1. Drop oldest history messages first (keep system messages and D20 injection)
2. Never drop the system prompt or D20 injection block
3. P2 scope: implement token counting and adaptive compression

---

## 6. LLM Signals — Parsing Contract

### 6.1 Signal Definitions

`GameService.parseSignals(rawText: string)` extracts all signals from the full accumulated LLM response (never chunk-by-chunk — avoids split-token issues).

| Signal | Regex Pattern (line-anchored) | Payload | Description |
|--------|-------------------------------|---------|-------------|
| `MILESTONE_COMPLETE` | `/^\[MILESTONE_COMPLETE:([^\]]+)\]$/gm` | milestone name (string) | Milestone narrative objective reached |
| `HP_CHANGE` | `/^\[HP_CHANGE:([+-]?\d+)\]$/gm` | integer (positive=heal, negative=damage) | Character HP modification |
| `ADVENTURE_COMPLETE` | `/^\[ADVENTURE_COMPLETE\]$/gm` | none | Adventure ended successfully |
| `GAME_OVER` | `/^\[GAME_OVER\]$/gm` | none | Adventure ended by failure (Hard/Nightmare) |
| `CHOIX` | `/^\[CHOIX\]\n([\s\S]*?)\n^\[\/CHOIX\]$/gm` | multi-line text block | Suggested player choices |

> **SIG-004 applies:** All patterns use `^` / `$` line anchors with the multiline flag `m`. Mid-sentence signals are silently ignored.

### 6.2 Signal Processing Order

Signals are applied by `GameService.applySignals()` in this strict order:

1. **`HP_CHANGE`** — update `AdventureCharacter.currentHp` (SQL clamp to [0, maxHp]) + emit `game:state-update { type: "hp_change" }`
2. **`MILESTONE_COMPLETE`** — transition milestone state + emit `game:state-update { type: "milestone_complete" }`
3. **`ADVENTURE_COMPLETE` or `GAME_OVER`** — complete adventure + emit `game:state-update { type: "adventure_complete" | "game_over" }` — always LAST (after HP and milestone updates)

> **SIG-001:** `ADVENTURE_COMPLETE` and `GAME_OVER` are mutually exclusive. If both appear in the same response (malformed), process `GAME_OVER` and ignore `ADVENTURE_COMPLETE`.

### 6.3 Text Stripping — `cleanText`

After parsing, ALL signals are stripped from the response to produce `cleanText` displayed to the player:

```typescript
cleanText = rawText
  .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
  .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
  .replace(/\[ADVENTURE_COMPLETE\]/g, "")
  .replace(/\[GAME_OVER\]/g, "")
  .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
```

### 6.4 HALT Conditions (GameService)

These signals trigger HALT-level state changes that block further actions on the adventure:

| Signal | HALT Condition | GameService Action |
|--------|---------------|-------------------|
| `ADVENTURE_COMPLETE` | Adventure status → `completed` | `completeAdventure(adventureId, isGameOver: false)` — no further actions accepted |
| `GAME_OVER` | Adventure status → `completed` | `completeAdventure(adventureId, isGameOver: true)` — no further actions accepted |

> **SIG-002:** After `completeAdventure()`, `processAction()` will return a 400 error (`ADVENTURE_NOT_ACTIVE`) for any subsequent action attempt. This is enforced at the start of the turn orchestration (step 1 in §1.3).

### 6.5 Signal Format Contract

| Rule ID | Rule |
|---------|------|
| **SIG-004** | Signals MUST appear on their own line in the LLM response. A signal embedded mid-sentence (e.g., `"...et [HP_CHANGE:-5] tu perds..."`) is NOT a valid signal and MUST be ignored by the parser. |
| **SIG-005** | The system prompt instructs the Chroniqueur to always emit signals on a dedicated line, separated from narrative text by a blank line. This is enforced both by instruction (input) and by anchored regex (parsing). |
| **SIG-006** | Signal parsing regex MUST use line-boundary anchors: `/^\\[SIGNAL_PATTERN\\]$/gm` (multiline flag, `^` and `$` match line start/end). |

**Rationale (ADR-001):** See §12 for the full format decision record.

### 6.6 Malformed Signal Handling

| Malformation | Behavior |
|-------------|---------|
| `[MILESTONE_COMPLETE:]` (empty name) | Ignored — regex requires at least 1 character in capture group |
| `[HP_CHANGE:abc]` (non-numeric) | Ignored — regex requires `[+-]?\d+` |
| `[HP_CHANGE:+999]` (absurd value) | SQL clamp handles it — `currentHp` capped to `[0, maxHp]` |
| Multiple `HP_CHANGE` in same response | All values are **summed**, applied in a single SQL clamp operation — e.g., `[HP_CHANGE:-10][HP_CHANGE:-5]` = −15 total (OQ-004 resolved, see HP-006) |
| Signal split across chunks | Non-issue — signals parsed on `fullResponse` (post-stream accumulation), never on chunks |
| Missing `[/CHOIX]` closing tag | `CHOIX` regex uses lazy match `[\s\S]*?` — if no closing tag, no match (no choices extracted) |
| Signal embedded mid-sentence | Ignored — **SIG-004**: signals are only parsed when they appear on their own line (see §6.6) |

> **SIG-003:** Multiple `[HP_CHANGE]` in one response are cumulative (OQ-004 resolved). See HP-006 in §8.1.

---

## 7. Milestone Management

### 7.1 State Machine

```
pending ──────────────────────────► (never directly — always via active)

active ──── [MILESTONE_COMPLETE:nom] ──► completed
   ▲                                        │
   │                                        │ → next pending milestone becomes active
   │                                        │
   └── (first milestone set on init) ───────┘
```

**Formal states:**

| State | Description | DB Fields Set |
|-------|-------------|--------------|
| `pending` | Not yet reached | `startedAt: null`, `completedAt: null` |
| `active` | Currently in progress (exactly 1 at a time) | `startedAt: timestamp`, `completedAt: null` |
| `completed` | Narrative objective reached | `startedAt: timestamp`, `completedAt: timestamp` |

### 7.2 State Transitions

| Transition | Trigger | Actors | DB Operation |
|-----------|---------|--------|-------------|
| `pending → active` (first) | `initializeMilestones()` called (or adventure creation) | `GameService` | `status="active"`, `startedAt=now()` on first milestone; all others `status="pending"` |
| `active → completed` + `pending → active` | LLM emits `[MILESTONE_COMPLETE:nom]` | `GameService.transitionMilestone()` | UPDATE completed: `status="completed"`, `completedAt=now()` UPDATE next: `status="active"`, `startedAt=now()` — single DB transaction |
| `active → completed` (last milestone) | LLM emits `[MILESTONE_COMPLETE:nom]` when it is the last | `GameService.transitionMilestone()` | UPDATE completed only (no next); adventure ends via `ADVENTURE_COMPLETE` or `GAME_OVER` signal |

> **MS-001:** Milestone transitions are ALWAYS triggered by LLM signal — never by direct player or server action.
> **MS-002:** `transitionMilestone(completedId, nextId?)` runs as a single DB transaction.
> **MS-003:** `Message.milestoneId` is set to the ACTIVE milestone's ID at the time of message insertion. Messages inserted before any milestone is active have `milestoneId: null`.

### 7.3 Milestone Initialization

`GameService.initializeMilestones(adventure)` is called by `getState()` when `milestones.length === 0`:

1. Call `LLMService.generateResponse()` (non-streaming) with `MILESTONE_INIT_PROMPT`
2. Validate response with `MilestoneInitResponseSchema` (Zod)
3. Insert milestones with `sortOrder` 0-indexed, first milestone `status: "active"`
4. **Fallback** (LLM failure after 1 retry): insert 3 generic placeholders — never block player from entering session

**Milestone count by duration:**

| estimatedDuration | Milestone Count |
|-------------------|----------------|
| `short` | 2–3 |
| `medium` | 4–5 |
| `long` | 6+ |

**Fallback milestones (hardcoded):**
```
{ name: "Prologue", description: "Le début de l'aventure — mise en place du contexte et des enjeux." }
{ name: "Le Cœur de l'Aventure", description: "Le développement central — obstacles et révélations." }
{ name: "Épilogue", description: "La résolution finale — climax et conclusion de l'histoire." }
```

### 7.4 Impact on Context Window

The active milestone's name and description are always present in the context window (§5.2). This is how the GM "knows" the current narrative objective. If `currentMilestone` is null (all completed, adventure ending), inject the null-state message specified in CW-002.

---

## 8. HP and Game Over

### 8.1 HP Mechanics

| Rule ID | Rule |
|---------|------|
| **HP-001** | `currentHp` is clamped to `[0, maxHp]` at all times — SQL: `GREATEST(0, LEAST(max_hp, current_hp + {hpChange}))` |
| **HP-002** | HP changes are triggered ONLY by LLM signal `[HP_CHANGE:x]` — GameService never changes HP proactively |
| **HP-003** | `currentHp` and `maxHp` are visible to the player in the CharacterPanel (P1) — GDD GD-006 |
| **HP-004** | Default `maxHp` and `currentHp` at adventure creation — variable by difficulty (OQ-001 resolved): Easy=150, Normal=100, Hard=75, Nightmare=50 |
| **HP-005** | `AdventureCharacterDTO.currentHp` and `maxHp` are exposed in `GameStateDTO` and `game:state-update` events |
| **HP-006** | Multiple `[HP_CHANGE]` in one response: values are **summed** (not sequential), applied in a single SQL clamp operation (OQ-004 resolved) |

### 8.2 Game Over Conditions by Difficulty

| Difficulty | HP = 0 | Catastrophic Narrative Choice |
|-----------|--------|-------------------------------|
| `easy` | Narrative automatic rescue (no HP signal should trigger death) | GM softens consequences, offers second chance |
| `normal` | Narrative rescue with consequence (item loss, narrative injury) | Real consequences but surmountable |
| `hard` | **Critical choice visible ⚠️** — GM narrates imminent danger + proposes 1-2 special choices (styled distinctly in UI). One turn only. If that turn results in failure/critical_failure → `[GAME_OVER]` | No second chance, consequences are heavy |
| `nightmare` | Immediate `[GAME_OVER]` | Irreversible consequences |

**Hard difficulty — "last chance" mechanic detail (OQ-003 resolved):**
- The GM narrates the near-death situation (e.g., "Vous tombez, mais votre main s'accroche à une corniche...")
- Proposes 1–2 choices marked with `[DERNIER_CHANCE]` signal prefix in the `[CHOIX]` block (UI renders these with ⚠️ styling)
- The next turn is processed normally through D20; on `failure` or `critical_failure` outcome → GM emits `[GAME_OVER]`
- On `success`, `partial_success`, or `critical_success` → adventure continues normally

> **Future evolution (OQ-003 note):** The death mechanic will be revised in a later phase to allow death at any difficulty (much harder to reach at Easy/Normal). Multiplayer will introduce D&D-style death saving throws (player rolls dice each turn to stabilize). These are explicitly P2+/multi scope — do NOT anticipate in P1.

> **HP-007 (formerly HP-006):** In Easy and Normal, the GM system prompt instructs the LLM to NEVER send `[GAME_OVER]`. A `[GAME_OVER]` received on Easy/Normal is treated as a GameService error (log warning, process as `ADVENTURE_COMPLETE` instead — P1 edge case handling).

### 8.3 Adventure Status at End

| End Type | Trigger | DB Status | Narrative Tone | Screen |
|---------|---------|-----------|----------------|--------|
| **Succès** | `[ADVENTURE_COMPLETE]` | `completed` | Epic, triumphant | E11 success state |
| **Game Over** | `[GAME_OVER]` | `completed` | Solemn, epic (never humiliating) — "Votre quête s'achève ici, mais votre légende ne fait que commencer..." | E11 game over state |
| **Abandon** | Player action (menu → quit) | `abandoned` | N/A — no end screen | Hub return (no E11) |

> **HP-007:** Both success (`ADVENTURE_COMPLETE`) and game over (`GAME_OVER`) result in `status: "completed"`. The distinction is preserved in `Message.metadata` (`isGameOver` flag via `game:state-update { type: "game_over" }`) and used by E11 to render the appropriate tone.

### 8.4 HP Deduction Guidelines for the GM

The GM prompt does not specify exact HP values to deduct — this is left to the LLM's narrative judgment based on:
- Severity of the outcome (critical_failure → larger deduction; partial_success → small deduction)
- Difficulty level (hard/nightmare → more punishing)
- Narrative context (combat → HP loss likely; exploration → HP loss rare)

> **HP-OQ:** See OQ-001 for the open question on default HP values and deduction scale.

---

## 9. Suggested Choices — Generation Rules

### 9.1 Format

The `[CHOIX]...[/CHOIX]` block is extracted by `parseSignals()` and parsed into `SuggestedAction[]`:

```
[CHOIX]
1. {choice label — 5 to 15 words}
2. {choice label — 5 to 15 words}
3. {choice label — 5 to 15 words}
[/CHOIX]
```

**Parsing logic:**
```typescript
const lines = choicesMatch[1].trim().split("\n").filter(Boolean);
signals.choices = lines.map((line, i) => ({
  id: `choice-${Date.now()}-${i}`,
  label: line.replace(/^\d+\.\s*/, "").trim(),
  type: "suggested" as const,
}));
```

### 9.2 Choice Rules

| Rule ID | Rule | Description |
|---------|------|-------------|
| **CH-001** | Count: 2–4 choices per turn | Never 1 (removes player agency), never 5+ (choice overload) — ID = index string `"0"`, `"1"`, `"2"`, `"3"` (OQ-005 resolved) |
| **CH-002** | Approach diversity | Each choice represents a different approach: combat, diplomacy, exploration, flight, cunning — no two choices target the same approach |
| **CH-003** | No obviously correct choice | All choices are viable — no trap disguised as an option, no clearly superior choice |
| **CH-004** | No repetition | A choice already proposed and ignored does not reappear identically next turn |
| **CH-005** | 5–15 words per choice | Enough to understand, not enough to replace imagination |
| **CH-006** | Free text always available | The `[CHOIX]` block supplements but never replaces free text input — the player can always type a custom action |
| **CH-007** | Choices appear after streaming completes | The `ChoiceList` component renders only after `game:response-complete` is received — never during streaming |

### 9.3 Free Text Interaction

The GM must:
- Accept any reasonable action in context (interpret vague actions charitably: "je regarde autour" → environment description)
- Redirect impossible/absurd actions diplomatically (never "vous ne pouvez pas faire ça" without alternative)
- Never execute actions that break the narrative universe (modern technology in medieval setting)
- Never trivialize the adventure ("je tue le boss final avec mes yeux laser")

---

## 10. Implementation Constraints for Dev Agent

These decisions have been made and MUST NOT be revisited without explicit PM + Architect validation.

### 10.1 Technical Architecture — NEVER / ALWAYS

| ID | Constraint | Rule |
|----|-----------|------|
| **IC-001** | D20 computation | **ALWAYS** server-side in `D20Service`. **NEVER** client-side. |
| **IC-002** | D20 visibility | **NEVER** expose `roll`, `dc`, `bonus` to frontend in P1. Store in `Message.metadata` only. |
| **IC-003** | LLM SDK | **ALWAYS** use TanStack AI (`@tanstack/ai`) + adapters. **NEVER** use Vercel AI SDK, OpenAI SDK, or Anthropic SDK directly. |
| **IC-004** | LLM abstraction | **ALWAYS** interact with LLM via `ILLMProvider` interface. `GameService` NEVER calls TanStack AI directly. |
| **IC-005** | Transport | **ALWAYS** WebSocket via Socket.io for streaming. **NEVER** SSE (Server-Sent Events). |
| **IC-006** | Signal stripping | **ALWAYS** strip signals server-side before emitting `game:response-complete.cleanText`. **NEVER** rely on the client to strip signals. |
| **IC-007** | ActionType classification | P1: **ALWAYS** use keyword heuristic in `GameService.classifyAction()`. **NEVER** make a separate LLM call for action classification in P1. |
| **IC-008** | Milestone position | **NEVER** expose milestone position/total (e.g., "2/4") to the frontend. Only milestone names and statuses. |
| **IC-009** | `narrativeContext` | P1: `narrativeContext` (formerly `worldState`) passed to LLM in `GameContext` is **ALWAYS** an empty object `{}`. Distinct from `Adventure.state` (DB auto-save snapshot). P2 will populate it. |
| **IC-010** | Signal parsing timing | **ALWAYS** parse signals on `fullResponse` (after stream completes), **NEVER** chunk-by-chunk. |
| **IC-011** | Streaming protocol | The client receives raw chunks via `game:chunk`, then replaces the buffer with `cleanText` on `game:response-complete`. **NEVER** parse signals client-side. |
| **IC-012** | Difficulty lock | Difficulty is **ALWAYS** locked at adventure creation. **NEVER** allow mid-session difficulty change. |
| **IC-013** | Milestone transitions | **ALWAYS** triggered by LLM signal. **NEVER** triggered by player action or timer. |
| **IC-014** | HP changes | **ALWAYS** triggered by LLM signal `[HP_CHANGE:x]`. **NEVER** modified by GameService directly (except SQL clamp on value). |
| **IC-015** | Max history | Context window history is **ALWAYS** capped at `MAX_HISTORY_MESSAGES = 20`. |

### 10.2 Scope Boundaries — P2/P3 Items

These features are explicitly OUT OF SCOPE for P1 and must not be implemented:

| Feature | Phase | Reference |
|---------|-------|-----------|
| Visible dice (player sees D20 roll) | P2 | GDD GD-001, `Message.metadata` already stores roll for this |
| Character stats (Strength/Agility/Charisma/Karma) replacing implicit bonuses | P2 | GDD §3.3 |
| Advantage/disadvantage (2D20) | P2 | GDD §3.6 |
| LLM ActionType classification | P2 | Replaces P1 keyword heuristic |
| Inventory system | P2+ | GDD GD-007; `inventory` JSONB stays empty `{}` in P1 |
| Tone customization (serious ↔ humorous, concise ↔ descriptive) | P2 | GDD §4.4 |
| Events (fine-grained between milestones) | P2 | GDD §5.4 |
| XP/Achievements/Rewards (functional) | P2 | GDD §8.2 |
| worldState compression | P2 | CW-005 |
| Multiplayer (concurrent turns) | P3 | GDD §3.6 |
| Companion/mascot | P3 | MEMORY.md |

---

## 11. Resolved Decisions (formerly Open Questions)

All questions have been resolved by PM (2026-03-09). No open questions remain for stories 6.3–6.8.

| ID | Question | Decision | Impact |
|----|----------|---------|--------|
| **OQ-001** | Default `maxHp`/`currentHp` at adventure creation | Variable by difficulty: Easy=150, Normal=100, Hard=75, Nightmare=50 | §8.1 HP-004, Story 6.3a DB insert |
| **OQ-002** | HP deduction scale per outcome | % of maxHp per outcome × difficulty — see §3.6b table | §3.6b, Story 6.3a D20 injection block |
| **OQ-003** | Hard "last chance" mechanic | Critical choice visible ⚠️ — 1 special turn, then GAME_OVER on failure. Future: death saving throws for multiplayer only | §8.2, Story 6.3a signal processing |
| **OQ-004** | Multiple `[HP_CHANGE]` in one response | Cumulative sum, single SQL operation | §6.5, Story 6.3a parseSignals |
| **OQ-005** | Choice IDs | Index string: `"0"`, `"1"`, `"2"`, `"3"` | §9.1, Story 6.4 ChoiceList |
| **OQ-006** | `worldState` vs `Adventure.state` naming | Rename `worldState` → `narrativeContext` in `GameContext`. Two distinct objects. | §5.3 CW-005, §10.1 IC-009, Story 6.3a |
| **OQ-007** | Context truncation for long sessions | 20-message limit documented as known limitation + static adventure summary added to context window (§5.1 message #2). Beta validation required. | §5.1, §5.3, Stories 6.3a/6.3b |
| **OQ-008** | "Commencer l'aventure" auto-start message | `role: "system"` — invisible in HistoryDrawer natively, no additional filter needed | Story 6.6 IntroSession |

---

## 12. Architecture Decision Records

### ADR-001 — LLM Signal Format: Bracket Notation vs XML Tags

**Date:** 2026-03-09
**Status:** Accepted
**Authors:** John (PM) + Winston (Architect)

#### Context

The system requires a structured format for signals emitted by the LLM (Le Chroniqueur) that the server can parse reliably. Two candidate formats were evaluated:

- **Option A — Bracket notation** `[SIGNAL_NAME:value]` — already implemented in Story 6.2
- **Option B — XML tags** `<signal type="SIGNAL_NAME" value="x"/>` — recommended by Anthropic for structuring Claude prompts

#### Decision

**Adopt bracket notation with line-boundary constraints (Option A + SIG-004).**

#### Rationale

| Criterion | Bracket `[TAG]` | XML `<TAG>` |
|---|---|---|
| Migration cost | Zero — already implemented in Story 6.2 (review) | High — rewrite PromptBuilder, parseSignals, all tests |
| Collision risk (mid-sentence) | Eliminated by SIG-004 line-anchor constraint | Very low natively |
| Multi-provider compatibility | ✅ OpenAI + Anthropic | ✅ OpenAI + Anthropic |
| Parsing simplicity | Simple anchored regex | Simple regex |
| Anthropic XML recommendation | Applies to **input** structure, not output signals | Recommended for input prompt structure |
| Natural text collision probability | `[HP_CHANGE:-10]` in French heroic fantasy narrative: < 0.1% | `<signal type="HP_CHANGE" value="-10"/>` in narrative: < 0.01% |

**Key insight:** The Anthropic recommendation for XML tags targets the structure of prompts *sent to* the model. For signals *emitted by* the model, neither format has a meaningful advantage once line-boundary anchoring is applied.

The bracket format was already defined and implemented in Story 6.2. Switching at this stage would introduce rework with no tangible gain for P1.

#### Mitigation

The collision risk is managed by **SIG-004**: signals must appear on their own line. The system prompt (§4 Section 5) instructs the LLM explicitly. The regex parser enforces it with `^...$` multiline anchors.

#### Consequences

- `parseSignals()` in `GameService` uses `/^\\[PATTERN\\]$/gm` regex (see §6.1)
- Any future new signal follows the same bracket format on its own line
- P2 note: if collision issues arise in production, migration to XML tags is straightforward (regex swap + system prompt update — no DB change required)

---

**Document generated by John (PM) + Winston (Architect) — BMAD Method**
**v1.2 — Signal format validated, SIG-004/005/006 added, ADR-001 created (2026-03-09)**
**Cross-references:** `docs/game-design.md`, `docs/architecture/backend.md`, `docs/architecture/data-models.md`
**Referenced by:** Dev Notes of Stories 6.3a, 6.3b, 6.4, 6.5, 6.6, 6.7, 6.8 as "MJ IA System Spec"
