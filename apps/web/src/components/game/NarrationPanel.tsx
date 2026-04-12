/**
 * NarrationPanel — scrollable parchment-styled narration area (Story 6.4 Task 4 / Story 6.8 Task 7).
 *
 * Shows the current scene text, streaming text, loading state, player echo, and choices.
 * Story 6.8: adds ConnectionLostBanner, LLMErrorMessage, RateLimitMessage.
 * Auto-scrolls to bottom during streaming (AC: #2, #3, #4).
 */
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { SuggestedAction } from "@jdrai/shared";

import { ChoiceList } from "./ChoiceList";
import { ConnectionLostBanner } from "./ConnectionLostBanner";
import { LLMErrorMessage } from "./LLMErrorMessage";
import { LoadingNarration } from "./LoadingNarration";
import { RateLimitMessage } from "./RateLimitMessage";
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
  // Story 6.8 — Resilience props
  isDisconnected: boolean;
  connectionFailed: boolean;
  hasLLMError: boolean;
  isRateLimited: boolean;
  rateLimitCountdown: number;
  onReconnectRetry: () => void;
  onLLMRetry: () => void;
  /** Optional replacement for the default ChoiceList area (e.g. tutorial PresetSelector). */
  choicesSlot?: ReactNode;
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
  isDisconnected,
  connectionFailed,
  hasLLMError,
  isRateLimited,
  rateLimitCountdown,
  onReconnectRetry,
  onLLMRetry,
  choicesSlot,
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
        {/* 1. Connection lost banner — non-blocking, top of narration area (Story 6.8 AC: #3, #8) */}
        <ConnectionLostBanner
          visible={isDisconnected || connectionFailed}
          failed={connectionFailed}
          onRetry={onReconnectRetry}
        />

        {/* 2. Player echo — visible during loading & streaming (AC: #4, WF-E10-04) */}
        {playerEcho && (
          <div className="mb-6 pl-3 border-l-2 border-amber-400/40">
            <span className="text-sm italic text-amber-300/70">▸ {playerEcho}</span>
          </div>
        )}

        {/* 3. Main content — mutually exclusive states (Story 6.8 adds LLM error) */}
        {hasLLMError ? (
          <LLMErrorMessage visible onRetry={onLLMRetry} />
        ) : isLoading ? (
          <LoadingNarration />
        ) : isStreaming ? (
          <p className="font-serif text-amber-100 leading-relaxed text-base">
            <StreamingText text={streamingBuffer} active={isStreaming} />
          </p>
        ) : currentScene ? (
          <p className="font-serif text-amber-100 leading-relaxed text-base whitespace-pre-wrap">
            {currentScene}
          </p>
        ) : (
          <p className="text-amber-300/40 italic text-center py-8">
            Connexion au Chroniqueur…
          </p>
        )}

        {/* 4. Choices area — default ChoiceList or optional replacement slot */}
        {!isStreaming && !hasLLMError && (
          <div className="mt-6">
            {choicesSlot ?? (
              <>
                {choices.length > 0 && (
                  <ChoiceList choices={choices} disabled={isLocked} onSelect={onChoiceSelect} />
                )}
              </>
            )}
          </div>
        )}

        {/* 5. Rate limit message — below choices (Story 6.8 AC: #1) */}
        <RateLimitMessage visible={isRateLimited} countdown={rateLimitCountdown} />

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
