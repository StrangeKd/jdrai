/**
 * ExitConfirmModal — confirmation modal before leaving an active adventure (Story 6.7 Task 1).
 *
 * WF-E10-06: full-screen dark overlay, centered card.
 * z-index 110 — highest in the stack, above PauseMenu (100).
 * No backdrop click to dismiss — requires explicit choice.
 * No Escape key dismiss — same reason.
 */
import { Button } from "@/components/ui/button";
import { formatLastSaved } from "@/lib/format-date";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  lastSavedAt: Date | null;
  isConfirming: boolean;
}

export function ExitConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  lastSavedAt,
  isConfirming,
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quitter l'aventure ?"
      className="fixed inset-0 z-110 bg-black/40 backdrop-blur-xs flex items-center justify-center"
      // No onClick on backdrop — intentional, requires explicit choice
    >
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-6 w-80 max-w-[90vw] flex flex-col gap-4">
        <h2 className="text-lg font-bold text-center">Quitter l'aventure ?</h2>

        <p className="text-sm text-muted-foreground text-center">
          Votre progression est sauvegardée. Vous pourrez reprendre à tout moment depuis le Hub.
        </p>

        {lastSavedAt && (
          <p className="text-xs text-center text-muted-foreground">
            💾 Dernière sauvegarde {formatLastSaved(lastSavedAt)}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full"
          >
            {isConfirming ? "Sauvegarde en cours..." : "Quitter"}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming} className="w-full">
            Rester
          </Button>
        </div>
      </div>
    </div>
  );
}
