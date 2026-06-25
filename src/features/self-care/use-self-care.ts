import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import {
  completeInstance,
  deleteInstance,
  ensureInstancesForDate,
  getOrCreateInstance,
  listInstancesForDate,
  uncompleteInstance,
} from '@/db/instances';
import { createTask, deleteTask, excludeDate, getTasksByIds, NewTaskInput, updateTask } from '@/db/tasks';
import { todayKey } from '@/lib/day';

import { SelfCareItem } from '@/features/self-care/types';

export function useSelfCare() {
  const db = useDb();
  const [today, setToday] = useState<string | null>(null);
  const [items, setItems] = useState<SelfCareItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { dayStartHour } = await getSettings(db);
    const key = todayKey(dayStartHour);
    await ensureInstancesForDate(db, key);
    const instances = await listInstancesForDate(db, key);
    const tasks = await getTasksByIds(db, [...new Set(instances.map((i) => i.taskId))]);
    const taskById = new Map(tasks.map((t) => [t.id, t]));

    const selfCareItems = instances
      .map((instance) => {
        const task = taskById.get(instance.taskId);
        return task && task.isSelfCare ? { instance, task } : null;
      })
      .filter((item): item is SelfCareItem => item !== null);

    setToday(key);
    setItems(selfCareItems);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load on mount
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const task = await createTask(db, { ...input, isSelfCare: true, tracksDuration: false });
      if (!task.recurring && today) {
        await getOrCreateInstance(db, task.id, today);
      }
      await refresh();
    },
    [db, today, refresh]
  );

  const toggleComplete = useCallback(
    async (item: SelfCareItem) => {
      if (item.instance.completed) {
        await uncompleteInstance(db, item.instance.id);
      } else {
        await completeInstance(db, item.instance.id);
      }
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

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(db, taskId);
      await refresh();
    },
    [db, refresh]
  );

  /** Deletes just one day's occurrence of a recurring self-care item, excluding that date so it isn't regenerated. */
  const removeTaskOccurrence = useCallback(
    async (instanceId: string, taskId: string, occurrenceDateKey: string) => {
      await deleteInstance(db, instanceId);
      await excludeDate(db, taskId, occurrenceDateKey);
      await refresh();
    },
    [db, refresh]
  );

  return { loading, today, items, refresh, addTask, toggleComplete, editTask, removeTask, removeTaskOccurrence };
}
