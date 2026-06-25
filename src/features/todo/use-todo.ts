import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import {
  adjustDuration,
  completeInstance,
  getOrCreateTodoInstance,
  listInstancesForTask,
  setScheduledDate,
  uncompleteInstance,
} from '@/db/instances';
import { createTask, deleteTask, listTasks, NewTaskInput, updateTask } from '@/db/tasks';
import { todayKey } from '@/lib/day';
import type { TaskSize } from '@/db/types';

import { TodoItem } from '@/features/todo/types';
import type { CompleteOpts } from '@/features/shared/complete-modal';

export type TodoSections = Record<TaskSize, TodoItem[]>;

const EMPTY_SECTIONS: TodoSections = { large: [], medium: [], small: [] };

function groupBySize(items: TodoItem[]): TodoSections {
  const sections: TodoSections = { large: [], medium: [], small: [] };
  for (const item of items) {
    const size = item.task.size ?? 'small';
    sections[size].push(item);
  }
  for (const size of Object.keys(sections) as TaskSize[]) {
    sections[size].sort((a, b) => a.task.orderIndex - b.task.orderIndex);
  }
  return sections;
}

export function useTodo() {
  const db = useDb();
  const [today, setToday] = useState<string | null>(null);
  const [sections, setSections] = useState<TodoSections>(EMPTY_SECTIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { dayStartHour } = await getSettings(db);
    const key = todayKey(dayStartHour);
    const tasks = await listTasks(db, { recurring: false, isSelfCare: false });
    const items: TodoItem[] = [];
    for (const task of tasks) {
      const instances = await listInstancesForTask(db, task.id);
      items.push({ task, instance: instances[0] ?? null });
    }
    setToday(key);
    setSections(groupBySize(items));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load on mount
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      await createTask(db, input);
      await refresh();
    },
    [db, refresh]
  );

  const schedule = useCallback(
    async (item: TodoItem, dateKey: string | null) => {
      const instance = await getOrCreateTodoInstance(db, item.task.id, item.task.createdAt);
      await setScheduledDate(db, instance.id, dateKey);
      await refresh();
    },
    [db, refresh]
  );

  const toggleComplete = useCallback(
    async (item: TodoItem, opts?: CompleteOpts) => {
      if (item.instance?.completed) {
        await uncompleteInstance(db, item.instance.id);
      } else {
        const instance = await getOrCreateTodoInstance(db, item.task.id, item.task.createdAt);
        const completedAt = opts?.completedDateKey ? `${opts.completedDateKey}T12:00:00.000Z` : undefined;
        await completeInstance(db, instance.id, {
          durationSeconds: opts?.durationSeconds,
          completedAt,
        });
      }
      await refresh();
    },
    [db, refresh]
  );

  const addTime = useCallback(
    async (item: TodoItem, deltaSeconds: number) => {
      const instance = await getOrCreateTodoInstance(db, item.task.id, item.task.createdAt);
      await adjustDuration(db, instance.id, deltaSeconds);
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

  return { loading, sections, today, refresh, addTask, schedule, toggleComplete, addTime, editTask, removeTask };
}
