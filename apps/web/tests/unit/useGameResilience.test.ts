/**
 * useGameResilience — Story 7.4 (migrated from useGameSession.resilience.test.ts)
 *
 * Covers:
 *  - rate-limited event → isRateLimited=true + countdown; countdown reaches 0 → isRateLimited=false
 *  - disconnected event → isDisconnected=true; reconnected event → isDisconnected=false
 *  - reconnect-failed event → connectionFailed=true; manualReconnect() resets connectionFailed=false
 *  - isLocked composite is verified at coordinator level (see hooks/__tests__/useGameSession.test.ts)
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — ALL variables referenced in vi.mock() factories must be hoisted
// ---------------------------------------------------------------------------

const {
  manualReconnectMock,
  realRateLimitEmitter,
  realConnectionStatusEmitter,
} = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void;
  function makeEmitter() {
    const handlers = new Map<string, Set<Handler>>();
    return {
      on(event: string, fn: Handler) {
        const s = handlers.get(event) ?? new Set<Handler>();
        s.add(fn);
        handlers.set(event, s);
      },
      off(event: string, fn: Handler) {
        handlers.get(event)?.delete(fn);
      },
      emit(event: string, ...args: unknown[]) {
        for (const fn of handlers.get(event) ?? []) fn(...args);
      },
    };
  }

  return {
    manualReconnectMock: vi.fn(),
    realRateLimitEmitter: makeEmitter(),
    realConnectionStatusEmitter: makeEmitter(),
  };
});

vi.mock("@/services/socket.service", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocket: vi.fn(),
  manualReconnect: manualReconnectMock,
}));

vi.mock("@/services/api", () => ({
  api: { post: vi.fn(), get: vi.fn() },
  rateLimitEmitter: realRateLimitEmitter,
}));

vi.mock("@/lib/emitters", () => ({
  connectionStatusEmitter: realConnectionStatusEmitter,
}));

import { useGameResilience } from "@/hooks/useGameResilience";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useGameResilience", () => {
  beforeEach(() => {
    manualReconnectMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  // ── Rate limiting ──────────────────────────────────────────────────────────

  it("rate-limited event sets isRateLimited=true and rateLimitCountdown", () => {
    const { result } = renderHook(() => useGameResilience());

    expect(result.current.isRateLimited).toBe(false);

    act(() => {
      realRateLimitEmitter.emit("rate-limited", { retryAfter: 30 });
    });

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.rateLimitCountdown).toBe(30);
  });

  it("countdown decrements every second and resets isRateLimited when reaching 0", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameResilience());

    act(() => {
      realRateLimitEmitter.emit("rate-limited", { retryAfter: 3 });
    });

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.rateLimitCountdown).toBe(3);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.rateLimitCountdown).toBe(2);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.rateLimitCountdown).toBe(1);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.rateLimitCountdown).toBe(0);
    expect(result.current.isRateLimited).toBe(false);

    vi.useRealTimers();
  });

  // ── Connection loss ────────────────────────────────────────────────────────

  it("disconnected event sets isDisconnected=true", () => {
    const { result } = renderHook(() => useGameResilience());

    expect(result.current.isDisconnected).toBe(false);

    act(() => {
      realConnectionStatusEmitter.emit("disconnected", { reason: "transport close" });
    });

    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.connectionFailed).toBe(false);
  });

  it("reconnected event sets isDisconnected=false and connectionFailed=false", () => {
    const { result } = renderHook(() => useGameResilience());

    act(() => {
      realConnectionStatusEmitter.emit("disconnected", { reason: "transport close" });
    });
    expect(result.current.isDisconnected).toBe(true);

    act(() => {
      realConnectionStatusEmitter.emit("reconnected");
    });

    expect(result.current.isDisconnected).toBe(false);
    expect(result.current.connectionFailed).toBe(false);
  });

  it("reconnect-failed event sets connectionFailed=true", () => {
    const { result } = renderHook(() => useGameResilience());

    act(() => {
      realConnectionStatusEmitter.emit("disconnected", { reason: "transport close" });
    });
    act(() => {
      realConnectionStatusEmitter.emit("reconnect-failed");
    });

    expect(result.current.connectionFailed).toBe(true);
  });

  it("manualReconnect() resets connectionFailed=false, isDisconnected=true, calls socketManualReconnect", () => {
    const { result } = renderHook(() => useGameResilience());

    act(() => {
      realConnectionStatusEmitter.emit("disconnected", { reason: "transport close" });
      realConnectionStatusEmitter.emit("reconnect-failed");
    });

    expect(result.current.connectionFailed).toBe(true);

    act(() => {
      result.current.manualReconnect();
    });

    expect(result.current.connectionFailed).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
    expect(manualReconnectMock).toHaveBeenCalledOnce();
  });
});
