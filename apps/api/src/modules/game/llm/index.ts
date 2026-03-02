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
  primaryProvider: string;
  fallbackOrder: string[];
  timeoutMs: number;
}

export class LLMService {
  private providers: Map<string, ILLMProvider>;
  private primaryProvider: string;
  private fallbackOrder: string[];
  private timeoutMs: number;

  /**
   * @param providers  Map of provider name → ILLMProvider instance
   * @param config     Routing configuration (primary, fallback order, timeout)
   */
  constructor(providers: Map<string, ILLMProvider>, config: LLMServiceConfig) {
    this.providers = providers;
    this.primaryProvider = config.primaryProvider;
    this.fallbackOrder = config.fallbackOrder;
    this.timeoutMs = config.timeoutMs;
  }

  /**
   * Generate a complete LLM response.
   * Tries primary provider first; falls back in order on failure.
   * Applies per-call timeout and transient-error retry.
   */
  async generate(params: GenerateParams): Promise<string> {
    const providerOrder = [this.primaryProvider, ...this.fallbackOrder];

    for (const providerName of providerOrder) {
      const provider = this.getProvider(providerName);
      try {
        return await withTimeout(
          withRetry(() => provider.generateResponse(params)),
          this.timeoutMs,
        );
      } catch (error) {
        logger.error(`[LLMService] Provider "${providerName}" failed:`, error);
        // Re-throw timeout immediately — no point trying fallbacks if the call timed out
        if (error instanceof AppError && error.code === "LLM_TIMEOUT") throw error;
      }
    }

    throw new AppError(503, "LLM_ERROR", "All LLM providers failed");
  }

  /**
   * Stream an LLM response as an async iterable.
   * Delegates directly to the primary provider — no mid-stream fallback.
   */
  async *stream(params: StreamParams): AsyncIterable<string> {
    const provider = this.getProvider(this.primaryProvider);
    try {
      yield* provider.streamResponse(params);
    } catch (error) {
      logger.error(`[LLMService] Streaming provider "${this.primaryProvider}" failed:`, error);
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

  const providers = new Map<string, ILLMProvider>([
    ["openai", new TanStackAIProvider("openai", env.LLM_OPENAI_MODEL)],
    ["anthropic", new TanStackAIProvider("anthropic", env.LLM_ANTHROPIC_MODEL)],
    ["openrouter", new TanStackAIProvider("openrouter", env.LLM_OPENROUTER_MODEL)],
  ]);

  const fallbackOrder = env.LLM_FALLBACK_ORDER.filter(
    (provider) => provider !== env.LLM_PRIMARY_PROVIDER,
  );

  return new LLMService(providers, {
    primaryProvider: env.LLM_PRIMARY_PROVIDER,
    fallbackOrder,
    timeoutMs: env.LLM_TIMEOUT_MS,
  });
}
