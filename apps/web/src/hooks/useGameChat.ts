/**
 * useGameChat — TanStack AI hook bridging Socket.io game events to the useChat API.
 *
 * Architecture:
 *  sendMessage() → adapter.connect() → POST /api/adventures/:id/action
 *                                     → socket "game:chunk" events → AG-UI StreamChunks
 *                                     → useChat manages messages / isLoading state
 *
 * This hook is wired into the game screen UI in Story 6.4.
 * The socket connection itself is established in Story 6.3.
 */
import type { StreamChunk } from "@tanstack/ai";
import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { stream, useChat } from "@tanstack/ai-react";

import { api } from "@/services/api";
import { socket } from "@/services/socket.service";

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
function createSocketAdapter(adventureId: string) {
  return stream(async function* socketStreamFactory(messages) {
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

    // Register socket listeners BEFORE the POST to avoid race conditions
    const onChunk = (content: string) => {
      const chunk: StreamChunk = {
        type: "TEXT_MESSAGE_CONTENT",
        messageId,
        delta: content,
        timestamp: Date.now(),
      };
      queue.push(chunk);
    };

    const onComplete = () => {
      queue.close();
    };

    socket.on("game:chunk", onChunk as Parameters<typeof socket.on>[1]);
    socket.on("game:response-complete", onComplete as Parameters<typeof socket.on>[1]);

    try {
      // Submit player action — server will respond via socket events
      await api.post(`/api/adventures/${adventureId}/action`, {
        action: actionContent,
      });

      // Yield AG-UI events from the queue until socket signals completion
      yield* queue;
    } finally {
      // Always clean up socket listeners
      socket.off("game:chunk", onChunk as Parameters<typeof socket.on>[1]);
      socket.off("game:response-complete", onComplete as Parameters<typeof socket.on>[1]);
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
 * - `sendMessage` — submit a player action (string or multimodal)
 * - `isStreaming` — true while the Game Master is generating a response
 *
 * Consumed by StreamingText and ChoiceList in Story 6.4.
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
