/**
 * Game session route — /adventure/:id (Story 6.4 Task 3).
 *
 * Full-screen immersive mode: navigation chrome is hidden by AppLayout.shouldHideNav().
 * Uses useGameSession for all game state (socket + REST).
 * Story 6.5 will fill in SessionHeader and CharacterPanel placeholders.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { FreeInput } from "@/components/game/FreeInput";
import { NarrationPanel } from "@/components/game/NarrationPanel";
import { useGameSession } from "@/hooks/useGameSession";

export const Route = createFileRoute("/_authenticated/adventure/$id")({
  component: GameSessionPage,
});

function GameSessionPage() {
  const { id: adventureId } = Route.useParams();

  const {
    gameState,
    currentScene,
    streamingBuffer,
    playerEcho,
    choices,
    isLoading,
    isStreaming,
    gameError,
    sendAction,
  } = useGameSession(adventureId);

  const isLocked = isLoading || isStreaming;
  const adventureTitle = gameState?.adventure.title ?? "Aventure";

  // ---------------------------------------------------------------------------
  // Desktop keyboard shortcuts (AC: #10)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === "INPUT";

      // Keys 1–4: select a suggested choice
      if (!isInputFocused && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        const choice = choices[idx];
        if (choice && !isLocked) {
          void sendAction(choice.label, choice.id);
        }
      }

      // Enter: focus free input when not focused
      if (!isInputFocused && e.key === "Enter") {
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Votre action"]');
        if (input && !isLocked) {
          e.preventDefault();
          input.focus();
        }
      }

      // Escape: placeholder for Story 6.5 pause menu
      if (e.key === "Escape") {
        // TODO Story 6.5: setShowPauseMenu(true)
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, isLocked, sendAction]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-950 text-amber-100 overflow-hidden">
      {/* SessionHeader placeholder — Story 6.5 will complete this */}
      <header className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-stone-800 bg-stone-900">
        <span className="text-sm font-medium text-amber-200 truncate">{adventureTitle}</span>
        {/* TODO Story 6.5: pause menu button */}
      </header>

      {/* CharacterPanel placeholder — Story 6.5 will implement this */}
      {/* Height reserved so layout doesn't shift when CharacterPanel is added */}
      <div className="shrink-0 h-10" aria-hidden="true" />

      {/* NarrationPanel — fills all remaining space (AC: #2) */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
        <div className="w-full max-w-[720px]">
          {/* AC: #9 — desktop: max-width 720px centered */}
          <NarrationPanel
            currentScene={currentScene}
            streamingBuffer={streamingBuffer}
            playerEcho={playerEcho}
            choices={choices}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isLocked={isLocked}
            onChoiceSelect={(choice) => void sendAction(choice.label, choice.id)}
          />
        </div>
      </div>

      {/* Game error banner */}
      {gameError && (
        <div
          role="alert"
          className="shrink-0 px-4 py-2 bg-red-900/80 text-red-200 text-sm text-center border-t border-red-700"
        >
          {gameError}
        </div>
      )}

      {/* FreeInput — fixed at bottom of screen (AC: #7) */}
      <div className="shrink-0">
        <FreeInput
          disabled={isLocked}
          isStreaming={isStreaming}
          isLoading={isLoading}
          onSubmit={(text) => void sendAction(text)}
          onHistoryClick={() => {
            // TODO Story 6.6: open HistoryDrawer
          }}
        />
      </div>
    </div>
  );
}
