import type { AdventureDTO } from "@jdrai/shared";

import { MoreVertical } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";

interface AdventureCardActiveProps {
  adventure: AdventureDTO;
  onAbandon: (adventure: AdventureDTO) => void;
}

export function AdventureCardActive({ adventure, onAbandon }: AdventureCardActiveProps) {
  const navigate = useNavigate();

  function handleResume(id: string) {
    void navigate({ to: "/adventure/$id", params: { id }, state: { isResume: true } });
  }

  return (
    <Card className="gap-3 border-stone-700 bg-stone-800 py-4 shadow-none">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-amber-100">{adventure.title}</h3>
            {adventure.currentMilestone && (
              <p className="text-sm text-amber-200/60">🏴 {adventure.currentMilestone}</p>
            )}
            <p className="text-xs text-stone-500">
              💾 Sauvegardée {formatRelativeTime(adventure.lastPlayedAt)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Options" className="shrink-0 text-stone-400 hover:text-amber-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-stone-700 bg-stone-900">
              <DropdownMenuItem
                onSelect={() => handleResume(adventure.id)}
                className="text-amber-100 focus:bg-stone-800 focus:text-amber-100"
              >
                ▶ Reprendre
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onAbandon(adventure)}
                className="text-destructive focus:bg-stone-800 focus:text-destructive"
              >
                ✕ Abandonner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          onClick={() => handleResume(adventure.id)}
          size="sm"
          className="w-full uppercase tracking-wider"
        >
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
