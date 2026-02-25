import type { AdventureDTO } from "@jdrai/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";

interface AdventureCardActiveProps {
  adventure: AdventureDTO;
  onResume: () => void;
}

export function AdventureCardActive({ adventure, onResume }: AdventureCardActiveProps) {
  return (
    <Card className="gap-3 border-stone-700 bg-stone-800 py-4 shadow-none">
      <CardContent className="space-y-3 px-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-amber-100">{adventure.title}</h3>
          {adventure.currentMilestone && (
            <p className="text-sm text-amber-200/60">🏴 {adventure.currentMilestone}</p>
          )}
          <p className="text-xs text-stone-500">
            💾 Sauvegardée {formatRelativeTime(adventure.lastPlayedAt)}
          </p>
        </div>
        <Button onClick={onResume} size="sm" className="w-full uppercase tracking-wider">
          Reprendre
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdventureCardActiveSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="space-y-3 rounded-xl bg-stone-800 p-4">
        <div className="h-4 w-3/4 rounded bg-stone-700" />
        <div className="h-3 w-1/2 rounded bg-stone-700" />
        <div className="h-3 w-1/3 rounded bg-stone-700" />
        <div className="h-9 rounded bg-stone-700" />
      </div>
    </div>
  );
}
