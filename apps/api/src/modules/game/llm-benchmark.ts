/**
 * LLM Benchmark — compare models on signal compliance, narrative quality and cost.
 *
 * Run from apps/api/ directory:
 *   pnpm benchmark
 *   pnpm benchmark anthropic:claude-haiku-4-5 openai:gpt-4o-mini
 *   pnpm benchmark --verbose openrouter:openai/gpt-oss-120b:free
 *   pnpm benchmark --delay=3 openrouter:openai/gpt-oss-120b:free   (custom delay in seconds)
 *
 * Models specified as "provider:model" pairs:
 *   anthropic:claude-haiku-4-5
 *   openai:gpt-4o-mini
 *   openrouter:mistralai/mistral-small-3.1
 *   openrouter:openai/gpt-oss-120b:free   (free tier — auto 5s delay + 1 retry)
 *
 * Free tier notes:
 *   Models ending in ":free" get a 5s inter-scenario delay and 1 auto-retry by default.
 *   Override with --delay=N (seconds). Use --delay=0 to disable.
 *
 * Results are saved automatically to apps/api/benchmarks/ after each run.
 * Use --no-save to skip persistence.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import fs from "node:fs";
import path from "node:path";

import type { AdventureCharacterDTO, Difficulty, MilestoneDTO } from "@jdrai/shared";
import type { ActionType, D20Outcome } from "@jdrai/shared";

import { TanStackAIProvider } from "./llm/tanstack-ai.provider";
import { PromptBuilder } from "./prompt-builder";

// ---------------------------------------------------------------------------
// Cost table — USD per million tokens (approximate 2025 pricing)
// Add any new model here to get cost estimates in the summary.
// ---------------------------------------------------------------------------

const COST_PER_M: Record<string, { input: number; output: number }> = {
  "anthropic:claude-haiku-4-5": { input: 0.8, output: 4.0 },
  "anthropic:claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "openai:gpt-4o-mini": { input: 0.15, output: 0.6 },
  "openai:gpt-4o": { input: 2.5, output: 10.0 },
  "openrouter:mistralai/mistral-small-3.1": { input: 0.1, output: 0.3 },
  "openrouter:google/gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "openrouter:openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
  // Free tier — $0 but subject to rate limits; delay is applied automatically
  "openrouter:openai/gpt-oss-120b:free": { input: 0.0, output: 0.0 },
  "openrouter:openai/gpt-oss-20b:free": { input: 0.0, output: 0.0 },
  "openrouter:meta-llama/llama-3.3-70b-instruct:free": { input: 0.0, output: 0.0 },
};

// Default models attempted when no CLI args are given.
// Only those with a configured API key will actually run.
const DEFAULT_MODELS = [
  "anthropic:claude-haiku-4-5",
  "openai:gpt-4o-mini",
  "openrouter:mistralai/mistral-small-3.1",
  "openrouter:openai/gpt-oss-120b:free",
];

const API_KEY_ENV: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

// ---------------------------------------------------------------------------
// Compliance checks
// ---------------------------------------------------------------------------

/** Words/phrases the LLM must NEVER emit (4th wall or game mechanic leakage). */
const FORBIDDEN_MECHANICS_RE =
  /jet de dé|points de vie|score de|l'interface|tu peux cliquer|dans ce jeu|\bXP\b/i;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CHARACTER: AdventureCharacterDTO = {
  id: "bench",
  name: "Aelric",
  className: "Aventurier",
  raceName: "Humain",
  stats: { strength: 12, agility: 10, charisma: 8, karma: 10 },
  currentHp: 15,
  maxHp: 20,
};

const CHARACTER_LOW_HP: AdventureCharacterDTO = { ...CHARACTER, currentHp: 2 };

const MILESTONES_MID: MilestoneDTO[] = [
  {
    id: "m1",
    name: "L'Éveil",
    sortOrder: 0,
    status: "completed",
    description: "Le début de l'aventure.",
  },
  {
    id: "m2",
    name: "La Traversée",
    sortOrder: 1,
    status: "active",
    description: "Traverser la forêt maudite et atteindre le vieux fort.",
  },
  {
    id: "m3",
    name: "L'Affrontement Final",
    sortOrder: 2,
    status: "pending",
    description: "Vaincre le seigneur des ombres.",
  },
];

