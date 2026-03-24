import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SocketCallback = (...args: unknown[]) => void;
const { streamMock, useChatMock, apiPostMock, listeners, socket } = vi.hoisted(() => {
  const localListeners = new Map<string, Set<SocketCallback>>();
  const localSocket = {
    connected: true,
    on: vi.fn((event: string, callback: SocketCallback) => {
      const eventListeners = localListeners.get(event) ?? new Set<SocketCallback>();
      eventListeners.add(callback);
      localListeners.set(event, eventListeners);
    }),
    off: vi.fn((event: string, callback: SocketCallback) => {
      localListeners.get(event)?.delete(callback);
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      for (const callback of localListeners.get(event) ?? []) {
        callback(...args);
      }
    }),
  };

  return {
    streamMock: vi.fn(<T>(factory: T) => ({ connect: factory })),
    useChatMock: vi.fn(() => ({
      messages: [],
      sendMessage: vi.fn(),
      isLoading: false,
      stop: vi.fn(),
      error: undefined,
    })),
    apiPostMock: vi.fn(),
    listeners: localListeners,
    socket: localSocket,
  };
});

vi.mock("@tanstack/ai-react", () => ({
  stream: streamMock,
  useChat: useChatMock,
}));

vi.mock("@/services/api", () => ({
  api: {
    post: apiPostMock,
  },
}));

vi.mock("@/services/socket.service", () => ({
  getSocket: () => socket,
}));

import { createSocketAdapter, useGameChat } from "@/hooks/useGameChat";

function makeUserMessage(content: string) {
  return [
    {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", content }],
    },
  ];
}

function makeUserMessageWithChoice(content: string, choiceId: string) {
  return [
    {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", content }],
      metadata: { choiceId },
    },
  ];
}

describe("useGameChat socket adapter", () => {
  beforeEach(() => {
    socket.connected = true;
    listeners.clear();
    apiPostMock.mockReset();
    apiPostMock.mockResolvedValue({ success: true });
    streamMock.mockClear();
    useChatMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fails fast when socket is disconnected", async () => {
    socket.connected = false;

    const adapter = createSocketAdapter("adv-1") as {
      connect: (messages: ReturnType<typeof makeUserMessage>) => AsyncIterable<unknown>;
    };
    const iterator = adapter.connect(makeUserMessage("hello"))[Symbol.asyncIterator]();

    await expect(iterator.next()).rejects.toThrow("Game socket is not connected");
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("does not deadlock and throws when server emits game:error", async () => {
    const adapter = createSocketAdapter("adv-2") as {
      connect: (messages: ReturnType<typeof makeUserMessage>) => AsyncIterable<unknown>;
    };
    const iterator = adapter.connect(makeUserMessage("open the door"))[Symbol.asyncIterator]();

    const pending = iterator.next();
    await Promise.resolve();
    socket.emit("game:error", "boom");

    await expect(pending).rejects.toThrow("Game stream error: boom");
  });

  it("finishes stream when server emits response-complete", async () => {
    const adapter = createSocketAdapter("adv-3") as {
      connect: (messages: ReturnType<typeof makeUserMessage>) => AsyncIterable<unknown>;
    };
    const iterator = adapter.connect(makeUserMessage("look around"))[Symbol.asyncIterator]();

    const pending = iterator.next();
    await Promise.resolve();
    socket.emit("game:response-complete");

    await expect(pending).resolves.toEqual({ value: undefined, done: true });
  });

  it("wires useChat with the socket adapter connection", () => {
    useGameChat("adv-hook");

    expect(useChatMock).toHaveBeenCalledOnce();
    expect(useChatMock).toHaveBeenCalledWith(
      expect.objectContaining({ connection: expect.anything() }),
    );
  });

  it("forwards choiceId when present in message metadata", async () => {
    const adapter = createSocketAdapter("adv-choice") as {
      connect: (messages: ReturnType<typeof makeUserMessageWithChoice>) => AsyncIterable<unknown>;
    };
    const iterator = adapter.connect(makeUserMessageWithChoice("attack", "choice-7"))[Symbol.asyncIterator]();

    const pending = iterator.next();
    await Promise.resolve();
    socket.emit("game:response-complete", { adventureId: "adv-choice" });
    await pending;

    expect(apiPostMock).toHaveBeenCalledWith("/api/adventures/adv-choice/action", {
      action: "attack",
      choiceId: "choice-7",
    });
  });

  it("ignores response-complete from another adventure", async () => {
    const adapter = createSocketAdapter("adv-main") as {
      connect: (messages: ReturnType<typeof makeUserMessage>) => AsyncIterable<unknown>;
    };
    const iterator = adapter.connect(makeUserMessage("inspect room"))[Symbol.asyncIterator]();

    const pending = iterator.next();
    await Promise.resolve();
    socket.emit("game:response-complete", { adventureId: "adv-other" });
    socket.emit("game:response-complete", { adventureId: "adv-main" });

    await expect(pending).resolves.toEqual({ value: undefined, done: true });
  });
});
