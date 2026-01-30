import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, habits } from '../drizzle/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'metrics.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const defaultHabits = [
  { name: 'Exercise', color: '#3B82F6', icon: 'dumbbell' },
  { name: 'Journal', color: '#F59E0B', icon: 'pencil' },
  { name: 'Meditate', color: '#EF4444', icon: 'brain' },
  { name: 'Read', color: '#22C55E', icon: 'book' },
  { name: 'Series', color: '#14B8A6', icon: 'tv' },
  { name: 'Eat Healthy', color: '#F97316', icon: 'salad' },
  { name: 'No Alcohol', color: '#DC2626', icon: 'wine-off' },
  { name: 'Code', color: '#8B5CF6', icon: 'code' },
  { name: 'Engage Emotionally', color: '#EC4899', icon: 'heart' },
  { name: 'Something Thoughtful', color: '#6366F1', icon: 'gift' },
];

async function seed() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);
  const userId = uuidv4();

  db.insert(users).values({
    id: userId,
    email: 'chris@example.com',
    passwordHash,
    name: 'Chris Nelson',
  }).run();

  console.log('Created demo user: chris@example.com');

  // Create default habits
  for (let i = 0; i < defaultHabits.length; i++) {
    const habit = defaultHabits[i];
    db.insert(habits).values({
      id: uuidv4(),
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      targetPerMonth: 10,
      sortOrder: i + 1,
      active: true,
    }).run();
  }

  console.log(`Created ${defaultHabits.length} default habits`);
  console.log('Seed complete!');

  sqlite.close();
}

seed().catch(console.error);
