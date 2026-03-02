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

import { logger } from "@/utils/logger";

import type { GenerateParams, ILLMProvider, StreamParams } from "./llm.provider";

// Cast model string to expected literal types — env vars are plain strings at runtime
type ProviderAdapter = (model: string) => ReturnType<typeof openaiText> | ReturnType<typeof anthropicText>;
const adapters: Record<"openai" | "anthropic", ProviderAdapter> = {
  openai: (model) => openaiText(model as Parameters<typeof openaiText>[0]),
  anthropic: (model) => anthropicText(model as Parameters<typeof anthropicText>[0]),
};

export class TanStackAIProvider implements ILLMProvider {
  readonly name: string;

  constructor(
    private readonly provider: keyof typeof adapters,
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
    const modelMessages = params.messages
      .filter((m) => m.role !== "system")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m) => m as any);

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
        yield (chunk as { type: "TEXT_MESSAGE_CONTENT"; delta: string }).delta;
      } else if (chunk.type === "RUN_FINISHED") {
        // AG-UI: RUN_FINISHED carries token usage statistics
        const finished = chunk as {
          type: "RUN_FINISHED";
          usage?: { promptTokens: number; completionTokens: number };
        };
        if (finished.usage) {
          logger.info("llm:usage", {
            provider: this.provider,
            model: this.model,
            inputTokens: finished.usage.promptTokens,
            outputTokens: finished.usage.completionTokens,
          });
        }
      }
    }
  }
}
