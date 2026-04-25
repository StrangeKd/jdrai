/**
 * LLMService — orchestration layer: multi-provider fallback, timeout, retry, logging.
 * Exposes generate() and stream() consuming ILLMProvider (TanStack AI is hidden).
 */
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";

import type { GenerateParams, ILLMProvider, StreamParams } from "./llm.provider";
import { TanStackAIProvider } from "./tanstack-ai.provider";

// ---------------------------------------------------------------------------
// Utility — timeout wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a promise and rejects with LLM_TIMEOUT after `ms` milliseconds.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AppError(408, "LLM_TIMEOUT", `LLM call timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}

/**
 * Retries an async operation up to `maxAttempts` times with exponential backoff.
 * Only retries on non-AppError failures (i.e. transient / network errors).
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Do not retry AppErrors (business / timeout errors are not transient)
      if (error instanceof AppError) throw error;
      if (attempt < maxAttempts) {
        const backoffMs = 100 * Math.pow(2, attempt - 1); // 100ms, 200ms, 400ms
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// LLMService
// ---------------------------------------------------------------------------

export interface LLMServiceConfig {
  /** Key of the primary provider in the form "provider:model", e.g. "openrouter:arcee/trinity-large-preview:free" */
  primaryKey: string;
  /** Ordered fallback keys ("provider:model") tried after the primary fails */
  fallbackOrder: string[];
  timeoutMs: number;
}

export class LLMService {
  private providers: Map<string, ILLMProvider>;
  private primaryKey: string;
  private fallbackOrder: string[];
  private timeoutMs: number;

  /**
   * @param providers  Map of "provider:model" key → ILLMProvider instance
   * @param config     Routing configuration (primary key, fallback order, timeout)
   */
  constructor(providers: Map<string, ILLMProvider>, config: LLMServiceConfig) {
    this.providers = providers;
    this.primaryKey = config.primaryKey;
    this.fallbackOrder = config.fallbackOrder;
    this.timeoutMs = config.timeoutMs;
  }

  /**
   * Generate a complete LLM response.
   * If params.modelKey is provided it overrides the primary key (head of chain).
   * Tries each key in order; falls back on failure.
   * Applies per-call timeout and transient-error retry.
   */
  async generate(params: GenerateParams): Promise<string> {
    const chain = params.modelKey
      ? [params.modelKey, ...this.fallbackOrder]
      : [this.primaryKey, ...this.fallbackOrder];
    const maxAttempts = params.maxAttempts ?? 3;

    for (const key of chain) {
      const provider = this.getProvider(key);
      try {
        return await withTimeout(
          withRetry(() => provider.generateResponse(params), maxAttempts),
          this.timeoutMs,
        );
      } catch (error) {
        logger.error(`[LLMService] Provider "${key}" failed:`, error);
        // Re-throw timeout immediately — no point trying fallbacks if the call timed out
        if (error instanceof AppError && error.code === "LLM_TIMEOUT") throw error;
      }
    }

    throw new AppError(503, "LLM_ERROR", "All LLM providers failed");
  }

  /**
   * Alias for generate() to align with story terminology (non-streaming).
   */
  async generateResponse(params: GenerateParams): Promise<string> {
    return this.generate(params);
  }

  /**
   * Stream an LLM response as an async iterable.
   * Tries each provider in the fallback chain — mirrors generate() routing logic.
   * On LLM_TIMEOUT, re-throws immediately without attempting fallbacks.
   */
  async *stream(params: StreamParams): AsyncIterable<string> {
    const chain = params.modelKey
      ? [params.modelKey, ...this.fallbackOrder]
      : [this.primaryKey, ...this.fallbackOrder];

    for (const key of chain) {
      const provider = this.getProvider(key);
      try {
        yield* this.streamWithTimeout(provider, params);
        return;
      } catch (error) {
        logger.error(`[LLMService] Streaming provider "${key}" failed:`, error);
        // Timeout → no point trying fallbacks (same policy as generate())
        if (error instanceof AppError && error.code === "LLM_TIMEOUT") throw error;
        // Other errors → try next provider in chain
      }
    }

    throw new AppError(503, "LLM_ERROR", "All LLM providers failed for streaming");
  }

