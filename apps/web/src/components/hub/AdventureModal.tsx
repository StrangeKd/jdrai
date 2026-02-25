import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui.store";

/**
 * Adventure modal — triggered by the Aventure tab (mobile) or sidebar item (desktop).
 * Placeholder content: real implementation in Story 4.3.
 */
export function AdventureModal() {
  const adventureModalOpen = useUIStore((s) => s.adventureModalOpen);
  const setAdventureModalOpen = useUIStore((s) => s.setAdventureModalOpen);

  return (
    <Dialog open={adventureModalOpen} onOpenChange={setAdventureModalOpen}>
      <DialogContent className="bg-stone-900 border-stone-700 text-amber-100">
        <DialogHeader>
          <DialogTitle className="text-amber-300">Aventure</DialogTitle>
          <DialogDescription className="sr-only">
            Modale Aventure (placeholder) — Story 4.3.
          </DialogDescription>
        </DialogHeader>
        {/* Placeholder — content implemented in Story 4.3 */}
        <p className="text-stone-400 text-sm">
          Modale Aventure — Story 4.3
        </p>
      </DialogContent>
    </Dialog>
  );
}
