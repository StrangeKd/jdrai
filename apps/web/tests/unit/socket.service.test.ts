import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  socketHandlers,
  managerHandlers,
  emitMock,
  disconnectMock,
  reconnectMock,
  socketMock,
  ioFactoryMock,
  connectionStatusEmitMock,
} = vi.hoisted(() => {
  const localSocketHandlers = new Map<string, (...args: unknown[]) => void>();
  const localManagerHandlers = new Map<string, (...args: unknown[]) => void>();
  const localEmitMock = vi.fn();
  const localDisconnectMock = vi.fn();
  const localReconnectMock = vi.fn();

  const localSocketMock = {
    connected: false,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      localSocketHandlers.set(event, handler);
      return localSocketMock;
    }),
    emit: localEmitMock,
    disconnect: localDisconnectMock,
    connect: localReconnectMock,
    io: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        localManagerHandlers.set(event, handler);
        return localSocketMock.io;
      }),
    },
  };

  return {
    socketHandlers: localSocketHandlers,
    managerHandlers: localManagerHandlers,
    emitMock: localEmitMock,
    disconnectMock: localDisconnectMock,
    reconnectMock: localReconnectMock,
    socketMock: localSocketMock,
    ioFactoryMock: vi.fn(() => localSocketMock),
    connectionStatusEmitMock: vi.fn(),
  };
});

vi.mock("socket.io-client", () => ({
  io: ioFactoryMock,
}));

vi.mock("@/lib/emitters", () => ({
  connectionStatusEmitter: {
    emit: connectionStatusEmitMock,
  },
}));

import { connect, disconnect, manualReconnect } from "@/services/socket.service";

describe("socket.service", () => {
  beforeEach(() => {
    socketHandlers.clear();
    managerHandlers.clear();
    emitMock.mockReset();
    disconnectMock.mockReset();
    reconnectMock.mockReset();
    ioFactoryMock.mockClear();
    connectionStatusEmitMock.mockClear();
    socketMock.connected = false;
  });

  afterEach(() => {
    disconnect();
  });

  it("registers manager reconnect handlers and resyncs on reconnect", () => {
    connect("adv-1");

    expect(ioFactoryMock).toHaveBeenCalledTimes(1);
    expect(managerHandlers.has("reconnect")).toBe(true);
    expect(managerHandlers.has("reconnect_failed")).toBe(true);

    const reconnectHandler = managerHandlers.get("reconnect");
    expect(reconnectHandler).toBeDefined();
    reconnectHandler?.();

    expect(connectionStatusEmitMock).toHaveBeenCalledWith("reconnected");
    expect(emitMock).toHaveBeenCalledWith("game:join", { adventureId: "adv-1" });
    expect(emitMock).toHaveBeenCalledWith("game:resync", { adventureId: "adv-1" });
  });

  it("emits disconnected status on socket disconnect", () => {
    connect("adv-1");

    const disconnectHandler = socketHandlers.get("disconnect");
    expect(disconnectHandler).toBeDefined();
    disconnectHandler?.("transport close");

    expect(connectionStatusEmitMock).toHaveBeenCalledWith("disconnected", {
      reason: "transport close",
    });
  });

  it("emits reconnect-failed status on manager reconnect_failed", () => {
    connect("adv-1");

    const reconnectFailedHandler = managerHandlers.get("reconnect_failed");
    expect(reconnectFailedHandler).toBeDefined();
    reconnectFailedHandler?.();

    expect(connectionStatusEmitMock).toHaveBeenCalledWith("reconnect-failed");
  });

  it("manualReconnect calls socket.connect()", () => {
    connect("adv-1");
    manualReconnect();
    expect(reconnectMock).toHaveBeenCalledTimes(1);
  });
});
