/**
 * emitters.ts — Shared event emitters for cross-component resilience signals (Story 6.8 Task 1).
 *
 * connectionStatusEmitter: fired by socket.service.ts on disconnect / reconnect / reconnect-failed.
 * Consumed by useGameSession to drive connection loss UI.
 *
 * Note: rateLimitEmitter lives in services/api.ts (already created before this file was added).
 */
import EventEmitter from "eventemitter3";

type ConnectionStatusEvents = {
  disconnected: [{ reason: string }];
  reconnected: [];
  "reconnect-failed": [];
};

export const connectionStatusEmitter = new EventEmitter<ConnectionStatusEvents>();
