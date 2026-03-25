/**
 * AutosaveIndicator — shows "✓ Sauvegardé" for 2s after a save (Story 6.5 Task 3).
 * Display only: the 2s timer is managed by useGameSession.
 */
import { cn } from "@/lib/utils";

interface AutosaveIndicatorProps {
  visible: boolean;
  className?: string;
}

export function AutosaveIndicator({ visible, className }: AutosaveIndicatorProps) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "text-xs text-emerald-400 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        className,
      )}
    >
      ✓ Sauvegardé
    </span>
  );
}
