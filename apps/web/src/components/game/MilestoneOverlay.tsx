/**
 * MilestoneOverlay — full-screen celebration overlay shown when a milestone completes.
 * Auto-dismissed by useGameSession after 2500ms (no user interaction needed).
 * z-index: 90 (above IntroSession 80, below PauseMenu 100).
 * Story 6.6 Task 5.
 */
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface MilestoneOverlayProps {
  visible: boolean;
  milestoneName: string | null;
}

export function MilestoneOverlay({ visible, milestoneName }: MilestoneOverlayProps) {
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
        "fixed inset-0 z-[90] flex flex-col items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        "transition-opacity duration-500 pointer-events-none",
        visible ? "opacity-100" : "opacity-0",
      )}
      onTransitionEnd={handleTransitionEnd}
      aria-live="polite"
      aria-label={`Nouveau chapitre : ${milestoneName ?? ""}`}
    >
      <p className="text-2xl md:text-3xl font-bold text-amber-400 text-center px-8">
        ✦ {milestoneName} ✦
      </p>
      <p className="mt-3 text-sm text-amber-200/80 text-center">
        Un nouveau chapitre commence...
      </p>
    </div>
  );
}
