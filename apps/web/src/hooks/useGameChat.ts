/**
 * useGameChat — TanStack AI hook bridging Socket.io game events to the useChat API.
 *
 * Architecture:
 *  sendMessage() → adapter.connect() → POST /api/adventures/:id/action
 *                                     → socket "game:chunk" events → AG-UI StreamChunks
 *                                     → useChat manages messages / isLoading state
 *
 * This hook is wired into the game screen UI in Story 6.4.
 * The socket connection is established by useGameSession (Story 6.4 Task 2).
 */
import type { StreamChunk } from "@tanstack/ai";
import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { stream, useChat } from "@tanstack/ai-react";

import { api } from "@/services/api";
import { getSocket } from "@/services/socket.service";

const ACTION_REQUEST_TIMEOUT_MS = 10_000;
const STREAM_IDLE_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// Async queue — bridges event-based Socket.io to AsyncIterable<StreamChunk>
// ---------------------------------------------------------------------------

/** Minimal async queue that allows pushing items and closing the stream */
class AsyncQueue<T> {
  private items: T[] = [];
  private resolvers: Array<(result: IteratorResult<T, undefined>) => void> = [];
  private closed = false;

  push(item: T): void {
    if (this.resolvers.length > 0) {
      this.resolvers.shift()!({ value: item, done: false });
    } else {
      this.items.push(item);
    }
  }

  close(): void {
    this.closed = true;
    for (const resolve of this.resolvers) {
      resolve({ value: undefined, done: true });
    }
    this.resolvers = [];
  }

  [Symbol.asyncIterator](): AsyncIterator<T, undefined> {
    return {
      next: (): Promise<IteratorResult<T, undefined>> => {
        if (this.items.length > 0) {
          return Promise.resolve({ value: this.items.shift()!, done: false });
        }
        if (this.closed) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise<IteratorResult<T, undefined>>((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

// ---------------------------------------------------------------------------
// UIMessage helpers
// ---------------------------------------------------------------------------

/** Extract plain text from a UIMessage's parts array */
function extractTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

// ---------------------------------------------------------------------------
// Socket adapter factory
// ---------------------------------------------------------------------------

/**
 * Creates a ConnectionAdapter that:
 * 1. POSTs the player action via REST API
 * 2. Bridges Socket.io game:chunk events → AsyncIterable<StreamChunk> (AG-UI)
 *
 * The adapter converts raw socket text chunks to AG-UI TEXT_MESSAGE_CONTENT events
 * so that useChat can process them natively.
 */
export function createSocketAdapter(adventureId: string) {
  return stream(async function* socketStreamFactory(messages) {
    const socket = getSocket();
    if (!socket?.connected) {
      throw new Error("Game socket is not connected");
    }

    // Extract the last user message to submit as the player action
    // messages is Array<UIMessage> | Array<ModelMessage> — we check for UIMessage (has .parts)
    const lastMessage = messages[messages.length - 1];
    const actionContent =
      lastMessage && "parts" in lastMessage
        ? extractTextFromUIMessage(lastMessage as UIMessage)
        : typeof (lastMessage as { content?: unknown } | undefined)?.content === "string"
          ? String((lastMessage as { content: string }).content)
          : "";

    const queue = new AsyncQueue<StreamChunk>();
    const messageId = `msg-${Date.now()}`;
    let streamError: Error | null = null;
    let isClosed = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const closeQueue = () => {
      if (isClosed) return;
      isClosed = true;
      queue.close();
    };

    const closeWithError = (error: Error) => {
      streamError = error;
      closeQueue();
    };

    const resetIdleTimeout = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(() => {
        closeWithError(new Error("Game stream timed out while waiting for server chunks"));
      }, STREAM_IDLE_TIMEOUT_MS);
    };

    const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error(`Action request timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);

    // Register socket listeners BEFORE the POST to avoid race conditions
    // game:chunk payload: { adventureId, chunk: string }
    const onChunk = (data: { adventureId: string; chunk: string }) => {
      resetIdleTimeout();
      const streamChunk: StreamChunk = {
        type: "TEXT_MESSAGE_CONTENT",
        messageId,
        delta: data.chunk,
        timestamp: Date.now(),
      };
      queue.push(streamChunk);
    };

    const onComplete = () => {
      closeQueue();
    };

    const onError = (data: { error: string } | string) => {
      const message = typeof data === "string" ? data : data.error;
      closeWithError(new Error(`Game stream error: ${message}`));
    };

    socket.on("game:chunk", onChunk as Parameters<typeof socket.on>[1]);
    socket.on("game:response-complete", onComplete as Parameters<typeof socket.on>[1]);
    socket.on("game:error", onError as Parameters<typeof socket.on>[1]);

    try {
      resetIdleTimeout();

      // Submit player action — server will respond via socket events
      await withTimeout(
        api.post(`/api/adventures/${adventureId}/action`, {
          action: actionContent,
        }),
        ACTION_REQUEST_TIMEOUT_MS,
      );

      // Yield AG-UI events from the queue until socket signals completion
      yield* queue;

      if (streamError) {
        throw streamError;
      }
    } catch (error) {
      closeWithError(error instanceof Error ? error : new Error("Unknown game stream error"));
      throw error;
    } finally {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      closeQueue();
      // Always clean up socket listeners
      socket.off("game:chunk", onChunk as Parameters<typeof socket.on>[1]);
      socket.off("game:response-complete", onComplete as Parameters<typeof socket.on>[1]);
      socket.off("game:error", onError as Parameters<typeof socket.on>[1]);
    }
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useGameChat — manages the game conversation state for a given adventure.
 *
 * Exposes:
 * - `messages` — full conversation history (UIMessage[])
 * - `sendMessage` — submit a player action (triggers ConnectionAdapter)
 * - `isStreaming` — true while the Game Master is generating a response
 *
 * Called internally by useGameSession (Story 6.4 Task 2).
 * The socket must be connected (via connect()) before sendMessage is called.
 */
export function useGameChat(adventureId: string) {
  const { messages, sendMessage, isLoading, stop, error } = useChat({
    connection: createSocketAdapter(adventureId),
  });

  return {
    messages,
    sendMessage,
    isStreaming: isLoading,
    stop,
    error,
  };
}
