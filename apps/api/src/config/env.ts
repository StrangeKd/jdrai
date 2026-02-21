import { config } from "dotenv";
import { z } from "zod";

// Load root .env — API runs from apps/api via turbo, root .env is two levels up
config({ path: "../../.env" });

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  API_PORT: z.coerce.number().default(3000),
  API_URL: z.url().default("http://localhost:3000"),
  FRONTEND_URL: z.url().default("http://localhost:5173"),
  VITE_API_URL: z.url().optional(), // Frontend only, may not be set in API context
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_PRIMARY_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
