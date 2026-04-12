import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/config/env";

import * as schema from "./schema/index";

async function reset() {
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Resetting database...");

  // Truncate in FK-safe order (children first, parents last)
  await db.execute(sql`
    TRUNCATE TABLE
      milestones,
      messages,
      adventure_characters,
      adventures,
      meta_characters,
      adventure_templates,
      verification,
      session,
      account,
      "user",
      races,
      character_classes
    RESTART IDENTITY CASCADE
  `);

  console.log("All tables truncated.");
  await client.end();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
