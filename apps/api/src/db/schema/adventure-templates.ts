import { boolean, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const difficultyEnum = pgEnum("difficulty", ["easy", "normal", "hard", "nightmare"]);
export const estimatedDurationEnum = pgEnum("estimated_duration", ["short", "medium", "long"]);

export const adventureTemplates = pgTable("adventure_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("normal"),
  estimatedDuration: estimatedDurationEnum("estimated_duration").notNull().default("medium"),
  systemPrompt: text("system_prompt").notNull(),
  seedData: jsonb("seed_data"),
  isPublic: boolean("is_public").notNull().default(true),
});

export const insertAdventureTemplateSchema = createInsertSchema(adventureTemplates);
export const selectAdventureTemplateSchema = createSelectSchema(adventureTemplates);
