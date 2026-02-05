const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.MEALS_DB_PATH || './data/meals.db';
const migrationsDir = process.env.MEALS_MIGRATIONS_DIR || './drizzle/meals-migrations';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const isNewDb = !fs.existsSync(dbPath);
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// On fresh database, apply migrations directly (Docker first-run without drizzle-kit)
if (isNewDb && fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log('Applying meals migration:', file);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
  }
  console.log('Meals migrations complete');
}

// Create FTS5 virtual table for recipe search (not managed by Drizzle)
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
    title,
    normalized_ingredients,
    description,
    content='recipes',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`);

// Create triggers to keep FTS5 in sync with recipes table
db.exec(`
  CREATE TRIGGER IF NOT EXISTS recipes_ai AFTER INSERT ON recipes BEGIN
    INSERT INTO recipes_fts(rowid, title, normalized_ingredients, description)
    VALUES (new.id, new.title, new.normalized_ingredients, new.description);
  END;
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS recipes_ad AFTER DELETE ON recipes BEGIN
    INSERT INTO recipes_fts(recipes_fts, rowid, title, normalized_ingredients, description)
    VALUES ('delete', old.id, old.title, old.normalized_ingredients, old.description);
  END;
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS recipes_au AFTER UPDATE ON recipes BEGIN
    INSERT INTO recipes_fts(recipes_fts, rowid, title, normalized_ingredients, description)
    VALUES ('delete', old.id, old.title, old.normalized_ingredients, old.description);
    INSERT INTO recipes_fts(rowid, title, normalized_ingredients, description)
    VALUES (new.id, new.title, new.normalized_ingredients, new.description);
  END;
`);

console.log('FTS5 virtual table and triggers created');

db.close();
console.log('Meals database initialization complete');
