import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TutorialTooltipLayer } from "../TutorialTooltipLayer";

afterEach(cleanup);

function renderLayer(seen: string[], flags?: Partial<{
  hasFreeInputFocused: boolean;
  hasPauseMenuOpened: boolean;
}>) {
  const isTooltipSeen = (id: string) => seen.includes(id);
  return render(
    <TutorialTooltipLayer
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

  it("dismisser first-choice appelle onTriggerFreeInput", () => {
    const seen = new Set<string>();
    const isTooltipSeen = (id: string) => seen.has(id);
    const dismissTooltip = vi.fn((id: string) => { seen.add(id); });
    const onTriggerFreeInput = vi.fn();
    render(
      <TutorialTooltipLayer
        hasFreeInputFocused={false}
        hasPauseMenuOpened={false}
        isTooltipSeen={isTooltipSeen}
        dismissTooltip={dismissTooltip}
        onTriggerFreeInput={onTriggerFreeInput}
      />,
    );
    fireEvent.click(screen.getByText("Compris !"));
    expect(dismissTooltip).toHaveBeenCalledWith("first-choice");
    expect(onTriggerFreeInput).toHaveBeenCalledTimes(1);
  });

  it("dismisser first-input appelle onTriggerPauseMenu", () => {
    const onTriggerPauseMenu = vi.fn();
    const isTooltipSeen = (id: string) => ["first-choice"].includes(id);
    render(
      <TutorialTooltipLayer
        hasFreeInputFocused={true}
        hasPauseMenuOpened={false}
        isTooltipSeen={isTooltipSeen}
        dismissTooltip={vi.fn()}
        onTriggerPauseMenu={onTriggerPauseMenu}
      />,
    );
    fireEvent.click(screen.getByText("Compris !"));
    expect(onTriggerPauseMenu).toHaveBeenCalledTimes(1);
  });
});
