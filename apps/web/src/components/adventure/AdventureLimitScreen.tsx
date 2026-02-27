import { useNavigate } from "@tanstack/react-router";

import type { AdventureDTO } from "@jdrai/shared";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdventureLimitScreenProps {
  adventures: AdventureDTO[];
  onAbandon: (adventure: AdventureDTO) => void;
}

export function AdventureLimitScreen({ adventures, onAbandon }: AdventureLimitScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      <div className="rounded-lg border border-amber-700/60 bg-amber-900/20 p-4">
        <p className="font-medium text-amber-200">
          ⚠️ Vous avez atteint la limite de 5 aventures en cours.
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Terminez ou abandonnez une aventure pour en lancer une nouvelle.
        </p>
      </div>

      {/* Active adventures list */}
      <div className="space-y-2">
        {adventures.map((adventure) => (
          <div
            key={adventure.id}
            className="flex items-center gap-3 rounded-lg border border-stone-700/50 bg-stone-800/30 px-4 py-3"
          >
            <span aria-hidden="true">🗺️</span>
            <span className="flex-1 truncate text-sm font-medium text-amber-100">
              {adventure.title}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded p-1 text-stone-400 transition-colors hover:text-stone-200"
                  aria-label="Options"
                >
                  ⋮
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-stone-700 bg-stone-900 text-amber-100"
              >
                <DropdownMenuItem
                  onClick={() =>
                    void navigate({ to: "/adventure/$id", params: { id: adventure.id } })
                  }
                  className="cursor-pointer"
                >
                  Reprendre
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAbandon(adventure)}
                  className="cursor-pointer text-red-400 focus:text-red-300"
                >
                  Abandonner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
