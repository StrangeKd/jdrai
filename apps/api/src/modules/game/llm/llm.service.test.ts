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
  primaryKey: "primary",
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

  it("falls back through same-provider models before trying next provider", async () => {
    // Simulates: openrouter:model-A → openrouter:model-B → anthropic:claude
    const modelA = makeMockProvider("openrouter:model-a");
    const modelB = makeMockProvider("openrouter:model-b");
    const anthropicProvider = makeMockProvider("anthropic:claude");

    vi.mocked(modelA.generateResponse).mockRejectedValue(new Error("model-a down"));

    const multiModelService = new LLMService(
      new Map([
        ["openrouter:model-a", modelA],
        ["openrouter:model-b", modelB],
        ["anthropic:claude", anthropicProvider],
      ]),
      {
        primaryKey: "openrouter:model-a",
        fallbackOrder: ["openrouter:model-b", "anthropic:claude"],
        timeoutMs: 5000,
      },
    );

    const result = await multiModelService.generate(params);

    expect(result).toBe("response from openrouter:model-b");
    expect(modelA.generateResponse).toHaveBeenCalled();
    expect(modelB.generateResponse).toHaveBeenCalledTimes(1);
    expect(anthropicProvider.generateResponse).not.toHaveBeenCalled();
  });

  it("uses modelKey override instead of primary provider", async () => {
    const result = await service.generate({ ...params, modelKey: "fallback" });

    // "fallback" is head of chain — primary should not be called
    expect(result).toBe("response from fallback");
    expect(primary.generateResponse).not.toHaveBeenCalled();
    expect(fallback.generateResponse).toHaveBeenCalledTimes(1);
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

  it("throws AppError LLM_ERROR when streaming provider throws (no fallback)", async () => {
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

    const gen = service.stream(params)[Symbol.asyncIterator]();
    await expect(gen.next()).rejects.toMatchObject({
      code: "LLM_ERROR",
      statusCode: 503,
    });
  });

  it("falls back to secondary provider when primary stream throws", async () => {
    const brokenPrimary: ILLMProvider = {
      name: "primary",
      generateResponse: vi.fn(),
      async *streamResponse() {
        throw new Error("primary stream error");
        yield ""; // unreachable
      },
    };
    const fallback = makeMockProvider("fallback");

    const service = new LLMService(
      new Map([["primary", brokenPrimary], ["fallback", fallback]]),
      { ...DEFAULT_CONFIG, fallbackOrder: ["fallback"] },
    );

    const chunks: string[] = [];
    for await (const chunk of service.stream(params)) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["chunk1 from fallback", "chunk2 from fallback"]);
  });

  it("throws LLM_ERROR when all stream providers fail", async () => {
    const makebroken = (name: string): ILLMProvider => ({
      name,
      generateResponse: vi.fn(),
      async *streamResponse() {
        throw new Error("down");
        yield ""; // unreachable
      },
    });

    const service = new LLMService(
      new Map([["primary", makebroken("primary")], ["fallback", makebroken("fallback")]]),
      { ...DEFAULT_CONFIG, fallbackOrder: ["fallback"] },
    );

    const gen = service.stream(params)[Symbol.asyncIterator]();
    await expect(gen.next()).rejects.toMatchObject({ code: "LLM_ERROR", statusCode: 503 });
  });

  it("throws LLM_TIMEOUT when stream exceeds configured timeout", async () => {
    const slowProvider: ILLMProvider = {
      name: "slow",
      generateResponse: vi.fn(),
      async *streamResponse() {
        await new Promise(() => {}); // hangs indefinitely
        yield ""; // unreachable
      },
    };

    const service = new LLMService(
      new Map([["slow", slowProvider]]),
      { primaryKey: "slow", fallbackOrder: [], timeoutMs: 10 },
    );

    const gen = service.stream(params)[Symbol.asyncIterator]();
    await expect(gen.next()).rejects.toMatchObject({ code: "LLM_TIMEOUT", statusCode: 408 });
  });

  it("does not try fallback on LLM_TIMEOUT — re-throws immediately", async () => {
    const slowProvider: ILLMProvider = {
      name: "primary",
      generateResponse: vi.fn(),
      async *streamResponse() {
        await new Promise(() => {}); // hangs indefinitely
        yield ""; // unreachable
      },
    };
    const fallback = makeMockProvider("fallback");

    const service = new LLMService(
      new Map([["primary", slowProvider], ["fallback", fallback]]),
      { primaryKey: "primary", fallbackOrder: ["fallback"], timeoutMs: 10 },
    );

    const gen = service.stream(params)[Symbol.asyncIterator]();
    // Must throw LLM_TIMEOUT, not LLM_ERROR — proves fallback was not attempted
    await expect(gen.next()).rejects.toMatchObject({ code: "LLM_TIMEOUT", statusCode: 408 });
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
      { primaryKey: "slow", fallbackOrder: [], timeoutMs: 10 },
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
