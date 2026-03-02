import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Called when backend reports active adventures limit reached (409). */
  onLimitReached?: () => void;
}

const MAX_RETRIES = 2; // 3 total attempts (0, 1, 2)

/** WF-E9-04 — Full-screen loading with API call, retry logic, 15s timeout message. */
export function AdventureLoadingScreen({
  config,
  hiddenParams,
  durationLabel,
  difficultyLabel,
  onError,
  onLimitReached,
}: AdventureLoadingScreenProps) {
  const createAdventure = useCreateAdventure();
  const queryClient = useQueryClient();
  const retryCount = useRef(0);
  // Guards against React StrictMode double-invocation of useEffect on mount
  const hasStarted = useRef(false);
  // Tracks the pending retry timer so it can be cancelled on unmount
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [showDelayMessage, setShowDelayMessage] = useState(false);
  const setHideNav = useUIStore((s) => s.setHideNav);

  // Hide navigation for the duration of this screen
  useEffect(() => {
    setHideNav(true);
    return () => setHideNav(false);
  }, [setHideNav]);

  // Cancel any pending retry timer on unmount to prevent post-unmount state updates
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

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
      // Special case: adventure limit — refresh active adventures and leave loading state.
      if (error instanceof ApiError && error.code === "MAX_ACTIVE_ADVENTURES") {
        await queryClient.invalidateQueries({ queryKey: ["adventures", "active"] });
        if (onLimitReached) {
          onLimitReached();
        } else {
          onError();
        }
        return;
      }

      retryCount.current += 1;
      if (retryCount.current <= MAX_RETRIES) {
        // Auto-retry (invisible to user) — timer ref allows cancellation on unmount
        retryTimerRef.current = setTimeout(() => void attemptCreate(), 1500);
      } else {
        // 3rd failure: show error screen
        onError();
      }
    }
  }, [config, createAdventure, onError, onLimitReached, queryClient]);

  // Fires effectively once per screen lifecycle. The hasStarted ref guards against
  // StrictMode double effect invocation in development.
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    void attemptCreate();
  }, [attemptCreate]);

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
