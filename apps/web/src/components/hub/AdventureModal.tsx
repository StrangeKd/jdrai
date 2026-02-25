import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveAdventures } from "@/hooks/useAdventures";
import { formatRelativeTime } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

/**
 * Adventure modal — triggered by the Aventure tab (mobile) or sidebar item (desktop).
 * Variant A: adventure(s) in progress — shows most recent with resume CTA.
 * Variant B: no adventures — shows invitation CTA to start a new one.
 */
export function AdventureModal() {
  const navigate = useNavigate();
  const { adventureModalOpen, setAdventureModalOpen } = useUIStore();

  // Reads from TanStack Query cache — no extra network request if Hub already loaded adventures.
  const { data: activeAdventures = [] } = useActiveAdventures();

  const mostRecent = [...activeAdventures].sort(
    (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime(),
  )[0];

  const close = () => setAdventureModalOpen(false);

  const handleResume = (id: string) => {
    close();
    void navigate({ to: "/adventure/$id", params: { id } });
  };

  const handleNewAdventure = () => {
    close();
    void navigate({ to: "/adventure/new" });
  };

  return (
    <Dialog open={adventureModalOpen} onOpenChange={setAdventureModalOpen}>
      <DialogContent className="max-w-sm border-stone-700 bg-stone-900 text-amber-100">
        {mostRecent ? (
          // Variant A — adventure in progress
          <>
            <DialogHeader>
              <DialogTitle className="text-amber-100">Reprendre une aventure</DialogTitle>
              <DialogDescription className="sr-only">
                Reprendre votre aventure la plus récente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <p className="font-semibold">{mostRecent.title}</p>
              {mostRecent.currentMilestone && (
                <p className="text-sm text-amber-200/60">🏴 {mostRecent.currentMilestone}</p>
              )}
              <p className="text-xs text-stone-500">
                💾 Sauvegardée {formatRelativeTime(mostRecent.lastPlayedAt)}
              </p>
            </div>
            <Button
              onClick={() => handleResume(mostRecent.id)}
              className="w-full uppercase tracking-wider"
            >
              Reprendre
            </Button>
            {activeAdventures.length > 1 && (
              <Button
                variant="link"
                onClick={() => {
                  close();
                  void navigate({ to: "/hub" });
                }}
                className="w-full text-center text-sm text-amber-400/60 transition-colors hover:text-amber-400"
              >
                Voir toutes les aventures
              </Button>
            )}
          </>
        ) : (
          // Variant B — no adventures
          <>
            <DialogHeader>
              <DialogTitle className="text-amber-100">Partir à l&apos;aventure</DialogTitle>
              <DialogDescription className="sr-only">
                Commencer une nouvelle aventure.
              </DialogDescription>
            </DialogHeader>
            <p className="py-2 text-sm text-amber-200/60">
              Vous n&apos;avez aucune aventure en cours.
            </p>
            <Button onClick={handleNewAdventure} className="w-full uppercase tracking-wider">
              Nouvelle aventure
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
