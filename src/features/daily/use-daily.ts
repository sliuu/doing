import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import {
  adjustDuration,
  completeInstance,
  deleteInstance,
  ensureInstancesForDate,
  getOrCreateInstance,
  listInstancesForDate,
  pauseTimer,
  setSubtaskDone,
  setTimeOfDay,
  startTimer,
  uncompleteInstance,
} from '@/db/instances';
import { createTask, deleteTask, excludeDate, getTasksByIds, NewTaskInput, updateTask } from '@/db/tasks';
import { addDaysToKey, todayKey } from '@/lib/day';
import type { TimeOfDay } from '@/db/types';

import { DailyItem, DailySections, DayMode } from '@/features/daily/types';

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
  const [dayStartHour, setDayStartHour] = useState(4);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [items, setItems] = useState<DailyItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Session-only: resets to 'normal' on every app launch, never persisted.
  const [dayMode, setDayMode] = useState<DayMode>('normal');
  // eslint-disable-next-line react-hooks/purity -- intentional one-time clock seed for live timer ticking
  const [now, setNow] = useState(Date.now());

  const loadForDate = useCallback(
    async (key: string) => {
      await ensureInstancesForDate(db, key);
      const instances = await listInstancesForDate(db, key);
      const tasks = await getTasksByIds(db, [...new Set(instances.map((i) => i.taskId))]);
      const taskById = new Map(tasks.map((t) => [t.id, t]));
      const nextItems = instances
        .map((instance) => {
          const task = taskById.get(instance.taskId);
          return task && !task.isSelfCare ? { instance, task } : null;
        })
        .filter((item): item is DailyItem => item !== null);

      setItems(nextItems);
      setLoading(false);
    },
    [db]
  );

  const refresh = useCallback(async () => {
    if (!dateKey) return;
    await loadForDate(dateKey);
  }, [dateKey, loadForDate]);

  useEffect(() => {
    (async () => {
      const { dayStartHour: hour } = await getSettings(db);
      setDayStartHour(hour);
      setDateKey(todayKey(hour));
    })();
  }, [db]);

  useEffect(() => {
    if (dateKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data load whenever the selected date changes
      loadForDate(dateKey);
    }
  }, [dateKey, loadForDate]);

  // Ticks once a second so any running timer's live duration stays current on screen.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const goToPreviousDay = useCallback(() => {
    setDateKey((key) => (key ? addDaysToKey(key, -1) : key));
  }, []);

  const goToNextDay = useCallback(() => {
    setDateKey((key) => (key ? addDaysToKey(key, 1) : key));
  }, []);

  const goToToday = useCallback(() => {
    setDateKey(todayKey(dayStartHour));
  }, [dayStartHour]);

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
    async (instanceId: string, completed: boolean, opts?: { durationSeconds?: number }) => {
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

  const editTask = useCallback(
    async (taskId: string, patch: Parameters<typeof updateTask>[2]) => {
      await updateTask(db, taskId, patch);
      await refresh();
    },
    [db, refresh]
  );

  const moveToTimeOfDay = useCallback(
    async (instanceId: string, timeOfDay: TimeOfDay) => {
      await setTimeOfDay(db, instanceId, timeOfDay);
      await refresh();
    },
    [db, refresh]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(db, taskId);
      await refresh();
    },
    [db, refresh]
  );

  /** Deletes just one day's occurrence of a recurring task, excluding that date so it isn't regenerated. */
  const removeTaskOccurrence = useCallback(
    async (instanceId: string, taskId: string, occurrenceDateKey: string) => {
      await deleteInstance(db, instanceId);
      await excludeDate(db, taskId, occurrenceDateKey);
      await refresh();
    },
    [db, refresh]
  );

  const isToday = dateKey === todayKey(dayStartHour);

  const sections = useMemo(() => {
    const visible = items.filter((item) => {
      if (dayMode === 'no-work' && item.task.hideOnNoWorkDays) return false;
      if (dayMode === 'low-energy' && item.task.hideOnLowEnergyDays) return false;
      return true;
    });
    return groupByTimeOfDay(visible);
  }, [items, dayMode]);

  return {
    loading,
    sections,
    now,
    dateKey,
    isToday,
    dayMode,
    setDayMode,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    refresh,
    addTask,
    toggleComplete,
    toggleRunning,
    bumpDuration,
    toggleSubtask,
    editTask,
    moveToTimeOfDay,
    removeTask,
    removeTaskOccurrence,
  };
}
