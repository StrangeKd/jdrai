import { config } from "dotenv";
import { z } from "zod";

// Load root .env — API runs from apps/api via turbo, root .env is two levels up
config({ path: "../../.env" });

const envSchema = z
  .object({
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    API_PORT: z.coerce.number().default(3000),
    API_URL: z.url().default("http://localhost:3000"),
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    // Empty string from .env means "not set" — preprocess to undefined before URL validation
    VITE_API_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    LLM_PRIMARY_PROVIDER: z.enum(["openai", "anthropic", "openrouter"]).default("openai"),
    LLM_FALLBACK_ORDER: z.preprocess(
      (value) => {
        if (typeof value !== "string") return ["anthropic"];
        if (value.trim() === "") return [];
        return value
          .split(",")
          .map((provider) => provider.trim())
          .filter(Boolean);
      },
      z
        .array(z.enum(["openai", "anthropic", "openrouter"]))
        .refine(
          (providers) => new Set(providers).size === providers.length,
          "LLM_FALLBACK_ORDER must not contain duplicate providers",
        ),
    ),
    LLM_TIMEOUT_MS: z.coerce.number().default(30000),
    // Ordered list of models per provider — comma-separated, trimmed, non-empty items only
    LLM_OPENAI_MODELS: z.preprocess(
      (value) => {
        if (typeof value !== "string" || value.trim() === "") return ["gpt-4o"];
        return value
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
      },
      z.array(z.string().min(1)),
    ),
    LLM_ANTHROPIC_MODELS: z.preprocess(
      (value) => {
        if (typeof value !== "string" || value.trim() === "") return ["claude-sonnet-4-6"];
        return value
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
      },
      z.array(z.string().min(1)),
    ),
    LLM_OPENROUTER_MODELS: z.preprocess(
      (value) => {
        if (typeof value !== "string" || value.trim() === "") return ["openai/gpt-4o"];
        return value
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
      },
      z.array(z.string().min(1)),
    ),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    /** DEV only — provider:model key routed when freeModels flag is set on an action. */
    LLM_FREE_MODEL_KEY: z.string().default("openrouter:openai/gpt-oss-120b:free"),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PRIMARY_PROVIDER === "openai" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when primary provider is openai",
      });
    }

    if (data.LLM_PRIMARY_PROVIDER === "anthropic" && !data.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when primary provider is anthropic",
      });
    }

    if (data.LLM_PRIMARY_PROVIDER === "openrouter" && !data.OPENROUTER_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["OPENROUTER_API_KEY"],
        message: "OPENROUTER_API_KEY is required when primary provider is openrouter",
      });
    }
  });

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
