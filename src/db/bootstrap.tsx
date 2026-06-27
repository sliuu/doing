import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import { ensureInstancesForDate } from '@/db/instances';
import { ensureSelfCareSeed } from '@/db/seed';
import { recordAppOpen } from '@/db/streak';
import { todayKey } from '@/lib/day';

// Hooks that load data on mount (useDaily, useSelfCare) gate their first fetch on this.
// Without it, a fresh install races: the hooks run before ensureSelfCareSeed creates the
// seed tasks, find 0 recurring tasks, and render empty pages with no error.
const DbReadyContext = createContext(false);

export function useDbReady(): boolean {
  return useContext(DbReadyContext);
}

/** Runs once per app start: seeds self-care tasks, marks today as opened, and expands today's recurring tasks. */
export function DbBootstrap({ children }: { children: ReactNode }) {
  const db = useDb();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureSelfCareSeed(db);
      const { dayStartHour } = await getSettings(db);
      const key = todayKey(dayStartHour);
      await recordAppOpen(db, key);
      await ensureInstancesForDate(db, key);
      setReady(true);
    })();
  }, [db]);

  return <DbReadyContext.Provider value={ready}>{children}</DbReadyContext.Provider>;
}
