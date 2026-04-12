/**
 * PresetSelector tests — AC: #4 (Story 8.2 Task 6)
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type PresetOption,PresetSelector } from "../PresetSelector";

afterEach(cleanup);

const RACE_OPTIONS: PresetOption[] = [
  { id: "r1", name: "Humain", icon: "👤", trait: "Polyvalent et ambitieux." },
  { id: "r2", name: "Elfe", icon: "🧝", trait: "Agile et perceptif." },
  { id: "r3", name: "Nain", icon: "🧔", trait: "Robuste et tenace." },
];

describe("PresetSelector", () => {
  describe("rendering", () => {
    it("renders all 3 race cards from options", () => {
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={vi.fn()}
          isDisabled={false}
        />,
      );
      expect(screen.getByText("Humain")).toBeInTheDocument();
      expect(screen.getByText("Elfe")).toBeInTheDocument();
      expect(screen.getByText("Nain")).toBeInTheDocument();
    });

    it("renders icon and trait for each card", () => {
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={vi.fn()}
          isDisabled={false}
        />,
      );
      expect(screen.getByText("Polyvalent et ambitieux.")).toBeInTheDocument();
      expect(screen.getByText("Agile et perceptif.")).toBeInTheDocument();
    });

    it("renders empty list without crashing", () => {
      const { container } = render(
        <PresetSelector type="race" options={[]} onSelect={vi.fn()} isDisabled={false} />,
      );
      expect(container.querySelectorAll("button")).toHaveLength(0);
    });
  });

  describe("interaction", () => {
    it("calls onSelect with correct option when card is clicked", () => {
      const onSelect = vi.fn();
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={onSelect}
          isDisabled={false}
        />,
      );
      fireEvent.click(screen.getByText("Elfe").closest("button")!);
      expect(onSelect).toHaveBeenCalledWith(RACE_OPTIONS[1]);
    });

    it("calls onSelect with correct id", () => {
      const onSelect = vi.fn();
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={onSelect}
          isDisabled={false}
        />,
      );
      fireEvent.click(screen.getByText("Humain").closest("button")!);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "r1", name: "Humain" }));
    });
  });

  describe("disabled state", () => {
    it("buttons are disabled when isDisabled=true", () => {
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={vi.fn()}
          isDisabled={true}
        />,
      );
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });

    it("does not call onSelect when disabled and clicked", () => {
      const onSelect = vi.fn();
      render(
        <PresetSelector
          type="race"
          options={RACE_OPTIONS}
          onSelect={onSelect}
          isDisabled={true}
        />,
      );
      // Disabled buttons should not fire click handlers
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => fireEvent.click(btn));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
