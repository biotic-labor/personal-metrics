import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  targetPerMonth: integer('target_per_month').notNull().default(10),
  sortOrder: integer('sort_order').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const habitEntries = sqliteTable('habit_entries', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id),
  date: text('date').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
});

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  coverUrl: text('cover_url'),
  status: text('status', { enum: ['reading', 'completed', 'backlog'] }).notNull().default('backlog'),
  progress: integer('progress').notNull().default(0),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  userId: text('user_id').notNull().references(() => users.id),
});

export const healthMetrics = sqliteTable('health_metrics', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  steps: integer('steps'),
  calories: integer('calories'),
  restingHr: integer('resting_hr'),
  workoutMinutes: integer('workout_minutes'),
  userId: text('user_id').notNull().references(() => users.id),
});
