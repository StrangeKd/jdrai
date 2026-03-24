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

/**
 * Connects to the Socket.io server and joins the adventure room.
 * Idempotent: returns the existing socket if already connected.
 */
export function connect(adventureId: string): Socket {
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
  _socket?.disconnect();
  _socket = null;
}

/** Returns the current socket instance, or null if not yet connected. */
export function getSocket(): Socket | null {
  return _socket;
}
