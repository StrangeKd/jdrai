/**
 * NarrationPanel — scrollable parchment-styled narration area (Story 6.4 Task 4).
 *
 * Shows the current scene text, streaming text, loading state, player echo, and choices.
 * Auto-scrolls to bottom during streaming (AC: #2, #3, #4).
 */
import { useEffect, useRef } from "react";

import type { SuggestedAction } from "@jdrai/shared";

import { ChoiceList } from "./ChoiceList";
import { LoadingNarration } from "./LoadingNarration";
import { StreamingText } from "./StreamingText";

interface NarrationPanelProps {
  currentScene: string;
  streamingBuffer: string;
  playerEcho: string | null;
  choices: SuggestedAction[];
  isLoading: boolean;
  isStreaming: boolean;
  isLocked: boolean;
  onChoiceSelect: (choice: SuggestedAction) => void;
}

export function NarrationPanel({
  currentScene,
  streamingBuffer,
  playerEcho,
  choices,
  isLoading,
  isStreaming,
  isLocked,
  onChoiceSelect,
}: NarrationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new chunks arrive during streaming (AC: #3)
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingBuffer, isStreaming]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Parchment container */}
      <div className="min-h-full mx-auto px-6 py-8 bg-amber-50/5 border-x border-amber-200/10">
        {/* Player echo — visible during loading & streaming (AC: #4, WF-E10-04) */}
        {playerEcho && (
          <div className="mb-6 pl-3 border-l-2 border-amber-400/40">
            <span className="text-sm italic text-amber-300/70">▸ {playerEcho}</span>
          </div>
        )}

        {/* Loading state — before streaming starts (AC: #5) */}
        {isLoading && <LoadingNarration />}

        {/* Streaming text — during active stream (AC: #3) */}
        {isStreaming && (
          <p className="font-serif text-amber-100 leading-relaxed text-base">
            <StreamingText text={streamingBuffer} active={isStreaming} />
          </p>
        )}

        {/* Current scene — shown when not loading/streaming (AC: #2) */}
        {!isLoading && !isStreaming && currentScene && (
          <p className="font-serif text-amber-100 leading-relaxed text-base whitespace-pre-wrap">
            {currentScene}
          </p>
        )}

        {/* Empty state when no scene loaded yet */}
        {!isLoading && !isStreaming && !currentScene && (
          <p className="text-amber-300/40 italic text-center py-8">
            Connexion au Chroniqueur…
          </p>
        )}

        {/* ChoiceList — inline, after narration, only when streaming is complete (AC: #6) */}
        {!isStreaming && choices.length > 0 && (
          <div className="mt-6">
            <ChoiceList choices={choices} disabled={isLocked} onSelect={onChoiceSelect} />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
