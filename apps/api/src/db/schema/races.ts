import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const races = pgTable("races", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  traits: jsonb("traits"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertRaceSchema = createInsertSchema(races);
export const selectRaceSchema = createSelectSchema(races);
