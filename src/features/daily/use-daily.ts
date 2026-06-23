import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import {
  adjustDuration,
  completeInstance,
  ensureInstancesForDate,
  getOrCreateInstance,
  listInstancesForDate,
  pauseTimer,
  setSubtaskDone,
  startTimer,
  uncompleteInstance,
} from '@/db/instances';
import { createTask, getTasksByIds, NewTaskInput } from '@/db/tasks';
import { todayKey } from '@/lib/day';
import type { TimeOfDay } from '@/db/types';

import { DailyItem, DailySections } from '@/features/daily/types';

const EMPTY_SECTIONS: DailySections = { anytime: [], morning: [], afternoon: [], evening: [] };

function groupByTimeOfDay(items: DailyItem[]): DailySections {
  const sections: DailySections = { anytime: [], morning: [], afternoon: [], evening: [] };
  for (const item of items) {
    const key = item.instance.timeOfDay ?? 'anytime';
    sections[key].push(item);
  }
  for (const key of Object.keys(sections) as TimeOfDay[]) {
    sections[key].sort((a, b) => {
      if (a.instance.completed !== b.instance.completed) return a.instance.completed ? 1 : -1;
      return a.instance.orderIndex - b.instance.orderIndex;
    });
  }
  return sections;
}

export function useDaily() {
  const db = useDb();
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [sections, setSections] = useState<DailySections>(EMPTY_SECTIONS);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/purity -- intentional one-time clock seed for live timer ticking
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    const { dayStartHour } = await getSettings(db);
    const key = todayKey(dayStartHour);
    await ensureInstancesForDate(db, key);
    const instances = await listInstancesForDate(db, key);
    const tasks = await getTasksByIds(db, [...new Set(instances.map((i) => i.taskId))]);
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const items = instances
      .map((instance) => {
        const task = taskById.get(instance.taskId);
        return task ? { instance, task } : null;
      })
      .filter((item): item is DailyItem => item !== null);

    setDateKey(key);
    setSections(groupByTimeOfDay(items));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load on mount
    refresh();
  }, [refresh]);

  // Ticks once a second so any running timer's live duration stays current on screen.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const addTask = useCallback(
    async (input: NewTaskInput, timeOfDay: TimeOfDay) => {
      if (!dateKey) return;
      const task = await createTask(db, input);
      await getOrCreateInstance(db, task.id, dateKey, {
        timeOfDay,
        scheduledDate: task.recurring ? null : dateKey,
      });
      await refresh();
    },
    [db, dateKey, refresh]
  );

  const toggleComplete = useCallback(
    async (instanceId: string, completed: boolean, opts?: { durationSeconds?: number; notes?: string | null }) => {
      if (completed) {
        await uncompleteInstance(db, instanceId);
      } else {
        await completeInstance(db, instanceId, opts);
      }
      await refresh();
    },
    [db, refresh]
  );

  const toggleRunning = useCallback(
    async (instanceId: string, isRunning: boolean) => {
      if (isRunning) {
        await pauseTimer(db, instanceId);
      } else {
        await startTimer(db, instanceId);
      }
      await refresh();
    },
    [db, refresh]
  );

  const bumpDuration = useCallback(
    async (instanceId: string, deltaSeconds: number) => {
      await adjustDuration(db, instanceId, deltaSeconds);
      await refresh();
    },
    [db, refresh]
  );

  const toggleSubtask = useCallback(
    async (instanceId: string, subtaskId: string, done: boolean) => {
      await setSubtaskDone(db, instanceId, subtaskId, done);
      await refresh();
    },
    [db, refresh]
  );

  return {
    loading,
    sections,
    now,
    dateKey,
    refresh,
    addTask,
    toggleComplete,
    toggleRunning,
    bumpDuration,
    toggleSubtask,
  };
}
