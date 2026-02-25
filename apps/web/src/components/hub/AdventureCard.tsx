import type { AdventureDTO } from "@jdrai/shared";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface AdventureCardProps {
  adventure: AdventureDTO;
  onClick: () => void;
}

export function AdventureCard({ adventure, onClick }: AdventureCardProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto min-w-[140px] snap-start flex-col items-start gap-1 border-stone-700 bg-stone-800 p-3 text-left hover:border-amber-700 hover:bg-stone-700 lg:min-w-0"
    >
      <p className="line-clamp-2 text-sm font-medium text-amber-100">{adventure.title}</p>
      <p className="text-xs text-stone-500">
        {adventure.completedAt
          ? formatRelativeTime(adventure.completedAt)
          : formatRelativeTime(adventure.lastPlayedAt)}
      </p>
    </Button>
  );
}
