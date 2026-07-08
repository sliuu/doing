import type { Task, TaskInstance, TaskSize } from '@/db/types';

export interface TodoItem {
  task: Task;
  instance: TaskInstance | null;
  /** The task's category color, joined in at load time (null for uncategorized). */
  categoryColor: string | null;
}

export type ScheduleState = 'none' | 'today' | 'scheduled';

export function scheduleStateFor(item: TodoItem, todayKey: string): ScheduleState {
  const scheduledDate = item.instance?.scheduledDate ?? null;
  if (!scheduledDate) return 'none';
  return scheduledDate === todayKey ? 'today' : 'scheduled';
}

export const SIZE_SECTIONS: { key: TaskSize; label: string }[] = [
  { key: 'large', label: 'big tasks (3+ hours)' },
  { key: 'medium', label: 'medium tasks (1-2 hours)' },
  { key: 'small', label: 'small tasks (<1 hour)' },
];
