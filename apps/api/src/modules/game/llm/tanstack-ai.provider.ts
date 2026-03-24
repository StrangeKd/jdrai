/**
 * TanStackAIProvider — ILLMProvider implementation via @tanstack/ai (v0.6+).
 * Uses the AG-UI protocol: TEXT_MESSAGE_CONTENT for chunks, RUN_FINISHED for usage.
 *
 * This file is the ONLY place that knows about TanStack AI.
 * GameService and LLMService only interact with ILLMProvider.
 */
import { chat } from "@tanstack/ai";
import { anthropicText } from "@tanstack/ai-anthropic";
import { openaiText } from "@tanstack/ai-openai";
import { openRouterText } from "@tanstack/ai-openrouter";

import { logger } from "@/utils/logger";

import type { GenerateParams, ILLMProvider, StreamParams } from "./llm.provider";

// Cast model string to expected literal types — env vars are plain strings at runtime
type ProviderAdapter = (
  model: string,
) => ReturnType<typeof openaiText> | ReturnType<typeof anthropicText> | ReturnType<typeof openRouterText>;
const adapters: Record<"openai" | "anthropic" | "openrouter", ProviderAdapter> = {
  openai: (model) => openaiText(model as Parameters<typeof openaiText>[0]),
  anthropic: (model) => anthropicText(model as Parameters<typeof anthropicText>[0]),
  openrouter: (model) => openRouterText(model as Parameters<typeof openRouterText>[0]),
};

export class TanStackAIProvider implements ILLMProvider {
  readonly name: string;

  constructor(
    private readonly provider: "openai" | "anthropic" | "openrouter",
    private readonly model: string,
  ) {
    this.name = `${provider}:${model}`;
  }

  /**
   * Collects all streaming chunks and returns the joined string.
   * Internally reuses streamResponse to avoid code duplication.
   */
  async generateResponse(params: GenerateParams): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of this.streamResponse(params)) {
      chunks.push(chunk);
    }
    return chunks.join("");
  }

  /**
   * Yields text delta chunks from the LLM as they arrive (AG-UI protocol).
   * Extracts and logs token usage from the final RUN_FINISHED event.
   */
  async *streamResponse(params: StreamParams): AsyncIterable<string> {
    // Filter out "system" role from messages — system prompt is passed via systemPrompts
    const modelMessages = params.messages.flatMap((message) => {
      if (message.role === "system") return [];
      return [{ role: message.role, content: message.content }];
    });

    const stream = chat({
      adapter: adapters[this.provider](this.model),
      messages: modelMessages,
      systemPrompts: [params.systemPrompt],
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens !== undefined && { maxTokens: params.maxTokens }),
    });

    for await (const chunk of stream) {
      // AG-UI: TEXT_MESSAGE_CONTENT carries the incremental token delta
      if (chunk.type === "TEXT_MESSAGE_CONTENT") {
        yield chunk.delta;
      } else if (chunk.type === "RUN_FINISHED") {
        if (chunk.usage) {
          logger.info("llm:usage", {
            provider: this.provider,
            model: this.model,
            inputTokens: chunk.usage.promptTokens,
            outputTokens: chunk.usage.completionTokens,
          });
        }
      } else if (chunk.type === "RUN_ERROR") {
        const errMsg = (chunk as { type: string; error?: { message?: string } }).error?.message ?? "Unknown LLM error";
        logger.error(`[TanStackAI] RUN_ERROR from ${this.provider}:${this.model}: ${errMsg}`);
        throw new Error(errMsg);
      }
    }
  }
}
