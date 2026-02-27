import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { adventures } from "./adventures";
import { milestones } from "./milestones";

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  adventureId: uuid("adventure_id")
    .notNull()
    .references(() => adventures.id, { onDelete: "cascade" }),
  // nullable FK — a message belongs to a milestone once milestones are generated (Epic 6)
  milestoneId: uuid("milestone_id").references(() => milestones.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // Stores D20 resolution data (roll, dc, bonus, outcome) — NEVER exposed to frontend in P1
  // Reserved for the P2 "visible dice" feature (GDD GD-001)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
