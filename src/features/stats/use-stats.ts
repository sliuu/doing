import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import { getStreak } from '@/db/streak';
import { getTaskStats, StatsPeriod, TaskStat } from '@/db/stats';

export function useStats() {
  const db = useDb();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [streak, setStreak] = useState(0);
  const [tasks, setTasks] = useState<TaskStat[]>([]);
  const [easyWins, setEasyWins] = useState<TaskStat[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { dayStartHour } = await getSettings(db);
    const [streakCount, taskStats, easyWinStats] = await Promise.all([
      getStreak(db, dayStartHour),
      getTaskStats(db, dayStartHour, period, false),
      getTaskStats(db, dayStartHour, period, true),
    ]);
    setStreak(streakCount);
    setTasks(taskStats);
    setEasyWins(easyWinStats);
    setLoading(false);
  }, [db, period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reload on period change
    refresh();
  }, [refresh]);

  return { loading, streak, tasks, easyWins, period, setPeriod, refresh };
}
