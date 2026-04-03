/**
 * Tutorial logic unit tests — Story 8.1 Task 10.1
 * Tests parseSignals extensions and SHOW_PRESET_SELECTOR parsing (pure logic, no DB).
 */
import { describe, expect, it } from "vitest";

import { parseSignals } from "./game.service";

// ---------------------------------------------------------------------------
// parseSignals — tutorial signal extensions (AC #6)
// ---------------------------------------------------------------------------

describe("parseSignals() — [SHOW_PRESET_SELECTOR] (AC #6)", () => {
  it("parses [SHOW_PRESET_SELECTOR:race] and sets presetSelector to 'race'", () => {
    const raw =
      "Le vieux sage te sourit et demande de quelle contrée tu viens.\n\n[SHOW_PRESET_SELECTOR:race]\n\n[CHOIX]\n1. Je viens des plaines\n[/CHOIX]";

    const { cleanText, signals } = parseSignals(raw);

    expect(signals.presetSelector).toBe("race");
    expect(cleanText).not.toContain("[SHOW_PRESET_SELECTOR:race]");
    expect(cleanText).toContain("Le vieux sage te sourit");
  });

  it("parses [SHOW_PRESET_SELECTOR:class] and sets presetSelector to 'class'", () => {
    const raw =
      "Il t'interroge sur ton talent naturel.\n\n[SHOW_PRESET_SELECTOR:class]\n\n[CHOIX]\n1. Je suis adroit\n[/CHOIX]";

    const { signals } = parseSignals(raw);

    expect(signals.presetSelector).toBe("class");
  });

  it("does not set presetSelector when signal is absent", () => {
    const raw =
      "Tu avances dans le couloir sombre.\n\n[CHOIX]\n1. Continuer\n[/CHOIX]";

    const { signals } = parseSignals(raw);

    expect(signals.presetSelector).toBeUndefined();
  });

  it("strips [SHOW_PRESET_SELECTOR:x] from cleanText", () => {
    const raw = "Narration text.\n\n[SHOW_PRESET_SELECTOR:race]";

    const { cleanText } = parseSignals(raw);

    expect(cleanText).not.toContain("[SHOW_PRESET_SELECTOR");
    expect(cleanText).toBe("Narration text.");
  });

  it("preserves standard signals alongside tutorial signal", () => {
    const raw =
      "L'épreuve commence.\n\n[SHOW_PRESET_SELECTOR:class]\n\n[MILESTONE_COMPLETE:La Rencontre]\n\n[CHOIX]\n1. Avancer\n[/CHOIX]";

    const { signals } = parseSignals(raw);

    expect(signals.presetSelector).toBe("class");
    expect(signals.milestoneCompleted).toBe("La Rencontre");
    expect(signals.choices).toHaveLength(1);
  });

  it("coexists with [ADVENTURE_COMPLETE] for tutorial completion", () => {
    const raw =
      "L'aventure se termine.\n\n[MILESTONE_COMPLETE:L'Épreuve]\n\n[ADVENTURE_COMPLETE]";

    const { signals } = parseSignals(raw);

    expect(signals.adventureComplete).toBe(true);
    expect(signals.milestoneCompleted).toBe("L'Épreuve");
  });
});

// ---------------------------------------------------------------------------
// parseSignals — regression: existing signals still work (AC #6)
// ---------------------------------------------------------------------------

describe("parseSignals() — regression after tutorial extensions", () => {
  it("still parses [HP_CHANGE] correctly", () => {
    const raw = "Tu es blessé.\n\n[HP_CHANGE:-5]";
    const { signals } = parseSignals(raw);
    expect(signals.hpChange).toBe(-5);
  });

  it("still parses [GAME_OVER] correctly", () => {
    const raw = "Tu tombes.\n\n[GAME_OVER]";
    const { signals } = parseSignals(raw);
    expect(signals.isGameOver).toBe(true);
  });
});
