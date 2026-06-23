import type { SQLiteDatabase } from 'expo-sqlite';

import { addDaysToKey, todayKey } from '@/lib/day';

export async function recordAppOpen(db: SQLiteDatabase, dateKey: string): Promise<void> {
  await db.runAsync('INSERT OR IGNORE INTO app_opens (date) VALUES (?)', dateKey);
}

/** Consecutive days (ending today) the app has been opened, per the day boundary in Settings. */
export async function getStreak(db: SQLiteDatabase, dayStartHour: number): Promise<number> {
  let streak = 0;
  let cursor = todayKey(dayStartHour);
  while (await db.getFirstAsync('SELECT 1 FROM app_opens WHERE date = ?', cursor)) {
    streak++;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}
