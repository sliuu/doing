import { useEffect, type ReactNode } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import { ensureInstancesForDate } from '@/db/instances';
import { ensureSelfCareSeed } from '@/db/seed';
import { recordAppOpen } from '@/db/streak';
import { todayKey } from '@/lib/day';

/** Runs once per app start: marks today as opened (for the streak) and expands today's recurring tasks. */
export function DbBootstrap({ children }: { children: ReactNode }) {
  const db = useDb();

  useEffect(() => {
    (async () => {
      await ensureSelfCareSeed(db);
      const { dayStartHour } = await getSettings(db);
      const key = todayKey(dayStartHour);
      await recordAppOpen(db, key);
      await ensureInstancesForDate(db, key);
    })();
  }, [db]);

  return children;
}
