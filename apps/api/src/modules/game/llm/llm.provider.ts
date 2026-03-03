/**
 * ILLMProvider — internal JDRAI contract for LLM providers.
 * TanStack AI is a hidden implementation detail behind this interface.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateParams {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /**
   * Optional override — if set, LLMService routes to this specific "provider:model" key
   * instead of the configured primary provider.
   */
  modelKey?: string;
}

export type StreamParams = GenerateParams;

export interface ILLMProvider {
  /** Human-readable provider identifier, e.g. "openai:gpt-4o" */
  readonly name: string;

  /**
   * Generate a complete response (non-streaming).
   * Collects all stream chunks internally and returns the joined string.
   */
  generateResponse(params: GenerateParams): Promise<string>;

  /**
   * Stream a response as an async iterable of text chunks.
   * Caller iterates with `for await (const chunk of provider.streamResponse(...))`.
   */
  streamResponse(params: StreamParams): AsyncIterable<string>;
}
