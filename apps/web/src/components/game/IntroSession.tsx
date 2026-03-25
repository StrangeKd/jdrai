/**
 * IntroSession — full-screen intro displayed only on first launch of a new adventure.
 * Shows two lines with progressive fade-in. Dismissed when useGameSession receives
 * game:response-start (first GM narration begins streaming).
 * z-index: 80 (below MilestoneOverlay 90, below PauseMenu 100).
 * Story 6.6 Task 6.
 */
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface IntroSessionProps {
  visible: boolean;
}

export function IntroSession({ visible }: IntroSessionProps) {
  // Keep rendered during fade-out transition, unmount only after transition completes
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
  }, [visible]);

  const handleTransitionEnd = () => {
    if (!visible) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex flex-col items-center justify-center",
        "bg-background",
        "transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0",
      )}
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
    </div>
  );
}
