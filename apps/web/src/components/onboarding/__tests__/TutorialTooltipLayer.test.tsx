import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TutorialTooltipLayer } from "../TutorialTooltipLayer";

afterEach(cleanup);

function renderLayer(seen: string[], flags?: Partial<{
  hasChoicesRendered: boolean;
  hasFreeInputFocused: boolean;
  hasPauseMenuOpened: boolean;
}>) {
  const isTooltipSeen = (id: string) => seen.includes(id);
  return render(
    <TutorialTooltipLayer
      hasChoicesRendered={flags?.hasChoicesRendered ?? true}
      hasFreeInputFocused={flags?.hasFreeInputFocused ?? true}
      hasPauseMenuOpened={flags?.hasPauseMenuOpened ?? true}
      isTooltipSeen={isTooltipSeen}
      dismissTooltip={vi.fn()}
    />,
  );
}

describe("TutorialTooltipLayer", () => {
  it("affiche d'abord le tooltip du premier choix", () => {
    renderLayer([]);
    expect(
      screen.getByText("Choisissez une option ou écrivez librement ci-dessous !"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Vous pouvez aussi écrire votre propre réponse ici !"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Vous pouvez mettre en pause ou quitter depuis ici."),
    ).not.toBeInTheDocument();
  });

  it("après first-choice, affiche first-input", () => {
    renderLayer(["first-choice"]);
    expect(
      screen.getByText("Vous pouvez aussi écrire votre propre réponse ici !"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Vous pouvez mettre en pause ou quitter depuis ici."),
    ).not.toBeInTheDocument();
  });

  it("après first-choice + first-input, affiche pause-menu", () => {
    renderLayer(["first-choice", "first-input"]);
    expect(
      screen.getByText("Vous pouvez mettre en pause ou quitter depuis ici."),
    ).toBeInTheDocument();
  });
});
