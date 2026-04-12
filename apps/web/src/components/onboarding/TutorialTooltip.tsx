/**
 * TutorialTooltip — semi-transparent tooltip bubble for tutorial guidance.
 *
 * Non-blocking: backdrop has pointer-events:none so the player can still interact
 * with the game behind it. Only the tooltip bubble itself is interactive.
 * Dismissed via "Compris !" button; parent persists dismissal to localStorage.
 *
 * Story 8.2 Task 4 (AC: #3)
 */

interface TutorialTooltipProps {
  id: string;
  text: string;
  position?: "above-choices" | "above-input" | "near-pause";
  isVisible: boolean;
  onDismiss: () => void;
}

const POSITION_CLASSES: Record<NonNullable<TutorialTooltipProps["position"]>, string> = {
  "above-choices": "bottom-32 left-1/2 -translate-x-1/2",
  "above-input": "bottom-20 left-1/2 -translate-x-1/2",
  "near-pause": "top-16 right-4",
};

const ARROW_CLASSES: Record<NonNullable<TutorialTooltipProps["position"]>, string> = {
  "above-choices": "bottom-[-8px] left-1/2 -translate-x-1/2 border-t-gray-900/90 border-l-transparent border-r-transparent border-b-transparent border-8",
  "above-input": "bottom-[-8px] left-1/2 -translate-x-1/2 border-t-gray-900/90 border-l-transparent border-r-transparent border-b-transparent border-8",
  "near-pause": "top-[-8px] right-4 border-b-gray-900/90 border-l-transparent border-r-transparent border-t-transparent border-8",
};

export function TutorialTooltip({
  text,
  position = "above-choices",
  isVisible,
  onDismiss,
}: TutorialTooltipProps) {
  if (!isVisible) return null;

  return (
    // Backdrop — pointer-events:none so the player can still interact behind it
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Tooltip bubble — pointer-events:auto on the bubble only */}
      <div
        className={`pointer-events-auto absolute ${POSITION_CLASSES[position]} max-w-[280px] w-max`}
      >
        <div className="relative rounded-lg border border-amber-400/30 bg-gray-900/90 px-4 py-3 shadow-xl">
          <p className="text-sm text-amber-100 leading-snug">{text}</p>
          <button
            onClick={onDismiss}
            className="mt-2 w-full rounded bg-amber-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Compris !
          </button>
          {/* Arrow indicator */}
          <span className={`absolute ${ARROW_CLASSES[position]} w-0 h-0`} />
        </div>
      </div>
    </div>
  );
}
