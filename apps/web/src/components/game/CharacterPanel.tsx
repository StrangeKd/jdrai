/**
 * CharacterPanel — compact HP bar visible on mobile only (Story 6.5 Task 5).
 *
 * Fixed directly below SessionHeader (top-14, h-10).
 * Hidden on desktop (md:hidden) — CharacterPanel content is inlined in SessionHeader.
 * Animates HP changes with a brief color flash.
 */
import { useEffect, useRef, useState } from "react";

import type { AdventureCharacterDTO } from "@jdrai/shared";

import { cn } from "@/lib/utils";

interface CharacterPanelProps {
  character: AdventureCharacterDTO;
  currentHp: number;
  maxHp: number;
}

export function CharacterPanel({ character, currentHp, maxHp }: CharacterPanelProps) {
  const [hpFlash, setHpFlash] = useState<"damage" | "heal" | null>(null);
  const prevHpRef = useRef(currentHp);

  useEffect(() => {
    const prev = prevHpRef.current;
    if (prev === currentHp) return;

    setHpFlash(currentHp < prev ? "damage" : "heal");
    const timer = setTimeout(() => setHpFlash(null), 600);
    prevHpRef.current = currentHp;

    return () => clearTimeout(timer);
  }, [currentHp]);

  return (
    <div
      className="md:hidden fixed top-14 left-0 right-0 z-40 flex items-center px-4 h-10 bg-stone-900/90 border-b border-stone-800 text-sm text-stone-300"
      aria-label="Statut du personnage"
    >
      <span className="flex-1 truncate">
        🧙 {character.name} · {character.className}
      </span>
      <span
        className={cn(
          "tabular-nums transition-colors duration-300",
          hpFlash === "damage" && "text-rose-400",
          hpFlash === "heal" && "text-emerald-400",
          hpFlash === null && "text-stone-300",
        )}
        aria-label={`Points de vie: ${currentHp} sur ${maxHp}`}
      >
        ❤️ {currentHp}/{maxHp}
      </span>
    </div>
  );
}
