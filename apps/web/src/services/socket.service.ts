/**
 * socket.service.ts — Socket.io client singleton for game sessions (Story 6.4 Task 1).
 *
 * Connects to the backend with Better Auth session cookies (withCredentials: true).
 * Joins the adventure room on connect so the client receives all game:* events.
 *
 * Usage:
 *   connect(adventureId)  — call on game session mount
 *   disconnect()           — call on game session unmount
 *   getSocket()            — access socket instance (e.g. to register event listeners)
 */
import { io, type Socket } from "socket.io-client";

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
  });

  _socket.on("connect", () => {
    _socket!.emit("game:join", { adventureId });
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
