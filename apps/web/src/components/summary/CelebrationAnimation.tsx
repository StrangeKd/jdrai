/**
 * CelebrationAnimation — confetti burst for success state (WF-E11-01).
 *
 * play=true  → fires confetti once on mount (first visit from E10)
 * play=false → no animation (history consultation)
 *
 * Game Over uses a static ☠️ icon — no animation.
 * The icon itself is rendered by the parent (AdventureSummaryPage).
 */
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CelebrationAnimationProps {
  play: boolean;
}

export function CelebrationAnimation({ play }: CelebrationAnimationProps) {
  useEffect(() => {
    if (!play) return;

    // Fire confetti burst — ~2s non-blocking animation
    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#FFD700", "#FFA500", "#FF6347", "#9370DB", "#20B2AA"],
    });
  }, [play]);

  return null;
}