const MILESTONES_END: MilestoneDTO[] = [
  { id: "m1", name: "L'Éveil", sortOrder: 0, status: "completed" },
  { id: "m2", name: "La Traversée", sortOrder: 1, status: "completed" },
  {
    id: "m3",
    name: "L'Affrontement Final",
    sortOrder: 2,
    status: "active",
    description: "Vaincre le seigneur des ombres. Le boss est à genoux, la victoire est imminente.",
  },
];

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

interface MockD20Result {
  roll: number;
  actionType: ActionType;
  difficulty: Difficulty;
  baseDC: number;
  difficultyModifier: number;
  finalDC: number;
  characterBonus: number;
  totalScore: number;
  outcome: D20Outcome;
}

interface ExpectedSignals {
  choices: boolean;
  hpChange?: boolean;
  milestoneComplete?: boolean;
  gameOver?: boolean;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  character: AdventureCharacterDTO;
  milestones: MilestoneDTO[];
  history: Array<{ role: string; content: string }>;
  playerAction: string;
  injection: "narrative" | "trivial" | "d20";
  d20?: MockD20Result;
  expected: ExpectedSignals;
}

const SCENARIOS: Scenario[] = [
  // ── 1. Début d'aventure ────────────────────────────────────────────────────
  {
    id: "intro",
    name: "Début d'aventure",
    description: "Narration d'ouverture, aucun historique — vérifie [CHOIX] + longueur",
    difficulty: "normal",
    character: CHARACTER,
    milestones: MILESTONES_MID,
    history: [],
    playerAction: "Commencer l'aventure",
    injection: "narrative",
    expected: { choices: true },
  },

  // ── 2. Dialogue — succès net ───────────────────────────────────────────────
  {
    id: "dialogue",
    name: "Dialogue — succès net",
    description: "D20 roll 15 vs DC 8 — vérifie [CHOIX] + absence de mécaniques",
    difficulty: "normal",
    character: CHARACTER,
    milestones: MILESTONES_MID,
    history: [
      {
        role: "assistant",
        content:
          "La forêt s'étend devant toi. Un vieux mage t'observe depuis le seuil d'une cahute.\n\n[CHOIX]\n1. Parler au mage\n2. Contourner discrètement\n[/CHOIX]",
      },
      { role: "user", content: "Je parle au mage pour obtenir des informations sur la forêt" },
    ],
    playerAction: "Je parle au mage pour obtenir des informations sur la forêt",
    injection: "d20",
    d20: {
      roll: 15,
      actionType: "easy",
      difficulty: "normal",
      baseDC: 8,
      difficultyModifier: 0,
      finalDC: 8,
      characterBonus: 0,
      totalScore: 15,
      outcome: "success",
    },
    expected: { choices: true },
  },

  // ── 3. Combat — échec critique ─────────────────────────────────────────────
  {
    id: "combat_failure",
    name: "Combat — échec critique",
    description: "D20 nat1 vs DC 15 — vérifie [HP_CHANGE] + [CHOIX]",
    difficulty: "normal",
    character: CHARACTER,
    milestones: MILESTONES_MID,
    history: [
      {
        role: "assistant",
        content:
          "Un garde corrompu te barre la route, épée levée.\n\n[CHOIX]\n1. Attaquer de front\n2. Esquiver et contre-attaquer\n[/CHOIX]",
      },
      { role: "user", content: "J'attaque le garde avec mon épée" },
    ],
    playerAction: "J'attaque le garde avec mon épée",
    injection: "d20",
    d20: {
      roll: 1,
      actionType: "hard",
      difficulty: "normal",
      baseDC: 15,
      difficultyModifier: 0,
      finalDC: 15,
      characterBonus: 2,
      totalScore: 3,
      outcome: "critical_failure",
    },
    expected: { choices: true, hpChange: true },
  },

  // ── 4. Action triviale ─────────────────────────────────────────────────────
  {
    id: "trivial",
    name: "Action triviale",
    description: "Succès automatique — vérifie réponse courte + [CHOIX]",
    difficulty: "normal",
    character: CHARACTER,
    milestones: MILESTONES_MID,
    history: [
      {
        role: "assistant",
        content:
          "Tu arrives devant les portes du fort. La porte de bois n'est pas verrouillée.\n\n[CHOIX]\n1. Ouvrir la porte\n2. Inspecter la porte avant d'entrer\n[/CHOIX]",
      },
      { role: "user", content: "J'ouvre la porte" },
    ],
    playerAction: "J'ouvre la porte",
    injection: "trivial",
    expected: { choices: true },
  },

  // ── 5. Fin de milestone ────────────────────────────────────────────────────
  {
    id: "milestone_complete",
    name: "Fin de milestone",
    description: "Contexte de résolution d'objectif — vérifie [MILESTONE_COMPLETE:x]",
    difficulty: "normal",
    character: CHARACTER,
    milestones: MILESTONES_MID,
    history: [
      {
        role: "assistant",
        content:
          "Le dernier gardien de la forêt s'effondre. Les tours du fort sont visibles au loin.\n\n[CHOIX]\n1. Avancer vers le fort\n2. Se reposer d'abord\n[/CHOIX]",
      },
      { role: "user", content: "J'avance vers le fort — j'ai traversé toute la forêt" },
    ],
    playerAction: "J'avance vers le fort — j'ai traversé toute la forêt",
    injection: "narrative",
    expected: { choices: true, milestoneComplete: true },
  },

  // ── 6. Game Over — nightmare ───────────────────────────────────────────────
  {
    id: "game_over",
    name: "Game Over — nightmare",
    description: "PV critiques (2/20), nat1 vs boss — vérifie [GAME_OVER]",
    difficulty: "nightmare",
    character: CHARACTER_LOW_HP,
    milestones: MILESTONES_END,
    history: [
      {
        role: "assistant",
        content:
          "Le seigneur des ombres te domine. Tu n'as presque plus de forces.\n\n[CHOIX]\n1. Dernier assaut désespéré\n2. Fuir coûte que coûte\n[/CHOIX]",
      },
      { role: "user", content: "Je charge le seigneur des ombres de toutes mes forces restantes" },
    ],
    playerAction: "Je charge le seigneur des ombres de toutes mes forces restantes",
    injection: "d20",
    d20: {
      roll: 1,
      actionType: "very_hard",
      difficulty: "nightmare",
      baseDC: 18,
      difficultyModifier: 4,
      finalDC: 22,
      characterBonus: 2,
      totalScore: 3,
      outcome: "critical_failure",
    },
    expected: { choices: false, gameOver: true },
  },
];

