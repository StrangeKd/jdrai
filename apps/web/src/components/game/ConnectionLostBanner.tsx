/**
 * ConnectionLostBanner — non-blocking banner indicating connection loss (Story 6.8 Task 4).
 *
 * Rendered at the top of NarrationPanel. Two states:
 *  - Reconnecting (visible=true, failed=false): animated "Reconnexion en cours..."
 *  - Failed (visible=true, failed=true):        "Connexion impossible" + Réessayer button
 *
 * AC: #3, #4, #8
 */
import { Button } from "@/components/ui/button";

interface ConnectionLostBannerProps {
  visible: boolean;
  failed: boolean;
  onRetry: () => void;
}

export function ConnectionLostBanner({ visible, failed, onRetry }: ConnectionLostBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-600/40 bg-stone-800/90 px-4 py-2 text-sm text-amber-200"
    >
      {failed ? (
        <>
          <span>⚠️ Connexion impossible</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 border-amber-600/50 text-amber-200 hover:bg-amber-900/30"
          >
            Réessayer
          </Button>
        </>
      ) : (
        <span className="flex items-center gap-2">
          <span>⚠️ Connexion perdue — Reconnexion en cours</span>
          <span className="animate-pulse">…</span>
        </span>
      )}
    </div>
  );
}
