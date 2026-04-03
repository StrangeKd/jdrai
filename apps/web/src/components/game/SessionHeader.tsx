/**
 * SessionHeader — fixed top bar for the game session (Story 6.5 Task 4).
 *
 * Mobile:  ⚔️ title | [⚙] button
 * Desktop: ⚔️ title · 🧙 name · class · ❤️ HP · AutosaveIndicator · [⚙ Menu]
 *
 * Fixed at top-0 with h-14; z-50 so it overlays all content.
 */
import type { AdventureCharacterDTO } from "@jdrai/shared";

import { Button } from "@/components/ui/button";

import { AutosaveIndicator } from "./AutosaveIndicator";

interface SessionHeaderProps {
  title: string;
  showAutosaveIndicator: boolean;
  onPauseMenuOpen: () => void;
  character?: AdventureCharacterDTO;
  currentHp?: number;
  maxHp?: number;
}

export function SessionHeader({
  title,
  showAutosaveIndicator,
  onPauseMenuOpen,
  character,
  currentHp = 0,
  maxHp = 0,
}: SessionHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 h-14 bg-stone-900/95 border-b border-stone-800 backdrop-blur-sm">
      {/* Title — always visible */}
      <span className="font-semibold flex-1 truncate text-amber-200">⚔️ {title}</span>

      {/* Desktop only: character info inline */}
      {character && (
        <span className="hidden md:flex items-center gap-2 text-sm text-stone-400 mr-4">
          <span>
            🧙 {character.name} · {character.className}
          </span>
          <span className="text-rose-400">
            ❤️ {currentHp}/{maxHp}
          </span>
        </span>
      )}

      {/* AutosaveIndicator — desktop inline */}
      <AutosaveIndicator visible={showAutosaveIndicator} className="hidden md:flex mr-4" />

      {/* Pause button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPauseMenuOpen}
        aria-label="Ouvrir le menu pause"
        className="text-stone-400 hover:bg-stone-800 hover:text-stone-200"
      >
        <span className="md:hidden">⚙️</span>
        <span className="hidden md:inline">⚙️ Menu</span>
      </Button>
    </header>
  );
}