// ---------------------------------------------------------------------------
// Signal parsing (inlined to avoid importing DB-heavy game.service)
// ---------------------------------------------------------------------------

interface ParsedResult {
  cleanText: string;
  hasChoices: boolean;
  hpChange: number | undefined;
  milestoneCompleted: string | undefined;
  isGameOver: boolean;
}

function parseSignalsLocal(raw: string): ParsedResult {
  const hasChoices = /\[CHOIX\][\s\S]*?\[\/CHOIX\]/.test(raw);
  const hpMatch = /\[HP_CHANGE:([+-]?\d+)\]/.exec(raw);
  const msMatch = /\[MILESTONE_COMPLETE:([^\]]+)\]/.exec(raw);

  const cleanText = raw
    .replace(/\[MILESTONE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[HP_CHANGE:[+-]?\d+\]/g, "")
    .replace(/\[ADVENTURE_COMPLETE\]/g, "")
    .replace(/\[GAME_OVER\]/g, "")
    .replace(/\[CHOIX\][\s\S]*?\[\/CHOIX\]/g, "")
    .replace(/\[SHOW_PRESET_SELECTOR:[^\]]+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    cleanText,
    hasChoices,
    hpChange: hpMatch ? parseInt(hpMatch[1]!, 10) : undefined,
    milestoneCompleted: msMatch ? msMatch[1]!.trim() : undefined,
    isGameOver: /\[GAME_OVER\]/.test(raw),
  };
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  ok: boolean;
  error?: string | undefined;
  durationMs: number;
  rawResponse: string;
  parsed: ParsedResult;
  paragraphCount: number;
  inputTokenEst: number;
  outputTokenEst: number;
  costUsd: number;
  // Compliance (each criterion = 1 point, max 4)
  choicesOk: boolean; // [CHOIX] present when expected
  signalsOk: boolean; // scenario-specific signals emitted
  paragraphsOk: boolean; // clean text ≤ 3 paragraphs
  noMechanics: boolean; // no 4th wall / mechanic mention
  complianceScore: number; // 0–4
}

