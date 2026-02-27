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
    // Provide stub env vars so that env.ts passes Zod validation in tests that
    // transitively import @/db (e.g. repository query-builder tests). No actual
    // DB connection is made since only .toSQL() is called — postgres-js connects lazily.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-placeholder-32-chars!!",
    },
  },
});
