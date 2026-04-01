import type { AdventureDTO } from "@jdrai/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface AdventureCardProps {
  adventure: AdventureDTO;
  onClick: () => void;
}

export function AdventureCard({ adventure, onClick }: AdventureCardProps) {
  const isAbandoned = adventure.status === "abandoned";

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto min-w-[140px] snap-start flex-col items-start gap-1 border-stone-700 bg-stone-800 p-3 text-left hover:border-amber-700 hover:bg-stone-700 lg:min-w-0"
    >
      <p className={`line-clamp-2 text-sm font-medium ${isAbandoned ? "text-stone-400" : "text-amber-100"}`}>
        {adventure.title}
      </p>
      {isAbandoned && (
        <Badge variant="outline" className="border-amber-700/50 px-1 py-0 text-[10px] text-amber-600">
          Inachevée
        </Badge>
      )}
      <p className="text-xs text-stone-500">
        {isAbandoned
          ? `Abandonnée ${formatRelativeTime(adventure.completedAt ?? adventure.lastPlayedAt)}`
          : formatRelativeTime(adventure.lastPlayedAt)}
      </p>
    </Button>
  );
}
