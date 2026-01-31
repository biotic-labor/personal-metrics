const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.DB_PATH || './data/metrics.db';
const migrationsDir = process.env.MIGRATIONS_DIR || './drizzle/migrations';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Run migrations
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
for (const file of files) {
  console.log('Applying migration:', file);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.exec(sql);
}
console.log('Migrations complete');

// Check if we need to seed
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('Seeding database...');

  // Simple bcrypt-like hash for demo (in production, use proper bcrypt)
  // This creates a user with password 'password123'
  const userId = crypto.randomUUID();

  // Pre-computed bcrypt hash for 'password123'
  const passwordHash = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u';

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (?, 'chris@example.com', ?, 'Chris Nelson')
  `).run(userId, passwordHash);

  console.log('Created user: chris@example.com (password: password123)');

  // Seed habits
  const habits = [
    { name: 'Exercise', color: '#3B82F6', icon: 'dumbbell' },
    { name: 'Meditate', color: '#EF4444', icon: 'brain' },
    { name: 'Read', color: '#22C55E', icon: 'book' },
    { name: 'Eat Healthy', color: '#F97316', icon: 'salad' },
    { name: 'No Alcohol', color: '#DC2626', icon: 'wine-off' },
    { name: 'Code', color: '#8B5CF6', icon: 'code' },
    { name: 'Engage Emotionally', color: '#EC4899', icon: 'heart' },
    { name: 'Something Thoughtful', color: '#6366F1', icon: 'gift' },
  ];

  const insertHabit = db.prepare(`
    INSERT INTO habits (id, name, color, icon, target_per_month, sort_order, active)
    VALUES (?, ?, ?, ?, 10, ?, 1)
  `);

  habits.forEach((habit, i) => {
    insertHabit.run(crypto.randomUUID(), habit.name, habit.color, habit.icon, i + 1);
  });

  console.log(`Created ${habits.length} default habits`);
}

db.close();
console.log('Database initialization complete');
