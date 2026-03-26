/**
 * socket.service.ts — Socket.io client singleton for game sessions (Story 6.4 Task 1 / Story 6.8 Task 2).
 *
 * Connects to the backend with Better Auth session cookies (withCredentials: true).
 * Joins the adventure room on connect so the client receives all game:* events.
 *
 * Story 6.8 additions:
 *  - reconnectionAttempts: 3 (gives up after 3 failed attempts)
 *  - Emits connectionStatusEmitter events on disconnect / reconnect / reconnect_failed
 *  - Re-emits game:join + game:resync on reconnection to reload state
 *  - Exposes manualReconnect() to restart connection after reconnect_failed
 *
 * Usage:
 *   connect(adventureId)  — call on game session mount
 *   disconnect()           — call on game session unmount
 *   getSocket()            — access socket instance (e.g. to register event listeners)
 *   manualReconnect()      — restart connection attempts after reconnect_failed
 */
import { io, type Socket } from "socket.io-client";

import { connectionStatusEmitter } from "@/lib/emitters";

// Use VITE_API_URL when defined (explicit cross-origin setup).
// Falls back to empty string → socket.io uses current window origin (same-origin / reverse proxy in prod).
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

let _socket: Socket | null = null;
let _currentAdventureId: string | null = null;

/**
 * Connects to the Socket.io server and joins the adventure room.
 * Idempotent: returns the existing socket if already connected.
 */
export function connect(adventureId: string): Socket {
  _currentAdventureId = adventureId;
  if (_socket?.connected) {
    // Socket already connected — re-emit join in case of route re-mount
    _socket.emit("game:join", { adventureId });
    return _socket;
  }

  _socket = io(API_BASE, {
    withCredentials: true, // Send Better Auth session cookie
    transports: ["websocket"],
    reconnectionAttempts: 3, // Story 6.8: give up after 3 failed reconnection attempts
  });

  _socket.on("connect", () => {
    if (_currentAdventureId) {
      _socket!.emit("game:join", { adventureId: _currentAdventureId });
    }
  });

  // Story 6.8 — disconnection: notify UI to show connection lost banner
  _socket.on("disconnect", (reason: string) => {
    connectionStatusEmitter.emit("disconnected", { reason });
  });

  // Story 6.8 — reconnection events are emitted by the underlying Manager (socket.io)
  _socket.io.on("reconnect", () => {
    connectionStatusEmitter.emit("reconnected");
    if (_currentAdventureId) {
      // Room memberships are lost on disconnect — must re-join
      _socket!.emit("game:join", { adventureId: _currentAdventureId });
      // Request a fresh game:state-snapshot from the server
      _socket!.emit("game:resync", { adventureId: _currentAdventureId });
    }
  });

  // Story 6.8 — all 3 reconnection attempts exhausted: notify UI for permanent failure
  _socket.io.on("reconnect_failed", () => {
    connectionStatusEmitter.emit("reconnect-failed");
  });

  return _socket;
}

/** Disconnects from the Socket.io server and clears the singleton. */
export function disconnect(): void {
  if (_socket?.connected && _currentAdventureId) {
    _socket.emit("game:leave", { adventureId: _currentAdventureId });
  }
  _socket?.disconnect();
  _socket = null;
  _currentAdventureId = null;
}

/** Returns the current socket instance, or null if not yet connected. */
export function getSocket(): Socket | null {
  return _socket;
}

/**
 * Story 6.8 — Manually restart Socket.io connection attempts after reconnect_failed.
 * Calling socket.connect() resets the internal attempt counter so Socket.io will
 * try up to reconnectionAttempts times again before firing reconnect_failed.
 */
export function manualReconnect(): void {
  _socket?.connect();
}

// ---------------------------------------------------------------------------
// DEV-only debug helper
// Exposes window.__triggerGameEvent(event, payload) in the browser console
// so socket event handlers can be tested without a real server response.
//
// Usage:
//   __triggerGameEvent('game:state-update', { type: 'milestone_complete', nextMilestone: 'La Forêt Sombre' })
//   __triggerGameEvent('game:state-update', { type: 'hp_change', currentHp: 5, maxHp: 20 })
//   __triggerGameEvent('game:response-start', { adventureId: '<id>' })
// ---------------------------------------------------------------------------

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__triggerGameEvent = (
    event: string,
    payload: unknown,
  ) => {
    const sock = getSocket();
    if (!sock) {
      console.warn("[DEV] No active socket — navigate to /adventure/:id first");
      return;
    }
    sock.listeners(event).forEach((fn) => (fn as (p: unknown) => void)(payload));
    console.log(`[DEV] Triggered "${event}"`, payload);
  };
}
