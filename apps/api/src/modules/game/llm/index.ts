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

    for (const key of chain) {
      const provider = this.getProvider(key);
      try {
        return await withTimeout(
          withRetry(() => provider.generateResponse(params)),
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
   * Stream an LLM response as an async iterable.
   * Uses params.modelKey if provided, otherwise falls back to the primary key.
   * No mid-stream fallback is attempted.
   */
  async *stream(params: StreamParams): AsyncIterable<string> {
    const key = params.modelKey ?? this.primaryKey;
    const provider = this.getProvider(key);
    try {
      yield* provider.streamResponse(params);
    } catch (error) {
      logger.error(`[LLMService] Streaming provider "${key}" failed:`, error);
      throw new AppError(503, "LLM_ERROR", "LLM streaming failed");
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

  // chain is always non-empty: env validation guarantees at least one model per provider
  const primaryKey = chain[0] as string;

  return new LLMService(providers, {
    primaryKey,
    fallbackOrder: chain.slice(1),
    timeoutMs: env.LLM_TIMEOUT_MS,
  });
}
