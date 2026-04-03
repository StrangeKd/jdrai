import { type AnyPgColumn, boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Import enums already defined in Epic 1 — do NOT redefine
import { adventureTemplates, difficultyEnum, estimatedDurationEnum } from "./adventure-templates";
import { users } from "./users";

export const adventureStatusEnum = pgEnum("adventure_status", ["active", "completed", "abandoned"]);
export const toneEnum = pgEnum("tone", ["serious", "humorous", "epic", "dark"]);

export const adventures = pgTable("adventures", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Lazy reference to avoid circular dependency (adventureTemplates → adventures → adventureTemplates)
  templateId: uuid("template_id").references((): AnyPgColumn => adventureTemplates.id),
  title: text("title").notNull(),
  status: adventureStatusEnum("status").notNull().default("active"),
  difficulty: difficultyEnum("difficulty").notNull(),
  estimatedDuration: estimatedDurationEnum("estimated_duration").notNull(),
  tone: toneEnum("tone"), // nullable — P2
  settings: jsonb("settings").notNull().default({}),
  state: jsonb("state").notNull().default({}),
  startedAt: timestamp("started_at").defaultNow(),
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  narrativeSummary: text("narrative_summary"),
  isGameOver: boolean("is_game_over").default(false).notNull(),
  isTutorial: boolean("is_tutorial").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
