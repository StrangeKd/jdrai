import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { adventures } from './adventures';

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const adventureMessages = pgTable('adventure_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  adventureId: uuid('adventure_id')
    .notNull()
    .references(() => adventures.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AdventureMessage = typeof adventureMessages.$inferSelect;
export type NewAdventureMessage = typeof adventureMessages.$inferInsert;
