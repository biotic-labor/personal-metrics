import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../drizzle/schema';

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    const sqlite = new Database('./data/metrics.db');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_, prop) {
    const instance = getDb();
    return (instance as unknown as Record<string, unknown>)[prop as string];
  },
});
