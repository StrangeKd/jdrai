/**
 * CharacterPanel tests — Story 6.5 Task 8
 * AC: #2 — renders name/class/HP; HP pulse animation on change
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdventureCharacterDTO } from "@jdrai/shared";

import { CharacterPanel } from "../CharacterPanel";

afterEach(cleanup);

const MOCK_CHARACTER: AdventureCharacterDTO = {
  id: "char-1",
  name: "Héros",
  className: "Aventurier",
  raceName: "Humain",
  stats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
  currentHp: 20,
  maxHp: 20,
};

describe("CharacterPanel", () => {
  it("renders character name, class and HP", () => {
    render(<CharacterPanel character={MOCK_CHARACTER} currentHp={20} maxHp={20} />);
    expect(screen.getByText(/Héros/)).toBeDefined();
    expect(screen.getByText(/Aventurier/)).toBeDefined();
    expect(screen.getByText(/20\/20/)).toBeDefined();
  });

  it("HP display updates when currentHp prop changes", () => {
    const { rerender } = render(<CharacterPanel character={MOCK_CHARACTER} currentHp={20} maxHp={20} />);
    expect(screen.getByText(/20\/20/)).toBeDefined();

    rerender(<CharacterPanel character={MOCK_CHARACTER} currentHp={15} maxHp={20} />);
    expect(screen.getByText(/15\/20/)).toBeDefined();
  });

  it("applies damage flash class when HP decreases", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<CharacterPanel character={MOCK_CHARACTER} currentHp={20} maxHp={20} />);

    act(() => {
      rerender(<CharacterPanel character={MOCK_CHARACTER} currentHp={10} maxHp={20} />);
    });

    const hpEl = screen.getByLabelText(/Points de vie/);
    // Damage flash: text-rose-400 class applied
    expect(hpEl.className).toContain("text-rose-400");

    // After 600ms the flash should clear
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(hpEl.className).not.toContain("text-rose-400");

    vi.useRealTimers();
  });

  it("applies heal flash class when HP increases", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<CharacterPanel character={MOCK_CHARACTER} currentHp={10} maxHp={20} />);

    act(() => {
      rerender(<CharacterPanel character={MOCK_CHARACTER} currentHp={18} maxHp={20} />);
    });

    const hpEl = screen.getByLabelText(/Points de vie/);
    expect(hpEl.className).toContain("text-emerald-400");

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(hpEl.className).not.toContain("text-emerald-400");

    vi.useRealTimers();
  });
});
