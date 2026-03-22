import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Vitest config for integration tests — hits the real PostgreSQL DB.
 * Requires jdrai-db Docker container to be running.
 * Usage: pnpm test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // Use the real dev DB — tests clean up after themselves via cascade deletes
    env: {
      DATABASE_URL:
        process.env["DATABASE_URL"] ?? "postgresql://jdrai:jdrai@localhost:5432/jdrai",
      BETTER_AUTH_SECRET: "test-secret-placeholder-32-chars!!",
      OPENAI_API_KEY: "test-openai-key",
      ANTHROPIC_API_KEY: "test-anthropic-key",
      OPENROUTER_API_KEY: "test-openrouter-key",
    },
    // Run serially — avoids DB state race conditions between test files
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 15000,
  },
});
