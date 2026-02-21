import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const characterClasses = pgTable("character_classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  baseStats: jsonb("base_stats"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertCharacterClassSchema = createInsertSchema(characterClasses);
export const selectCharacterClassSchema = createSelectSchema(characterClasses);
