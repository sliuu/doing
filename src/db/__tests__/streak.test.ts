import type { SQLiteDatabase } from 'expo-sqlite';

import { getStreak, recordAppOpen } from '@/db/streak';
import { addDaysToKey, todayKey } from '@/lib/day';
import { createTestDb } from '@/test-utils/sqlite';

const DAY_START_HOUR = 4;

describe('streak', () => {
  let db: SQLiteDatabase;
  let today: string;

  beforeEach(async () => {
    db = await createTestDb();
    today = todayKey(DAY_START_HOUR);
  });

  it('is zero when the app has never been opened', async () => {
    expect(await getStreak(db, DAY_START_HOUR)).toBe(0);
  });

  it('counts consecutive days ending today', async () => {
    await recordAppOpen(db, addDaysToKey(today, -2));
    await recordAppOpen(db, addDaysToKey(today, -1));
    await recordAppOpen(db, today);
    expect(await getStreak(db, DAY_START_HOUR)).toBe(3);
  });

  it('stops counting at a gap', async () => {
    await recordAppOpen(db, addDaysToKey(today, -3)); // gap at -2
    await recordAppOpen(db, addDaysToKey(today, -1));
    await recordAppOpen(db, today);
    expect(await getStreak(db, DAY_START_HOUR)).toBe(2);
  });

  it('recording the same day twice is harmless', async () => {
    await recordAppOpen(db, today);
    await recordAppOpen(db, today);
    expect(await getStreak(db, DAY_START_HOUR)).toBe(1);
  });
});
