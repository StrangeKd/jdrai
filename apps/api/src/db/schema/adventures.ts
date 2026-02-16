import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adventureStatusEnum = pgEnum('adventure_status', [
  'active',
  'completed',
  'abandoned',
]);

export const difficultyEnum = pgEnum('difficulty', [
  'easy',
  'normal',
  'hard',
  'nightmare',
]);

export const adventures = pgTable('adventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: adventureStatusEnum('status').notNull().default('active'),
  theme: varchar('theme', { length: 255 }),
  difficulty: difficultyEnum('difficulty').notNull().default('normal'),
  duration: varchar('duration', { length: 50 }),
  currentMilestone: integer('current_milestone').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Adventure = typeof adventures.$inferSelect;
export type NewAdventure = typeof adventures.$inferInsert;
