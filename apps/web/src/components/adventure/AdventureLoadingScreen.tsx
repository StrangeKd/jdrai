import { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import type { AdventureCreateInput } from "@jdrai/shared";

import { ApiError } from "@/services/api";
import { useUIStore } from "@/stores/ui.store";

import { useCreateAdventure } from "../../hooks/useAdventures";

interface AdventureLoadingScreenProps {
  /** Full create input to POST to the API. */
  config: AdventureCreateInput;
  /** Whether the player chose "Accepter l'inconnu" (hide params). */
  hiddenParams: boolean;
  /** Params display labels (only shown when !hiddenParams). */
  durationLabel?: string;
  difficultyLabel?: string;
  /** Called after 3 consecutive POST failures. */
  onError: () => void;
}

const MAX_RETRIES = 2; // 3 total attempts (0, 1, 2)

/** WF-E9-04 — Full-screen loading with API call, retry logic, 15s timeout message. */
export function AdventureLoadingScreen({
  config,
  hiddenParams,
  durationLabel,
  difficultyLabel,
  onError,
}: AdventureLoadingScreenProps) {
  const createAdventure = useCreateAdventure();
  const navigate = useNavigate();
  const retryCount = useRef(0);
  // Guards against React StrictMode double-invocation of useEffect on mount
  const hasStarted = useRef(false);
  const [showDelayMessage, setShowDelayMessage] = useState(false);
  const { setHideNav } = useUIStore.getState();

  // Hide navigation for the duration of this screen
  useEffect(() => {
    setHideNav(true);
    return () => setHideNav(false);
  }, [setHideNav]);

  // 15-second timeout message
  useEffect(() => {
    const timer = setTimeout(() => setShowDelayMessage(true), 15_000);
    return () => clearTimeout(timer);
  }, []);

  const attemptCreate = useCallback(async () => {
    try {
      await createAdventure.mutateAsync(config);
      // onSuccess in the mutation hook handles navigation
    } catch (error) {
      // Special case: adventure limit — navigate back immediately, no retry
      if (error instanceof ApiError && error.code === "MAX_ACTIVE_ADVENTURES") {
        await navigate({ to: "/adventure/new" });
        return;
      }

      retryCount.current += 1;
      if (retryCount.current <= MAX_RETRIES) {
        // Auto-retry (invisible to user)
        setTimeout(() => void attemptCreate(), 1500);
      } else {
        // 3rd failure: show error screen
        onError();
      }
    }
  }, [config, createAdventure, navigate, onError]);

  // Trigger once on mount — ref guard prevents React StrictMode double-invocation
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    void attemptCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-stone-950 px-6 text-center"
      role="status"
      aria-live="polite"
      aria-label="Chargement de l'aventure"
    >
      {/* Animated sword icon */}
      <span className="text-5xl animate-pulse" aria-hidden="true">⚔️</span>

      {/* Loading text */}
      <p className="text-lg font-semibold text-amber-100">
        Le Maître du Jeu prépare votre aventure...
      </p>

      {/* Indeterminate progress bar (CSS animation — no fixed value) */}
      <div className="w-full max-w-xs h-2 bg-stone-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Timeout message */}
      {showDelayMessage && (
        <p className="text-sm text-stone-400 italic animate-pulse">
          Cela prend plus de temps que prévu...
        </p>
      )}

      {/* Params recap */}
      <div className="text-sm text-stone-400 space-y-1">
        {hiddenParams ? (
          <p className="italic">Le destin est en marche...</p>
        ) : (
          <>
            <p><span aria-hidden="true">📖</span> Heroic Fantasy</p>
            {durationLabel && <p><span aria-hidden="true">⏱️</span> {durationLabel}</p>}
            {difficultyLabel && <p><span aria-hidden="true">⚖️</span> {difficultyLabel}</p>}
          </>
        )}
      </div>

      {/* Companion placeholder (P3) */}
      {/* TODO(P3): companion/mascotte area */}
    </div>
  );
}
