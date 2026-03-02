import { afterEach, describe, expect, it, vi } from "vitest";

const { chatMock, openaiTextMock, anthropicTextMock, loggerInfoMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
  openaiTextMock: vi.fn((model: string) => ({ provider: "openai", model })),
  anthropicTextMock: vi.fn((model: string) => ({ provider: "anthropic", model })),
  loggerInfoMock: vi.fn(),
}));

vi.mock("@tanstack/ai", () => ({
  chat: chatMock,
}));

vi.mock("@tanstack/ai-openai", () => ({
  openaiText: openaiTextMock,
}));

vi.mock("@tanstack/ai-anthropic", () => ({
  anthropicText: anthropicTextMock,
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: loggerInfoMock,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { TanStackAIProvider } from "./tanstack-ai.provider";

async function* makeChunks(chunks: Array<Record<string, unknown>>) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe("TanStackAIProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("streams only text deltas and logs usage on RUN_FINISHED", async () => {
    chatMock.mockReturnValueOnce(
      makeChunks([
        { type: "TEXT_MESSAGE_CONTENT", delta: "Hello " },
        { type: "TEXT_MESSAGE_CONTENT", delta: "world" },
        {
          type: "RUN_FINISHED",
          usage: { promptTokens: 10, completionTokens: 6, totalTokens: 16 },
        },
      ]),
    );

    const provider = new TanStackAIProvider("openai", "gpt-4o");
    const streamed: string[] = [];

    for await (const chunk of provider.streamResponse({
      systemPrompt: "You are a GM",
      messages: [
        { role: "system", content: "legacy system role should be filtered out" },
        { role: "user", content: "Describe the scene" },
      ],
    })) {
      streamed.push(chunk);
    }

    expect(streamed).toEqual(["Hello ", "world"]);
    expect(openaiTextMock).toHaveBeenCalledWith("gpt-4o");
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompts: ["You are a GM"],
        messages: [{ role: "user", content: "Describe the scene" }],
      }),
    );
    expect(loggerInfoMock).toHaveBeenCalledWith("llm:usage", {
      provider: "openai",
      model: "gpt-4o",
      inputTokens: 10,
      outputTokens: 6,
    });
  });

  it("generateResponse joins streaming chunks into a complete response", async () => {
    chatMock.mockReturnValueOnce(
      makeChunks([
        { type: "TEXT_MESSAGE_CONTENT", delta: "The " },
        { type: "TEXT_MESSAGE_CONTENT", delta: "dungeon is dark." },
        { type: "RUN_FINISHED" },
      ]),
    );

    const provider = new TanStackAIProvider("anthropic", "claude-sonnet-4-6");
    const result = await provider.generateResponse({
      systemPrompt: "You are a GM",
      messages: [{ role: "user", content: "Describe the dungeon" }],
    });

    expect(result).toBe("The dungeon is dark.");
    expect(anthropicTextMock).toHaveBeenCalledWith("claude-sonnet-4-6");
  });
});
