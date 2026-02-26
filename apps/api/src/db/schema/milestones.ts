import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { adventures } from "./adventures";

export const milestoneStatusEnum = pgEnum("milestone_status", ["pending", "active", "completed"]);

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  adventureId: uuid("adventure_id")
    .notNull()
    .references(() => adventures.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
  status: milestoneStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});
