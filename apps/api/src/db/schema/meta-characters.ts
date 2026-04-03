import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { characterClasses } from "./character-classes";
import { races } from "./races";
import { users } from "./users";

export const metaCharacters = pgTable("meta_characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique() // one MetaCharacter per user
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  background: text("background"),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  cosmetics: jsonb("cosmetics").default({}).notNull(),
  raceId: uuid("race_id").references(() => races.id),
  classId: uuid("class_id").references(() => characterClasses.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
