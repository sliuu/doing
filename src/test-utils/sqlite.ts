import Database from 'better-sqlite3';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/schema';

/**
 * Minimal stand-in for expo-sqlite's async API, backed by better-sqlite3, so the SQL in
 * src/db can be exercised in Jest (no native module available outside the app runtime).
 * Only implements the handful of methods src/db actually calls.
 */
function wrap(raw: Database.Database): SQLiteDatabase {
  return {
    getFirstAsync: async (sql: string, ...params: unknown[]) => {
      const row = raw.prepare(sql).get(...params);
      return row ?? null;
    },
    getAllAsync: async (sql: string, ...params: unknown[]) => {
      return raw.prepare(sql).all(...params);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      return raw.prepare(sql).run(...params);
    },
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
  } as unknown as SQLiteDatabase;
}

/** A fresh, migrated, in-memory database for a single test. */
export async function createTestDb(): Promise<SQLiteDatabase> {
  const db = wrap(new Database(':memory:'));
  await migrateDbIfNeeded(db);
  return db;
}
