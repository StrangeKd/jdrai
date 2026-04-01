import type { AdventureDTO } from "@jdrai/shared";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAbandonAdventure } from "@/hooks/useAdventures";

interface AbandonModalProps {
  adventure: AdventureDTO | null; // null = closed
  onClose: () => void;
  /** Called after successful PATCH — parent handles any additional invalidations. */
  onSuccess?: () => void;
}

export function AbandonModal({ adventure, onClose, onSuccess }: AbandonModalProps) {
  const abandon = useAbandonAdventure();

  const handleAbandon = async () => {
    if (!adventure) return;
    await abandon.mutateAsync(adventure.id);
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={!!adventure} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-stone-700 bg-stone-900 text-amber-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Abandonner l&apos;aventure ?</DialogTitle>
        </DialogHeader>
        <DialogDescription className="py-2 text-sm text-stone-300">
          Votre progression dans{" "}
          <span className="font-medium text-amber-200">
            &laquo;&nbsp;{adventure?.title}&nbsp;&raquo;
          </span>{" "}
          sera perdue. Cette action est irréversible.
        </DialogDescription>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="destructive"
            className="w-full uppercase tracking-wider"
            onClick={() => void handleAbandon()}
            disabled={abandon.isPending}
          >
            {abandon.isPending ? "Abandon en cours..." : "ABANDONNER"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-center text-sm text-stone-400 transition-colors hover:text-stone-200"
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
