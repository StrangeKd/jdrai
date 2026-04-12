/**
 * TutorialTooltipLayer — orchestrates the 3 tutorial tooltips.
 * Rendered as an overlay above the E10 game session structure.
 *
 * Story 8.2 Task 5 (AC: #3)
 */
import { TutorialTooltip } from "./TutorialTooltip";

interface TutorialTooltipLayerProps {
  /** true after the first FreeInput focus event */
  hasFreeInputFocused: boolean;
  /** true after the first [⚙] pause button tap */
  hasPauseMenuOpened: boolean;
  isTooltipSeen: (id: string) => boolean;
  dismissTooltip: (id: string) => void;
  /** Called when first-choice is dismissed — force-triggers the free-input tooltip */
  onTriggerFreeInput?: () => void;
  /** Called when first-input is dismissed — force-triggers the pause-menu tooltip */
  onTriggerPauseMenu?: () => void;
}

export function TutorialTooltipLayer({
  hasFreeInputFocused,
  hasPauseMenuOpened,
  isTooltipSeen,
  dismissTooltip,
  onTriggerFreeInput,
  onTriggerPauseMenu,
}: TutorialTooltipLayerProps) {
  const showFirstChoice = !isTooltipSeen("first-choice");
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
        onDismiss={() => {
          dismissTooltip("first-choice");
          onTriggerFreeInput?.();
        }}
      />
      <TutorialTooltip
        id="first-input"
        text="Vous pouvez aussi écrire votre propre réponse ici !"
        position="above-input"
        isVisible={showFirstInput}
        onDismiss={() => {
          dismissTooltip("first-input");
          onTriggerPauseMenu?.();
        }}
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
