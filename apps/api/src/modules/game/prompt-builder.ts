/**
 * PromptBuilder — assembles Le Chroniqueur system prompt, D20 injection block,
 * and the full context window sent to LLMService.
 * Pure business logic: no DB, no LLM, no side effects.
 * GDD §4, §3.4, §6.2, §7.2 / Story 6.2 Task 2
 */
import type { Difficulty, MilestoneDTO } from "@jdrai/shared";

import type { ActionType, D20Outcome, D20Result } from "./d20.service";
import type { ChatMessage } from "./llm/llm.provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemPromptParams {
  difficulty: Difficulty;
}

export interface GameContext {
  milestones: MilestoneDTO[];
  currentMilestone: MilestoneDTO | null;
  /** Raw chat history from DB — last N messages */
  recentHistory: Array<{ role: string; content: string }>;
  /** Optional compressed world state (P1: basic JSON of key facts) */
  worldState?: Record<string, unknown>;
}

export interface ContextWindowParams {
  systemPrompt: string;
  d20Block: string;
  playerAction: string;
  context: GameContext;
}

// ---------------------------------------------------------------------------
// Label maps (French narrative)
// ---------------------------------------------------------------------------

const OUTCOME_LABELS: Record<D20Outcome, string> = {
  critical_success: "SUCCÈS CRITIQUE",
  success: "SUCCÈS NET",
  partial_success: "SUCCÈS PARTIEL",
  failure: "ÉCHEC NARRATIF",
  critical_failure: "ÉCHEC CRITIQUE",
};

const NARRATIVE_INSTRUCTIONS: Record<D20Outcome, string> = {
  critical_success:
    "Narrer une réussite exceptionnelle avec bonus narratif. Ne pas mentionner le dé ni le score.",
  success:
    "Narrer un succès clair et satisfaisant. Ne pas mentionner le dé ni le score.",
  partial_success:
    "Narrer un succès avec une complication narrative. Ne pas mentionner le dé ni le score.",
  failure:
    "Narrer un échec qui ouvre une nouvelle voie (fail forward selon la difficulté). Ne pas mentionner le dé ni le score.",
  critical_failure:
    "Narrer un échec avec conséquences notables. Ne pas mentionner le dé ni le score.",
};

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  trivial: "triviale",
  easy: "facile",
  medium: "moyenne",
  hard: "difficile",
  very_hard: "très difficile",
};

/** Max recent messages included in the context window (P1 limit) */
const MAX_HISTORY_MESSAGES = 20;

// ---------------------------------------------------------------------------
// PromptBuilder
// ---------------------------------------------------------------------------

export class PromptBuilder {
  // -------------------------------------------------------------------------
  // buildSystemPrompt
  // -------------------------------------------------------------------------

  /**
   * Assembles the full Le Chroniqueur system prompt from 4 ordered sections:
   *   1. Invariant persona
   *   2. Tone adapted to difficulty
   *   3. Fail state rules (GD-002)
   *   4. Suggested choices format (GDD §7.2)
   *
   * Note: The [SYSTÈME — INVISIBLE AU JOUEUR] D20 block is NOT included here —
   * it changes per player action and is injected separately via buildD20InjectionBlock.
   */
  buildSystemPrompt(params: SystemPromptParams): string {
    return [
      this.buildPersonaSection(),
      this.buildToneSection(params.difficulty),
      this.buildFailStateSection(params.difficulty),
      this.buildChoicesFormatSection(),
    ].join("\n\n");
  }

  // -------------------------------------------------------------------------
  // buildD20InjectionBlock
  // -------------------------------------------------------------------------

  /**
   * Builds the hidden system block injected before every player action.
   * Contains roll result, DC breakdown, and narrative instruction.
   * Must NOT appear in the system prompt (injected per-turn as a user message).
   * Format from docs/architecture/backend.md §Injection D20 + GDD §3.4
   */
  buildD20InjectionBlock(result: D20Result, playerAction: string): string {
    const outcomeLabel = OUTCOME_LABELS[result.outcome];
    const narrativeInstruction = NARRATIVE_INSTRUCTIONS[result.outcome];
    const actionLabel = ACTION_TYPE_LABELS[result.actionType];
    const bonusSign = result.characterBonus >= 0 ? "+" : "";
    const modSign = result.difficultyModifier >= 0 ? "+" : "";

    return [
      "[SYSTÈME — INVISIBLE AU JOUEUR]",
      `Action du joueur : "${playerAction}"`,
      `Lancer D20 : ${result.roll}`,
      `DC contextuel : ${result.baseDC} (action ${actionLabel}) ${modSign}${result.difficultyModifier} (difficulté ${result.difficulty}) = ${result.finalDC}`,
      `Bonus personnage : ${bonusSign}${result.characterBonus}`,
      `Résultat final : ${result.totalScore} vs DC ${result.finalDC} → ${outcomeLabel}`,
      `Consigne : ${narrativeInstruction}`,
    ].join("\n");
  }

  // -------------------------------------------------------------------------
  // buildContextWindow
  // -------------------------------------------------------------------------

  /**
   * Assembles the full ChatMessage[] array sent to LLMService.
   * Order:
   *   1. System prompt (persona + tone + fail rules + choices format)
   *   2. Milestone context as system message
   *   3. Recent history (up to MAX_HISTORY_MESSAGES)
   *   4. D20 injection + player action as final user message
   */
  buildContextWindow(params: ContextWindowParams): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // 1. System prompt
    messages.push({ role: "system", content: params.systemPrompt });

    // 2. Milestone context
    const milestoneContext = this.buildMilestoneContext(
      params.context.milestones,
      params.context.currentMilestone,
    );
    messages.push({ role: "system", content: milestoneContext });

