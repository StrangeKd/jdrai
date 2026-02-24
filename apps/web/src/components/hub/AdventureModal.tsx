import {
  Dialog,
  DialogContent,
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
      {/* aria-describedby={undefined}: no description for this placeholder — Story 4.3 will add DialogDescription */}
      <DialogContent className="bg-stone-900 border-stone-700 text-amber-100" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-amber-300">Aventure</DialogTitle>
        </DialogHeader>
        {/* Placeholder — content implemented in Story 4.3 */}
        <p className="text-stone-400 text-sm">
          Modale Aventure — Story 4.3
        </p>
      </DialogContent>
    </Dialog>
  );
}
