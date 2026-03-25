/**
 * PauseMenu — full-screen overlay with save/history/quit actions (Story 6.5 Task 6).
 *
 * WF-E10-05: semi-transparent dark backdrop, centered card.
 * Backdrop click closes the overlay.
 * Escape key is handled in $id.tsx — this component is purely display.
 */
import { Button } from "@/components/ui/button";

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onHistory: () => void;
  onQuit: () => void;
  lastSavedAt: Date | null;
  isSaving: boolean;
}

/** Formats lastSavedAt as a human-readable relative time in French. */
function formatLastSaved(lastSavedAt: Date | null): string {
  if (!lastSavedAt) return "jamais";
  const diffMs = Date.now() - lastSavedAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin === 1) return "il y a 1 min";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `il y a ${diffH}h`;
}

export function PauseMenu({
  isOpen,
  onClose,
  onSave,
  onHistory,
  onQuit,
  lastSavedAt,
  isSaving,
}: PauseMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu pause"
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 w-80 max-w-[90vw] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-amber-200">⚔️ PAUSE</h2>

        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Sauvegarde..." : "💾 Sauvegarder"}
        </Button>

        <Button
          disabled
          className="w-full opacity-50 cursor-not-allowed"
          title="Fonctionnalité P2"
          aria-disabled="true"
        >
          🎭 Paramètres MJ
        </Button>

        <Button
          variant="outline"
          onClick={onHistory}
          className="w-full"
        >
          📜 Historique
        </Button>

        <Button
          variant="destructive"
          onClick={onQuit}
          className="w-full"
        >
          🚪 Quitter l'aventure
        </Button>

        <button
          onClick={onClose}
          className="text-center text-sm underline text-stone-400 hover:text-stone-200 mt-2"
        >
          Reprendre
        </button>

        <p className="text-xs text-center text-stone-500">
          ✓ Sauvegardé {formatLastSaved(lastSavedAt)}
        </p>
      </div>
    </div>
  );
}
