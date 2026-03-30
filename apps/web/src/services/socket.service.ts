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
// Story 6.8 — tracks whether we went through a disconnect so the `connect` handler
// can distinguish an initial connection from a manual re-connect.
let _wasDisconnected = false;

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
    if (_wasDisconnected) {
      // Manual re-connect after reconnect_failed succeeded — notify UI and resync state.
      _wasDisconnected = false;
      connectionStatusEmitter.emit("reconnected");
      if (_currentAdventureId) {
        _socket!.emit("game:join", { adventureId: _currentAdventureId });
        _socket!.emit("game:resync", { adventureId: _currentAdventureId });
      }
    } else if (_currentAdventureId) {
      _socket!.emit("game:join", { adventureId: _currentAdventureId });
    }
  });

  // Story 6.8 — disconnection: notify UI to show connection lost banner
  _socket.on("disconnect", (reason: string) => {
    _wasDisconnected = true;
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
  _wasDisconnected = false;
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

  // ---------------------------------------------------------------------------
  // DEV test plan helpers — Story 7.1
  // Usage: const ops = __devAdventureOps("<adventure-uuid>")
  //   ops.abandon()                  — PATCH status=abandoned             (test plan #1)
  //   ops.complete()                 — PATCH status=completed             (test plan #2)
  //   ops.completeTwice()            — complete then complete again → 400  (test plan #3)
  //   ops.getMilestones()            — GET /milestones ordered sortOrder   (test plan #4)
  //   ops.triggerAdventureComplete() — signal ADVENTURE_COMPLETE           (test plan #5)
  //   ops.triggerGameOver()          — signal GAME_OVER                    (test plan #6)
  //   ops.triggerLlmFail()           — completed + narrativeSummary=null   (test plan #7)
  // ---------------------------------------------------------------------------
  (window as unknown as Record<string, unknown>).__devAdventureOps = (adventureId: string) => {
    const base = API_BASE;

    const patch = async (status: "abandoned" | "completed") => {
      const r = await fetch(`${base}/api/v1/adventures/${adventureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json: unknown = await r.json();
      console.log(`[DEV] PATCH status=${status} → HTTP ${r.status}`, json);
      return json;
    };

    const triggerSignal = async (signal: "ADVENTURE_COMPLETE" | "GAME_OVER" | "LLM_FAIL") => {
      const r = await fetch(`${base}/api/dev/adventures/${adventureId}/trigger-signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ signal }),
      });
      const json: unknown = await r.json();
      console.log(`[DEV] trigger signal=${signal} → HTTP ${r.status}`, json);
      return json;
    };

    return {
      /** Test plan #1 — PATCH abandoned → 200 + status=abandoned */
      abandon: () => patch("abandoned"),
      /** Test plan #2 — PATCH completed → 200 + completedAt set */
      complete: () => patch("completed"),
      /** Test plan #3 — PATCH completed twice → second call should return 400 INVALID_TRANSITION */
      completeTwice: async () => {
        console.log("[DEV] Step 1: complete adventure…");
        await patch("completed");
        console.log("[DEV] Step 2: complete again — expect 400 INVALID_TRANSITION");
        return patch("completed");
      },
      /** Test plan #4 — GET milestones → list ordered by sortOrder ASC */
      getMilestones: async () => {
        const r = await fetch(`${base}/api/v1/adventures/${adventureId}/milestones`, {
          credentials: "include",
        });
        const json: unknown = await r.json();
        console.log(`[DEV] GET milestones → HTTP ${r.status}`, json);
        return json;
      },
      /** Test plan #5 — [ADVENTURE_COMPLETE] → isGameOver=false in DB + async summary */
      triggerAdventureComplete: () => triggerSignal("ADVENTURE_COMPLETE"),
      /** Test plan #6 — [GAME_OVER] → isGameOver=true in DB + solemn summary */
      triggerGameOver: () => triggerSignal("GAME_OVER"),
      /** Test plan #7 — LLM summary failure → completed + narrativeSummary=null + no crash */
      triggerLlmFail: () => triggerSignal("LLM_FAIL"),
    };
  };

  console.info(
    "[DEV] __devAdventureOps(adventureId) available — story 7.1 test plan helpers. See socket.service.ts for docs.",
  );
}
