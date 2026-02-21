import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load root .env when drizzle-kit runs from apps/api (no automatic env loading in CLI context)
config({ path: "../../.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env["DATABASE_URL"]!,
  },
});
