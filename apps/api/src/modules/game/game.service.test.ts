/**
 * GameService unit tests (Story 6.3a Task 5)
 * Tests pure logic: classifyAction, parseSignals, computeCharacterBonus.
 * No DB or LLM required.
 */
import { describe, expect, it } from "vitest";

import type { AdventureCharacterDTO } from "@jdrai/shared";

import { classifyAction, computeCharacterBonus, parseSignals } from "./game.service";

// ---------------------------------------------------------------------------
// classifyAction
// ---------------------------------------------------------------------------

describe("classifyAction()", () => {
  it("returns very_hard for magic keywords", () => {
    expect(classifyAction("Je lance un sort sur l'ennemi")).toBe("very_hard");
    expect(classifyAction("J'utilise ma magie pour ouvrir la porte")).toBe("very_hard");
  });

  it("returns hard for combat/intimidation keywords", () => {
    expect(classifyAction("J'attaque le garde")).toBe("hard");
    expect(classifyAction("Je combats le monstre")).toBe("hard");
    expect(classifyAction("J'intimide le marchand")).toBe("hard");
  });

  it("returns narrative for purely narrative actions (Story 6.4b)", () => {
    expect(classifyAction("Je lis la lettre")).toBe("narrative");
    expect(classifyAction("Je regarde autour de moi")).toBe("narrative");
    expect(classifyAction("J'observe la salle")).toBe("narrative");
    expect(classifyAction("J'examine l'inscription")).toBe("narrative");
    expect(classifyAction("J'écoute derrière la porte")).toBe("narrative");
    expect(classifyAction("Je suis le garde")).toBe("narrative");
    expect(classifyAction("Je vais vers la sortie")).toBe("narrative");
    expect(classifyAction("J'avance vers la lumière")).toBe("narrative");
    expect(classifyAction("Il se dirige vers la forêt")).toBe("narrative");
  });

  it("returns easy for social keywords (observe/examine no longer easy)", () => {
    expect(classifyAction("Je parle au barman")).toBe("easy");
    expect(classifyAction("Je discute avec le marchand")).toBe("easy");
    expect(classifyAction("Je négocie un accord")).toBe("easy");
  });

  it("returns trivial for movement keywords", () => {
    expect(classifyAction("Je marche vers la sortie")).toBe("trivial");
    expect(classifyAction("J'ouvre la porte")).toBe("trivial");
  });

  it("returns medium for unrecognised action", () => {
    expect(classifyAction("Je fais quelque chose d'étrange")).toBe("medium");
    expect(classifyAction("")).toBe("medium");
  });
});

// ---------------------------------------------------------------------------
// parseSignals
// ---------------------------------------------------------------------------

