/**
 * useGameResilience — network resilience state for the game session.
 *
 * Responsibilities:
 *  - Subscribe to rateLimitEmitter: tracks isRateLimited + rateLimitCountdown
 *  - Subscribe to connectionStatusEmitter: tracks isDisconnected + connectionFailed
 *  - Expose manualReconnect() to reset failure state and retry
 *
 * Standalone hook — no inputs required. Used as a sub-hook by useGameSession (Story 7.4).
 */
import { useEffect, useRef, useState } from "react";

import { connectionStatusEmitter } from "@/lib/emitters";
import { rateLimitEmitter } from "@/services/api";
import { manualReconnect as socketManualReconnect } from "@/services/socket.service";

export interface GameResilienceState {
  /** true while the server is rate-limiting requests (HTTP 429) */
  isRateLimited: boolean;
  /** Countdown in seconds until rate-limit lifts (0 when not rate-limited) */
  rateLimitCountdown: number;
  /** true while the Socket.io connection is lost and auto-reconnection is in progress */
  isDisconnected: boolean;
  /** true when all 3 reconnection attempts have been exhausted (permanent failure state) */
  connectionFailed: boolean;
  /** Manually restart Socket.io connection attempts after permanent failure */
  manualReconnect: () => void;
}

export function useGameResilience(): GameResilienceState {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);

  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rate-limit emitter subscription
  useEffect(() => {
    const onRateLimited = ({ retryAfter }: { retryAfter: number }) => {
      setIsRateLimited(true);
      setRateLimitCountdown(retryAfter);

      if (rateLimitIntervalRef.current) clearInterval(rateLimitIntervalRef.current);

      rateLimitIntervalRef.current = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(rateLimitIntervalRef.current!);
            rateLimitIntervalRef.current = null;
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    rateLimitEmitter.on("rate-limited", onRateLimited);
    return () => {
      rateLimitEmitter.off("rate-limited", onRateLimited);
      if (rateLimitIntervalRef.current) clearInterval(rateLimitIntervalRef.current);
    };
  }, []);

  // Connection status emitter subscription
  useEffect(() => {
    const onDisconnected = () => {
      setIsDisconnected(true);
      setConnectionFailed(false);
    };
    const onReconnected = () => {
      setIsDisconnected(false);
      setConnectionFailed(false);
    };
    const onReconnectFailed = () => {
      setConnectionFailed(true);
    };

    connectionStatusEmitter.on("disconnected", onDisconnected);
    connectionStatusEmitter.on("reconnected", onReconnected);
    connectionStatusEmitter.on("reconnect-failed", onReconnectFailed);
    return () => {
      connectionStatusEmitter.off("disconnected", onDisconnected);
      connectionStatusEmitter.off("reconnected", onReconnected);
      connectionStatusEmitter.off("reconnect-failed", onReconnectFailed);
    };
  }, []);

  function handleManualReconnect(): void {
    setConnectionFailed(false);
    setIsDisconnected(true); // Shows "reconnecting" banner while new attempts run
    socketManualReconnect();
  }

  return {
    isRateLimited,
    rateLimitCountdown,
    isDisconnected,
    connectionFailed,
    manualReconnect: handleManualReconnect,
  };
}
