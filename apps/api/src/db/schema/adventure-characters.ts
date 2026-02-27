import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { adventures } from "./adventures";
import { characterClasses } from "./character-classes";
import { races } from "./races";

export const adventureCharacters = pgTable("adventure_characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  adventureId: uuid("adventure_id")
    .notNull()
    .references(() => adventures.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => characterClasses.id),
  raceId: uuid("race_id")
    .notNull()
    .references(() => races.id),
  name: text("name").notNull(),
  background: text("background"),
  // Default stats: strength, agility, charisma, karma (P1 baseline — no visible progression)
  stats: jsonb("stats")
    .notNull()
    .$type<{ strength: number; agility: number; charisma: number; karma: number }>()
    .default({ strength: 10, agility: 10, charisma: 10, karma: 10 }),
  inventory: jsonb("inventory").notNull().$type<unknown[]>().default([]),
  currentHp: integer("current_hp").notNull().default(20),
  maxHp: integer("max_hp").notNull().default(20),
});
