/**
 * TutorialTooltipLayer — orchestrates the 3 tutorial tooltips.
 * Rendered as an overlay above the E10 game session structure.
 *
 * Story 8.2 Task 5 (AC: #3)
 */
import { TutorialTooltip } from "./TutorialTooltip";

interface TutorialTooltipLayerProps {
  /** true when ChoiceList or PresetSelector is visible */
  hasChoicesRendered: boolean;
  /** true after the first FreeInput focus event */
  hasFreeInputFocused: boolean;
  /** true after the first [⚙] pause button tap */
  hasPauseMenuOpened: boolean;
  isTooltipSeen: (id: string) => boolean;
  dismissTooltip: (id: string) => void;
}

export function TutorialTooltipLayer({
  hasChoicesRendered,
  hasFreeInputFocused,
  hasPauseMenuOpened,
  isTooltipSeen,
  dismissTooltip,
}: TutorialTooltipLayerProps) {
  const showFirstChoice = hasChoicesRendered && !isTooltipSeen("first-choice");
  const showFirstInput =
    !showFirstChoice &&
    hasFreeInputFocused &&
    isTooltipSeen("first-choice") &&
    !isTooltipSeen("first-input");
  const showPauseMenu =
    !showFirstChoice &&
    !showFirstInput &&
    hasPauseMenuOpened &&
    isTooltipSeen("first-choice") &&
    isTooltipSeen("first-input") &&
    !isTooltipSeen("pause-menu");

  return (
    <>
      <TutorialTooltip
        id="first-choice"
        text="Choisissez une option ou écrivez librement ci-dessous !"
        position="above-choices"
        isVisible={showFirstChoice}
        onDismiss={() => dismissTooltip("first-choice")}
      />
      <TutorialTooltip
        id="first-input"
        text="Vous pouvez aussi écrire votre propre réponse ici !"
        position="above-input"
        isVisible={showFirstInput}
        onDismiss={() => dismissTooltip("first-input")}
      />
      <TutorialTooltip
        id="pause-menu"
        text="Vous pouvez mettre en pause ou quitter depuis ici."
        position="near-pause"
        isVisible={showPauseMenu}
        onDismiss={() => dismissTooltip("pause-menu")}
      />
    </>
  );
}
