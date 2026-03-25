/**
 * IntroSession — full-screen intro displayed only on first launch of a new adventure.
 * Shows two lines with progressive fade-in. Dismissed automatically when
 * useGameSession receives game:response-complete (first GM narration completes),
 * or immediately when the user clicks while streaming is in progress.
 * A chevron button appears in the bottom-right corner once the intro is clickable
 * to signal that the user can skip ahead.
 * z-index: 80 (below MilestoneOverlay 90, below PauseMenu 100).
 * Story 6.6 Task 6.
 */
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface IntroSessionProps {
  visible: boolean;
  /** True once streaming has started — enables click-to-dismiss and shows the skip button */
  isClickable: boolean;
  /** Called when the user clicks to dismiss the intro early */
  onDismiss: () => void;
}

export function IntroSession({ visible, isClickable, onDismiss }: IntroSessionProps) {
  // Keep rendered during fade-out transition, unmount only after transition completes
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
  }, [visible]);

  const handleTransitionEnd = () => {
    if (!visible) setShouldRender(false);
  };

  const handleClick = () => {
    if (isClickable) onDismiss();
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex flex-col items-center justify-center",
        "bg-background",
        "transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0",
        isClickable && "cursor-pointer",
      )}
      onClick={handleClick}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Line 1: fades in immediately */}
      <p
        className="text-xl md:text-2xl font-serif text-foreground text-center px-8 animate-fade-in"
        style={{ animationDelay: "0ms" }}
      >
        Il était une fois...
      </p>
      {/* Line 2: fades in after 600ms */}
      <p
        className="mt-4 text-base md:text-lg text-muted-foreground text-center px-8 animate-fade-in opacity-0"
        style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
      >
        une âme en quête d&apos;aventure.
      </p>

      {/* Skip button — appears once streaming starts */}
      {isClickable && visible && (
        <button
          type="button"
          aria-label="Passer l'introduction"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={cn(
            "absolute bottom-8 right-8",
            "flex items-center justify-center w-10 h-10 rounded-full",
            "border border-amber-400/40 text-amber-400/60",
            "hover:border-amber-400 hover:text-amber-400",
            "transition-colors animate-fade-in",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
