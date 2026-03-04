/**
 * Socket service — stub for Story 6.1.
 * Real Socket.io connection (URL, auth, reconnection) wired in Story 6.3.
 *
 * Exports a typed socket-like interface consumed by useGameChat.
 */
import { EventEmitter } from "eventemitter3";

// Game socket event types
export type GameSocketEvents = {
  "game:chunk": [content: string];
  "game:response-complete": [];
  "game:error": [message: string];
  "game:session-start": [adventureId: string];
};

type EventCallback = (...args: unknown[]) => void;

export interface IGameSocket {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, ...args: unknown[]): void;
  connected: boolean;
}

/** Stub socket — replaced with real socket.io instance in Story 6.3 */
class StubGameSocket extends EventEmitter implements IGameSocket {
  readonly connected = false;
}

export const socket: IGameSocket = new StubGameSocket();
