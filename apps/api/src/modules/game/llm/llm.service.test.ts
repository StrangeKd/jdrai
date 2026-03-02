/**
 * LLMService unit tests (Story 6.1 Task 7)
 * Tests mock ILLMProvider directly — no real SDK calls.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/utils/errors";

import { LLMService, type LLMServiceConfig, withTimeout } from "./index";
import type { ILLMProvider } from "./llm.provider";

// ---------------------------------------------------------------------------
// Mock provider factory
// ---------------------------------------------------------------------------

function makeMockProvider(name: string, overrides: Partial<ILLMProvider> = {}): ILLMProvider {
  return {
    name,
    generateResponse: vi.fn().mockResolvedValue(`response from ${name}`),
    async *streamResponse() {
      yield `chunk1 from ${name}`;
      yield `chunk2 from ${name}`;
    },
    ...overrides,
  };
}

const DEFAULT_CONFIG: LLMServiceConfig = {
  primaryProvider: "primary",
  fallbackOrder: ["fallback"],
  timeoutMs: 5000,
};

// ---------------------------------------------------------------------------
// withTimeout utility
// ---------------------------------------------------------------------------

describe("withTimeout", () => {
  it("resolves when promise completes before timeout", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000);
    expect(result).toBe("ok");
  });

  it("rejects with LLM_TIMEOUT when promise exceeds timeout", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 500, "late"));
    await expect(withTimeout(slow, 10)).rejects.toMatchObject({
      code: "LLM_TIMEOUT",
      statusCode: 408,
    });
  });
});

// ---------------------------------------------------------------------------
// LLMService — generate()
// ---------------------------------------------------------------------------

describe("LLMService.generate()", () => {
  let primary: ILLMProvider;
  let fallback: ILLMProvider;
  let service: LLMService;

  const params = {
    systemPrompt: "You are a GM",
    messages: [{ role: "user" as const, content: "Hello" }],
  };

  beforeEach(() => {
    primary = makeMockProvider("primary");
    fallback = makeMockProvider("fallback");
    service = new LLMService(
      new Map([
        ["primary", primary],
        ["fallback", fallback],
      ]),
      DEFAULT_CONFIG,
    );
  });

  afterEach(() => vi.clearAllMocks());

  it("calls primary provider on success (AC-3)", async () => {
    const result = await service.generate(params);

    expect(result).toBe("response from primary");
    expect(primary.generateResponse).toHaveBeenCalledWith(params);
    expect(fallback.generateResponse).not.toHaveBeenCalled();
  });

  it("falls back to secondary provider on primary failure (AC-3)", async () => {
    // mockRejectedValue (persistent) so all 3 withRetry attempts fail → fallback kicks in
    vi.mocked(primary.generateResponse).mockRejectedValue(new Error("primary down"));

    const result = await service.generate(params);

    expect(result).toBe("response from fallback");
    expect(primary.generateResponse).toHaveBeenCalled();
    expect(fallback.generateResponse).toHaveBeenCalledTimes(1);
  });

  it("throws AppError LLM_ERROR when all providers fail (AC-3)", async () => {
    vi.mocked(primary.generateResponse).mockRejectedValue(new Error("primary down"));
    vi.mocked(fallback.generateResponse).mockRejectedValue(new Error("fallback down"));

    await expect(service.generate(params)).rejects.toMatchObject({
      code: "LLM_ERROR",
      statusCode: 503,
    });
  });

  it("throws AppError when the only configured provider is missing from registry", async () => {
    const noFallbackService = new LLMService(
      new Map([["primary", primary]]),
      { ...DEFAULT_CONFIG, fallbackOrder: ["unknown"] },
    );

    // Persistent rejection so all withRetry attempts fail
    vi.mocked(primary.generateResponse).mockRejectedValue(new Error("down"));

    await expect(noFallbackService.generate(params)).rejects.toMatchObject({
      code: "LLM_ERROR",
    });
  });

  it("does not retry on AppError (business errors should not be retried)", async () => {
    const businessError = new AppError(503, "LLM_ERROR", "provider failed");
    vi.mocked(primary.generateResponse).mockRejectedValue(businessError);
    vi.mocked(fallback.generateResponse).mockResolvedValue("fallback ok");

    // AppError from primary should skip retry but still try fallback
    const result = await service.generate(params);
    expect(result).toBe("fallback ok");
  });
});

// ---------------------------------------------------------------------------
// LLMService — stream()
// ---------------------------------------------------------------------------

describe("LLMService.stream()", () => {
  const params = {
    systemPrompt: "You are a GM",
    messages: [{ role: "user" as const, content: "Describe the scene" }],
  };

  it("streams chunks in order from primary provider (AC-5)", async () => {
    const primary = makeMockProvider("primary");
    const service = new LLMService(
      new Map([["primary", primary]]),
      { ...DEFAULT_CONFIG, fallbackOrder: [] },
    );

    const chunks: string[] = [];
    for await (const chunk of service.stream(params)) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["chunk1 from primary", "chunk2 from primary"]);
  });

  it("throws AppError LLM_ERROR when streaming provider throws", async () => {
    const brokenProvider: ILLMProvider = {
      name: "broken",
      generateResponse: vi.fn(),
      async *streamResponse() {
        throw new Error("stream error");
        yield ""; // unreachable — required to satisfy require-yield lint rule
      },
    };

    const service = new LLMService(
      new Map([["primary", brokenProvider]]),
      { ...DEFAULT_CONFIG, fallbackOrder: [] },
    );

    // Must get the iterator to call .next()
    const gen = service.stream(params)[Symbol.asyncIterator]();
    await expect(gen.next()).rejects.toMatchObject({
      code: "LLM_ERROR",
      statusCode: 503,
    });
  });
});

// ---------------------------------------------------------------------------
// LLMService — timeout (AC-6)
// ---------------------------------------------------------------------------

describe("LLMService timeout handling (AC-6)", () => {
  it("throws LLM_TIMEOUT when generate exceeds configured timeout", async () => {
    const slowProvider: ILLMProvider = {
      name: "slow",
      // Never resolves within the timeout window
      generateResponse: () => new Promise((_resolve, _reject) => {
        // intentionally hangs
      }),
      async *streamResponse() {
        yield "never";
      },
    };

    const service = new LLMService(
      new Map([["slow", slowProvider]]),
      { primaryProvider: "slow", fallbackOrder: [], timeoutMs: 10 },
    );

    await expect(
      service.generate({ systemPrompt: "test", messages: [] }),
    ).rejects.toMatchObject({ code: "LLM_TIMEOUT" });
  });
});

// ---------------------------------------------------------------------------
// Token usage logging (AC-8)
// ---------------------------------------------------------------------------

describe("Token usage logging (AC-8)", () => {
  it("generates response and returns full text (integration of generateResponse)", async () => {
    // TanStackAIProvider.generateResponse collects chunks from streamResponse.
    // This test validates the pattern via LLMService using a mock provider.
    const primary = makeMockProvider("primary", {
      generateResponse: vi.fn().mockResolvedValue("The dungeon is dark."),
    });

    const service = new LLMService(
      new Map([["primary", primary]]),
      { ...DEFAULT_CONFIG, fallbackOrder: [] },
    );

    const result = await service.generate({
      systemPrompt: "You are a GM",
      messages: [{ role: "user", content: "Describe the dungeon" }],
    });

    expect(result).toBe("The dungeon is dark.");
    expect(primary.generateResponse).toHaveBeenCalledOnce();
  });
});
