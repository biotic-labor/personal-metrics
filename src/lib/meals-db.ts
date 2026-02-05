import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../drizzle/meals-schema';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    _sqlite = new Database('./data/meals.db');
    _sqlite.pragma('journal_mode = WAL');
    _db = drizzle(_sqlite, { schema });
  }
  return _db;
}

function getSqlite(): Database.Database {
  if (!_sqlite) getDb();
  return _sqlite!;
}

export const mealsDb = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_, prop) {
    const instance = getDb();
    return (instance as unknown as Record<string, unknown>)[prop as string];
  },
});

export { getSqlite };
