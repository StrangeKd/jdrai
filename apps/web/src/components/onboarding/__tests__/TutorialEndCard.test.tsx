/**
 * TutorialEndCard tests — AC: #6 (Story 8.2 Task 8)
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MetaCharacterDTO } from "@jdrai/shared";

import { TutorialEndCard } from "../TutorialEndCard";

afterEach(cleanup);

const MOCK_META_CHARACTER: MetaCharacterDTO = {
  id: "mc-1",
  name: "Ryan",
  level: 1,
  xp: 0,
  raceId: "r1",
  raceName: "Elfe",
  classId: "c1",
  className: "Mage",
  createdAt: "2026-04-04T00:00:00.000Z",
};

describe("TutorialEndCard", () => {
  describe("rendering", () => {
    it("renders title and subtitle with username", () => {
      render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={MOCK_META_CHARACTER}
          onNavigateHub={vi.fn()}
        />,
      );
      expect(screen.getByText("Aventure terminée !")).toBeInTheDocument();
      expect(
        screen.getByText("Ryan, vous avez survécu à votre premier défi."),
      ).toBeInTheDocument();
    });

    it("renders MetaCharacterCard with race and class names", () => {
      render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={MOCK_META_CHARACTER}
          onNavigateHub={vi.fn()}
        />,
      );
      expect(screen.getByText("Elfe — Mage")).toBeInTheDocument();
      expect(screen.getByText("Ryan")).toBeInTheDocument();
    });

    it("renders CTA button", () => {
      render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={MOCK_META_CHARACTER}
          onNavigateHub={vi.fn()}
        />,
      );
      expect(screen.getByText("Découvrir le Hub")).toBeInTheDocument();
    });

    it("renders skeleton when metaCharacter is undefined (loading)", () => {
      const { container } = render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={undefined}
          onNavigateHub={vi.fn()}
        />,
      );
      // Skeleton div with animate-pulse
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("renders without crashing when metaCharacter is null (no data)", () => {
      render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={null}
          onNavigateHub={vi.fn()}
        />,
      );
      // Title still shown, no MetaCharacterCard
      expect(screen.getByText("Aventure terminée !")).toBeInTheDocument();
      expect(screen.queryByText("Elfe — Mage")).not.toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onNavigateHub when 'Découvrir le Hub' is clicked", () => {
      const onNavigateHub = vi.fn();
      render(
        <TutorialEndCard
          username="Ryan"
          metaCharacter={MOCK_META_CHARACTER}
          onNavigateHub={onNavigateHub}
        />,
      );
      fireEvent.click(screen.getByText("Découvrir le Hub"));
      expect(onNavigateHub).toHaveBeenCalledTimes(1);
    });
  });
});