    // 3. Recent history (capped to MAX_HISTORY_MESSAGES)
    const history = params.context.recentHistory.slice(-MAX_HISTORY_MESSAGES);
    for (const msg of history) {
      const role = msg.role === "assistant" ? "assistant" : "user";
      messages.push({ role, content: msg.content });
    }

    // 4. D20 injection + player action as final user message
    messages.push({
      role: "user",
      content: `${params.d20Block}\n\nAction : ${params.playerAction}`,
    });

    return messages;
  }

  // -------------------------------------------------------------------------
  // compressWorldState
  // -------------------------------------------------------------------------

  /**
   * P1 basic implementation: serialises the worldState to a short JSON string.
   * Future P2 implementations may apply summarization or key-picking heuristics.
   */
  compressWorldState(state: Record<string, unknown>): string {
    return JSON.stringify(state);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildPersonaSection(): string {
    return [
      "Tu es Le Chroniqueur, le Maître du Jeu de cette aventure.",
      "",
      "Ton rôle :",
      "- Tu es un conteur expérimenté, chaleureux et légèrement théâtral",
      "- Tu prends plaisir à raconter des histoires et à voir le joueur réagir",
      "- Tu n'es ni froid, ni robotique — tu es un narrateur vivant",
      "",
      "Règles de narration absolues :",
      "- Tutoie toujours le joueur (2e personne du singulier)",
      "- Utilise le présent de narration",
      "- Ne brise JAMAIS le 4e mur",
      "- Ne mentionne JAMAIS de mécanique de jeu (\"jet de dés\", \"score de...\", \"points de vie...\")",
      "- Varie la longueur de tes réponses : courtes pour l'action, longues pour l'ambiance",
      "- Propose toujours une voie narrative, même dans les impasses",
      "- Ne répète jamais la même situation narrative deux fois de suite",
    ].join("\n");
  }

  private buildToneSection(difficulty: Difficulty): string {
    const tones: Record<Difficulty, string> = {
      easy:
        "Ton style pour cette aventure : Sois encourageant et bienveillant. " +
        "Tes descriptions sont lumineuses. Tu donnes des indices fréquents et explicites. " +
        "Les échecs sont doux et ouvrent immédiatement de nouvelles possibilités.",
      normal:
        "Ton style pour cette aventure : Ton style Chroniqueur standard — " +
        "chaleureux et épique, équilibré entre narration et défi. " +
        "Les échecs ont de vraies conséquences narratives.",
      hard:
        "Ton style pour cette aventure : Sois austère et exigeant. " +
        "Tes descriptions sont plus sombres. Tu donnes des indices seulement quand c'est narrativement justifié. " +
        "Les erreurs coûtent cher.",
      nightmare:
        "Ton style pour cette aventure : Sois menaçant et oppressant. " +
        "Aucun indice gratuit — le joueur doit trouver sa voie seul. " +
        "La mort est une issue possible.",
    };
    return tones[difficulty];
  }

  private buildFailStateSection(difficulty: Difficulty): string {
    const rules: Record<Difficulty, string> = {
      easy:
        "Règle de résolution : Tu dois TOUJOURS trouver une issue narrative à chaque action, " +
        "même en cas d'échec. Le joueur ne peut pas se retrouver dans une impasse permanente. " +
        "Un échec ouvre toujours un nouveau chemin.",
      normal:
        "Règle de résolution : Tu dois TOUJOURS trouver une issue narrative à chaque action, " +
        "même en cas d'échec. Le joueur ne peut pas se retrouver dans une impasse permanente. " +
        "Un échec ouvre toujours un nouveau chemin.",
      hard:
        "Règle de résolution : Les échecs ont de vraies conséquences. " +
        "Si le personnage subit un coup fatal, offre UNE dernière chance narrative (un choix critique). " +
        "Si cette chance échoue aussi, émets le signal [GAME_OVER].",
      nightmare:
        "Règle de résolution : Les échecs sont définitifs. " +
        "Si le personnage tombe, il tombe. Émets le signal [GAME_OVER] sans offrir de seconde chance. " +
        "Narre cette fin de manière épique — jamais humiliante.",
    };
    return rules[difficulty];
  }

  private buildChoicesFormatSection(): string {
    return [
      "Format de réponse obligatoire :",
      "À la fin de chaque narration, propose 2 à 4 actions suggérées au format suivant :",
      "",
      "[CHOIX]",
      "1. [Action courte — 5 à 15 mots — approche différente A]",
      "2. [Action courte — 5 à 15 mots — approche différente B]",
      "3. [Action courte — 5 à 15 mots — approche différente C]",
      "[/CHOIX]",
      "",
      "Règles pour les choix :",
      "- Chaque choix représente une approche différente (combat, diplomatie, exploration, fuite, ruse...)",
      "- Aucun choix n'est clairement supérieur aux autres",
      "- Un choix déjà proposé et ignoré ne revient pas identique",
      "- Le joueur peut toujours ignorer ces choix et saisir sa propre action",
    ].join("\n");
  }

  private buildMilestoneContext(
    milestones: MilestoneDTO[],
    currentMilestone: MilestoneDTO | null,
  ): string {
    const lines = ["Contexte de l'aventure :", "Milestones :"];

    for (const milestone of milestones) {
      const isActive = currentMilestone?.id === milestone.id;
      if (milestone.status === "completed") {
        lines.push(`✓ ${milestone.name} (complété)`);
      } else if (isActive) {
        lines.push(`● ${milestone.name} (en cours) ← actif`);
      } else {
        lines.push(`○ ${milestone.name} (à venir)`);
      }
    }

    if (currentMilestone?.description) {
      lines.push("");
      lines.push(`Objectif narratif du milestone actuel : ${currentMilestone.description}`);
    }

    return lines.join("\n");
  }
}