// ---------------------------------------------------------------------------
// Run one scenario against one provider
// ---------------------------------------------------------------------------

async function runScenario(
  scenario: Scenario,
  provider: TanStackAIProvider,
  modelKey: string,
  pb: PromptBuilder,
): Promise<ScenarioResult> {
  const systemPrompt = pb.buildSystemPrompt({ difficulty: scenario.difficulty });

  let d20Block: string;
  if (scenario.injection === "narrative") {
    d20Block = pb.buildSimpleInjectionBlock("narrative", scenario.playerAction);
  } else if (scenario.injection === "trivial") {
    d20Block = pb.buildSimpleInjectionBlock("trivial", scenario.playerAction);
  } else {
    d20Block = pb.buildD20InjectionBlock(scenario.d20!, scenario.playerAction);
  }

  const activeMilestone = scenario.milestones.find((m) => m.status === "active") ?? null;
  const contextWindow = pb.buildContextWindow({
    systemPrompt,
    d20Block,
    playerAction: scenario.playerAction,
    context: {
      character: scenario.character,
      milestones: scenario.milestones,
      currentMilestone: activeMilestone,
      recentHistory: scenario.history,
      worldState: {},
    },
  });

  const combinedSystem = contextWindow
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const conversationMessages = contextWindow.filter((m) => m.role !== "system");

  const start = Date.now();
  let rawResponse = "";
  let error: string | undefined;

  try {
    for await (const chunk of provider.streamResponse({
      systemPrompt: combinedSystem,
      messages: conversationMessages,
    })) {
      rawResponse += chunk;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - start;
  const parsed = parseSignalsLocal(rawResponse);
  const paragraphCount = parsed.cleanText.split(/\n\n+/).filter((p) => p.trim()).length;

  // Token estimation: ~4 chars per token for French prose
  const inputCharCount =
    combinedSystem.length + conversationMessages.reduce((s, m) => s + m.content.length, 0);
  const inputTokenEst = Math.round(inputCharCount / 4);
  const outputTokenEst = Math.round(rawResponse.length / 4);

  const pricing = COST_PER_M[modelKey];
  const costUsd = pricing
    ? (inputTokenEst * pricing.input + outputTokenEst * pricing.output) / 1_000_000
    : 0;

  // Compliance evaluation
  const choicesOk = !scenario.expected.choices || parsed.hasChoices;
  const signalsOk =
    (!scenario.expected.hpChange || parsed.hpChange !== undefined) &&
    (!scenario.expected.milestoneComplete || parsed.milestoneCompleted !== undefined) &&
    (!scenario.expected.gameOver || parsed.isGameOver);
  const paragraphsOk = paragraphCount <= 3;
  const noMechanics = !FORBIDDEN_MECHANICS_RE.test(parsed.cleanText);
  const complianceScore = [choicesOk, signalsOk, paragraphsOk, noMechanics].filter(Boolean).length;

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    ok: !error && rawResponse.length > 0,
    error,
    durationMs,
    rawResponse,
    parsed,
    paragraphCount,
    inputTokenEst,
    outputTokenEst,
    costUsd,
    choicesOk,
    signalsOk,
    paragraphsOk,
    noMechanics,
    complianceScore,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Terminal helpers
// ---------------------------------------------------------------------------

const R = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

function pad(s: string, n: number): string {
  return s.slice(0, n).padEnd(n);
}

function tick(ok: boolean): string {
  return ok ? `${GREEN}✓${R}` : `${RED}✗${R}`;
}

// ---------------------------------------------------------------------------
// Print per-model per-scenario results
// ---------------------------------------------------------------------------

function printScenarioLine(result: ScenarioResult): void {
  if (!result.ok) {
    console.log(`${RED}ERREUR${R} — ${result.error ?? "réponse vide"}`);
    return;
  }
  const score =
    result.complianceScore >= 3
      ? `${GREEN}${result.complianceScore}/4${R}`
      : result.complianceScore === 2
        ? `${YELLOW}${result.complianceScore}/4${R}`
        : `${RED}${result.complianceScore}/4${R}`;
  const checks = `[CHOIX]:${tick(result.choicesOk)}  signaux:${tick(result.signalsOk)}  §:${tick(result.paragraphsOk)}  méca:${tick(result.noMechanics)}`;
  const meta = `${DIM}${String(result.durationMs).padStart(5)}ms  ${result.paragraphCount}§  ~${result.outputTokenEst}tok${R}`;
  console.log(`${score}   ${checks}   ${meta}`);
}

// ---------------------------------------------------------------------------
// Print aggregate summary table
// ---------------------------------------------------------------------------

function printSummary(allResults: Map<string, ScenarioResult[]>, verbose: boolean): void {
  console.log(`\n${BOLD}${"═".repeat(80)}${R}`);
  console.log(`${BOLD}  RÉSUMÉ${R}`);
  console.log(`${BOLD}${"═".repeat(80)}${R}\n`);

  const colModel = 44;
  const header =
    pad("Modèle", colModel) +
    pad("Compliance", 16) +
    pad("§ moy", 7) +
    pad("Latence", 9) +
    "Coût / 1k req";
  console.log(`${DIM}  ${header}${R}`);
  console.log(`  ${"-".repeat(90)}`);

  for (const [modelKey, results] of allResults) {
    const ok = results.filter((r) => r.ok);
    if (ok.length === 0) {
      console.log(`  ${pad(modelKey, colModel)} ${RED}tous les scénarios ont échoué${R}`);
      continue;
    }

    const avgCompliance = ok.reduce((s, r) => s + r.complianceScore, 0) / ok.length;
    const avgParagraphs = ok.reduce((s, r) => s + r.paragraphCount, 0) / ok.length;
    const avgMs = Math.round(ok.reduce((s, r) => s + r.durationMs, 0) / ok.length);
    const avgCostPer1k = (ok.reduce((s, r) => s + r.costUsd, 0) / ok.length) * 1000;

    const pct = Math.round((avgCompliance / 4) * 100);
    const compClr = pct >= 75 ? GREEN : pct >= 50 ? YELLOW : RED;
    const compStr = `${compClr}${avgCompliance.toFixed(1)}/4 (${pct}%)${R}`;
    // Add padding manually — ANSI codes inflate string length
    const compPad = " ".repeat(Math.max(0, 16 - `${avgCompliance.toFixed(1)}/4 (${pct}%)`.length));
    const costStr =
      COST_PER_M[modelKey] === undefined
        ? `${DIM}(prix inconnu)${R}`
        : avgCostPer1k < 0.0005
          ? `${GREEN}gratuit${R}`
          : `$${avgCostPer1k.toFixed(4)}`;

    console.log(
      `  ${pad(modelKey, colModel)}` +
        `${compStr}${compPad}` +
        `${pad(avgParagraphs.toFixed(1), 7)}` +
        `${pad(`${avgMs}ms`, 9)}` +
        costStr,
    );
  }

  console.log(
    `\n${DIM}  Compliance — 4 critères : [CHOIX] présent · signaux attendus · ≤3 paragraphes · pas de mécaniques${R}`,
  );
  console.log(`${DIM}  Coût estimé : moyenne des scénarios × 1000 interactions${R}`);
  console.log(`${DIM}  Tokens estimés à ~4 chars/token (prose française)${R}\n`);

  if (verbose) printVerboseDetails(allResults);
}

// ---------------------------------------------------------------------------
// Verbose: print full clean responses for manual review
// ---------------------------------------------------------------------------

function printVerboseDetails(allResults: Map<string, ScenarioResult[]>): void {
  console.log(`\n${BOLD}RÉPONSES COMPLÈTES (--verbose)${R}`);
  for (const [modelKey, results] of allResults) {
    console.log(`\n${CYAN}${BOLD}── ${modelKey} ──────────────────────────────${R}`);
    for (const r of results) {
      if (!r.ok) continue;
      console.log(`\n${BOLD}  [${r.scenarioId}] ${r.scenarioName}${R}`);
      console.log(
        `${DIM}  §${r.paragraphCount} · ~${r.inputTokenEst} in / ~${r.outputTokenEst} out · ${r.durationMs}ms${R}`,
      );
      console.log(`  ${"─".repeat(60)}`);
      for (const line of r.parsed.cleanText.split("\n")) {
        console.log(`  ${line}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Persistence — save results to apps/api/benchmarks/
// ---------------------------------------------------------------------------

const BENCHMARKS_DIR = path.resolve(process.cwd(), "benchmarks");

interface BenchmarkRun {
  meta: {
    date: string;
    models: string[];
    scenarioCount: number;
    totalDurationMs: number;
  };
  results: Record<string, ScenarioResult[]>;
}

/** Sanitize a model key to a filesystem-safe slug. */
function modelSlug(key: string): string {
  return key.replace(/[:/]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Returns a filename like "2026-04-24_2240_gpt-oss-120b+haiku" */
function buildRunFilename(models: string[], date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const slug = models.map(modelSlug).join("+").slice(0, 60);
  return `${y}-${mo}-${d}_${h}${mi}_${slug}.json`;
}

function saveRun(run: BenchmarkRun): string {
  fs.mkdirSync(BENCHMARKS_DIR, { recursive: true });

  const filename = buildRunFilename(run.meta.models, new Date(run.meta.date));
  const filepath = path.join(BENCHMARKS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(run, null, 2), "utf8");

  appendHistoryLine(run, filename);
  return filepath;
}

function appendHistoryLine(run: BenchmarkRun, filename: string): void {
  const historyPath = path.join(BENCHMARKS_DIR, "history.md");

  // Create header if file doesn't exist
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(
      historyPath,
      "# Benchmark History\n\n" +
        "| Date | Modèles | Compliance moy | § moy | Latence moy | Coût / 1k | Fichier |\n" +
        "|------|---------|---------------|-------|-------------|-----------|--------|\n",
      "utf8",
    );
  }

  const allOk = Object.values(run.results)
    .flat()
    .filter((r) => r.ok);
  const avgCompliance = allOk.length
    ? allOk.reduce((s, r) => s + r.complianceScore, 0) / allOk.length
    : 0;
  const avgParagraphs = allOk.length
    ? allOk.reduce((s, r) => s + r.paragraphCount, 0) / allOk.length
    : 0;
  const avgMs = allOk.length
    ? Math.round(allOk.reduce((s, r) => s + r.durationMs, 0) / allOk.length)
    : 0;
  const totalCost = allOk.reduce((s, r) => s + r.costUsd, 0);
  const avgCostPer1k = allOk.length ? (totalCost / allOk.length) * 1000 : 0;

  const pct = Math.round((avgCompliance / 4) * 100);
  const costStr = avgCostPer1k < 0.0005 ? "gratuit" : `$${avgCostPer1k.toFixed(4)}`;
  const dateShort = run.meta.date.slice(0, 16).replace("T", " ");
  const modelsStr = run.meta.models.join(", ");

  const line =
    `| ${dateShort} | ${modelsStr} | ${avgCompliance.toFixed(1)}/4 (${pct}%) ` +
    `| ${avgParagraphs.toFixed(1)} | ${avgMs}ms | ${costStr} | [json](${filename}) |\n`;

  fs.appendFileSync(historyPath, line, "utf8");
}

// ---------------------------------------------------------------------------
// Provider parsing + main
// ---------------------------------------------------------------------------

function parseModelKey(
  key: string,
): { provider: "openai" | "anthropic" | "openrouter"; model: string } | null {
  const firstColon = key.indexOf(":");
  if (firstColon === -1) return null;
  const provider = key.slice(0, firstColon);
  const model = key.slice(firstColon + 1);
  if (!["openai", "anthropic", "openrouter"].includes(provider)) return null;
  return { provider: provider as "openai" | "anthropic" | "openrouter", model };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const noSave = args.includes("--no-save");
  const modelArgs = args.filter((a) => !a.startsWith("--"));
  const requestedKeys = modelArgs.length > 0 ? modelArgs : DEFAULT_MODELS;

  // --delay=N overrides the default inter-scenario delay (seconds)
  const delayArg = args.find((a) => a.startsWith("--delay="));
  const explicitDelayMs = delayArg ? parseInt(delayArg.split("=")[1]!, 10) * 1_000 : undefined;

  // Filter models whose API key is not set
  const modelKeys: string[] = [];
  for (const key of requestedKeys) {
    const parsed = parseModelKey(key);
    if (!parsed) {
      console.warn(`${YELLOW}⚠ Clé invalide ignorée : "${key}"${R}`);
      continue;
    }
    const envVar = API_KEY_ENV[parsed.provider]!;
    if (!process.env[envVar]) {
      console.warn(`${YELLOW}⚠ ${envVar} non défini — ignoré : ${key}${R}`);
      continue;
    }
    modelKeys.push(key);
  }

  if (modelKeys.length === 0) {
    console.error(`${RED}Aucun modèle disponible. Vérifiez vos variables d'environnement.${R}`);
    process.exit(1);
  }

  const pb = new PromptBuilder();
  const allResults = new Map<string, ScenarioResult[]>();
  const runStart = Date.now();
  const runDate = new Date();

  console.log(
    `\n${BOLD}JDRAI — LLM Benchmark${R}  ${DIM}${runDate.toLocaleString("fr-FR")}${R}`,
  );
  console.log(`Modèles  : ${modelKeys.join(", ")}`);
  console.log(`Scénarios: ${SCENARIOS.length}\n`);

  for (const modelKey of modelKeys) {
    const parsed = parseModelKey(modelKey)!;
    const provider = new TanStackAIProvider(parsed.provider, parsed.model);
    const results: ScenarioResult[] = [];

    // Free tier models get a 5s inter-scenario delay and 1 auto-retry by default
    const isFree = modelKey.includes(":free");
    const scenarioDelayMs = explicitDelayMs ?? (isFree ? 5_000 : 0);
    const retryDelayMs = isFree ? 15_000 : 0;

    const delayLabel = scenarioDelayMs > 0 ? ` ${DIM}(délai ${scenarioDelayMs / 1000}s)${R}` : "";
    console.log(`${BOLD}${CYAN}▶ ${modelKey}${R}${delayLabel}`);

    for (let i = 0; i < SCENARIOS.length; i++) {
      const scenario = SCENARIOS[i]!;
      if (i > 0 && scenarioDelayMs > 0) await sleep(scenarioDelayMs);

      process.stdout.write(`  ${pad(scenario.name, 30)} … `);
      let result = await runScenario(scenario, provider, modelKey, pb);

      // Single retry on error for free tier models (likely a transient rate limit)
      if (!result.ok && retryDelayMs > 0) {
        process.stdout.write(`${YELLOW}retry dans ${retryDelayMs / 1_000}s…${R} `);
        await sleep(retryDelayMs);
        result = await runScenario(scenario, provider, modelKey, pb);
      }

      results.push(result);
      printScenarioLine(result);
    }

    allResults.set(modelKey, results);
    console.log("");
  }

  printSummary(allResults, verbose);

  if (!noSave) {
    const run: BenchmarkRun = {
      meta: {
        date: runDate.toISOString(),
        models: modelKeys,
        scenarioCount: SCENARIOS.length,
        totalDurationMs: Date.now() - runStart,
      },
      results: Object.fromEntries(allResults),
    };
    const savedPath = saveRun(run);
    console.log(`${DIM}  Résultats sauvegardés : ${path.relative(process.cwd(), savedPath)}${R}`);
    console.log(
      `${DIM}  Historique          : ${path.relative(process.cwd(), path.join(BENCHMARKS_DIR, "history.md"))}${R}\n`,
    );
  }
}

main().catch((err: unknown) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
