import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
    // Provide stub env vars so that env.ts passes Zod validation in tests that
    // transitively import @/config/env or @/db. No real connections are made:
    // postgres-js connects lazily and LLM providers are mocked in LLM tests.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-placeholder-32-chars!!",
      // Stub API keys — satisfies superRefine regardless of LLM_PRIMARY_PROVIDER default
      OPENAI_API_KEY: "test-openai-key",
      ANTHROPIC_API_KEY: "test-anthropic-key",
      OPENROUTER_API_KEY: "test-openrouter-key",
    },
  },
});