describe("parseSignals()", () => {
  it("returns clean text and empty signals when no signals present", () => {
    const { cleanText, signals } = parseSignals("Vous entrez dans la taverne sombre.");
    expect(cleanText).toBe("Vous entrez dans la taverne sombre.");
    expect(signals.adventureComplete).toBe(false);
    expect(signals.isGameOver).toBe(false);
    expect(signals.hpChange).toBeUndefined();
    expect(signals.milestoneCompleted).toBeUndefined();
    expect(signals.choices).toHaveLength(0);
  });

  it("strips [HP_CHANGE:-5] and parses hpChange = -5", () => {
    const { cleanText, signals } = parseSignals("Vous perdez 5 HP.\n[HP_CHANGE:-5]");
    expect(signals.hpChange).toBe(-5);
    expect(cleanText).not.toContain("[HP_CHANGE");
    expect(cleanText).toContain("Vous perdez 5 HP.");
  });

  it("strips [HP_CHANGE:+3] and parses hpChange = 3", () => {
    const { cleanText, signals } = parseSignals("Vous récupérez [HP_CHANGE:+3] des points de vie.");
    expect(signals.hpChange).toBe(3);
    expect(cleanText).not.toContain("[HP_CHANGE");
  });

  it("strips [MILESTONE_COMPLETE:nom] and parses milestoneCompleted", () => {
    const { cleanText, signals } = parseSignals(
      "Vous avez terminé l'enquête.\n[MILESTONE_COMPLETE:Enquête au marché]",
    );
    expect(signals.milestoneCompleted).toBe("Enquête au marché");
    expect(cleanText).not.toContain("[MILESTONE_COMPLETE");
  });

  it("strips [ADVENTURE_COMPLETE] and sets adventureComplete = true", () => {
    const { cleanText, signals } = parseSignals("L'aventure est terminée.\n[ADVENTURE_COMPLETE]");
    expect(signals.adventureComplete).toBe(true);
    expect(cleanText).not.toContain("[ADVENTURE_COMPLETE]");
  });

  it("strips [GAME_OVER] and sets isGameOver = true", () => {
    const { cleanText, signals } = parseSignals("Vous êtes mort.\n[GAME_OVER]");
    expect(signals.isGameOver).toBe(true);
    expect(cleanText).not.toContain("[GAME_OVER]");
  });

  it("strips [CHOIX]...[/CHOIX] and parses choices array", () => {
    const raw = `Que faites-vous ?\n[CHOIX]\n1. Attaquer\n2. Fuir\n3. Négocier\n[/CHOIX]`;
    const { cleanText, signals } = parseSignals(raw);
    expect(signals.choices).toHaveLength(3);
    expect(signals.choices[0]!.label).toBe("Attaquer");
    expect(signals.choices[1]!.label).toBe("Fuir");
    expect(signals.choices[2]!.label).toBe("Négocier");
    expect(cleanText).not.toContain("[CHOIX]");
    expect(cleanText).not.toContain("[/CHOIX]");
  });

  it("collapses excess blank lines after stripping", () => {
    const raw = "Ligne 1.\n[GAME_OVER]\n\n\n\nLigne 2.";
    const { cleanText } = parseSignals(raw);
    expect(cleanText).not.toMatch(/\n{3,}/);
  });

  it("handles multiple signals in one response", () => {
    const raw = "Bravo !\n[HP_CHANGE:-2]\n[MILESTONE_COMPLETE:Chapitre 1]\n[ADVENTURE_COMPLETE]";
    const { cleanText, signals } = parseSignals(raw);
    expect(signals.hpChange).toBe(-2);
    expect(signals.milestoneCompleted).toBe("Chapitre 1");
    expect(signals.adventureComplete).toBe(true);
    expect(cleanText).toBe("Bravo !");
  });
});

// ---------------------------------------------------------------------------
// computeCharacterBonus
// ---------------------------------------------------------------------------

describe("computeCharacterBonus()", () => {
  const BASE_CHAR: AdventureCharacterDTO = {
    id: "c1",
    name: "Héros",
    className: "Aventurier",
    raceName: "Humain",
    stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
    currentHp: 20,
    maxHp: 20,
  };

  it("returns +2 when Aventurier uses a class-matching action", () => {
    const bonus = computeCharacterBonus(BASE_CHAR, "j'attaque le gobelin", []);
    expect(bonus).toBe(2);
  });

  it("returns 0 for a neutral action with no history", () => {
    const bonus = computeCharacterBonus(BASE_CHAR, "Je regarde autour de moi", []);
    expect(bonus).toBe(0);
  });

  it("returns -2 when same action repeated in recent history", () => {
    const history = [{ role: "user" as const, content: "Je regarde les étoiles au loin" }];
    const bonus = computeCharacterBonus(BASE_CHAR, "Je regarde les étoiles", history);
    expect(bonus).toBe(-2);
  });

  it("returns 0 for non-Aventurier class (no class match bonus)", () => {
    const char = { ...BASE_CHAR, className: "Mage" };
    const bonus = computeCharacterBonus(char, "j'attaque le gobelin", []);
    expect(bonus).toBe(0);
  });
});