  /**
   * Wraps a provider's streamResponse with a single timeout covering the entire stream.
   * Races each chunk against a timer — throws LLM_TIMEOUT if any wait exceeds timeoutMs.
   */
  private async *streamWithTimeout(
    provider: ILLMProvider,
    params: StreamParams,
  ): AsyncIterable<string> {
    const gen = provider.streamResponse(params)[Symbol.asyncIterator]();

    let clearStreamTimeout: () => void = () => {};
    const streamTimeout = new Promise<never>((_, reject) => {
      const id = setTimeout(
        () =>
          reject(
            new AppError(408, "LLM_TIMEOUT", `LLM stream timed out after ${this.timeoutMs}ms`),
          ),
        this.timeoutMs,
      );
      clearStreamTimeout = () => clearTimeout(id);
    });

    try {
      while (true) {
        const result = await Promise.race([gen.next(), streamTimeout]);
        if (result.done) break;
        yield result.value;
      }
    } finally {
      clearStreamTimeout();
      // Fire-and-forget: do not await — gen may be stuck on an unresolvable await (e.g. hung provider)
      void gen.return?.();
    }
  }

  private getProvider(name: string): ILLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AppError(500, "LLM_ERROR", `Unknown LLM provider: "${name}"`);
    }
    return provider;
  }
}

// ---------------------------------------------------------------------------
// Factory — reads env vars, instantiates TanStackAI providers
// ---------------------------------------------------------------------------

/**
 * Creates the production LLMService from environment variables.
 * Import env lazily to avoid circular deps and allow test overrides.
 */
export async function createLLMService(): Promise<LLMService> {
  // Dynamic import avoids top-level env side-effects in test environments
  const { env } = await import("@/config/env");

  // Index models by provider for easy access
  const modelsByProvider: Record<"openai" | "anthropic" | "openrouter", string[]> = {
    openai: env.LLM_OPENAI_MODELS,
    anthropic: env.LLM_ANTHROPIC_MODELS,
    openrouter: env.LLM_OPENROUTER_MODELS,
  };

  // Build Map<"provider:model", ILLMProvider> for every configured model
  const providers = new Map<string, ILLMProvider>();
  for (const [providerName, models] of Object.entries(modelsByProvider) as Array<
    ["openai" | "anthropic" | "openrouter", string[]]
  >) {
    for (const model of models) {
      providers.set(`${providerName}:${model}`, new TanStackAIProvider(providerName, model));
    }
  }

  // Build the flat ordered fallback chain: primary models first, then fallback providers' models
  const dedupedFallbackProviders = env.LLM_FALLBACK_ORDER.filter(
    (p) => p !== env.LLM_PRIMARY_PROVIDER,
  );
  const chain: string[] = [
    ...modelsByProvider[env.LLM_PRIMARY_PROVIDER].map((m) => `${env.LLM_PRIMARY_PROVIDER}:${m}`),
    ...dedupedFallbackProviders.flatMap((p) => modelsByProvider[p].map((m) => `${p}:${m}`)),
  ];

  // Register LLM_FREE_MODEL_KEY if not already in the map (DEV freeModels flag support).
  // Requires OPENROUTER_API_KEY since free models are OpenRouter-only by default.
  const freeKey = env.LLM_FREE_MODEL_KEY;
  if (freeKey && !providers.has(freeKey) && env.OPENROUTER_API_KEY) {
    const colonIdx = freeKey.indexOf(":");
    if (colonIdx !== -1) {
      const freeProvider = freeKey.slice(0, colonIdx) as "openai" | "anthropic" | "openrouter";
      const freeModel = freeKey.slice(colonIdx + 1);
      providers.set(freeKey, new TanStackAIProvider(freeProvider, freeModel));
    }
  }

  // chain is always non-empty: env validation guarantees at least one model per provider
  const primaryKey = chain[0] as string;

  return new LLMService(providers, {
    primaryKey,
    fallbackOrder: chain.slice(1),
    timeoutMs: env.LLM_TIMEOUT_MS,
  });
}
