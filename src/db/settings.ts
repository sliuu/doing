import type { SQLiteDatabase } from 'expo-sqlite';

import type { Settings } from '@/db/types';

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const row = await db.getFirstAsync<{ day_start_hour: number }>(
    'SELECT day_start_hour FROM settings WHERE id = 0'
  );
  return { dayStartHour: row?.day_start_hour ?? 4 };
}

export async function setDayStartHour(db: SQLiteDatabase, hour: number): Promise<void> {
  await db.runAsync('UPDATE settings SET day_start_hour = ? WHERE id = 0', hour);
}
