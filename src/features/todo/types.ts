import type { Task, TaskInstance, TaskSize } from '@/db/types';

export interface TodoItem {
  task: Task;
  instance: TaskInstance | null;
}

export type ScheduleState = 'none' | 'today' | 'scheduled';

export function scheduleStateFor(item: TodoItem, todayKey: string): ScheduleState {
  const scheduledDate = item.instance?.scheduledDate ?? null;
  if (!scheduledDate) return 'none';
  return scheduledDate === todayKey ? 'today' : 'scheduled';
}

export const SIZE_SECTIONS: { key: TaskSize; label: string }[] = [
  { key: 'large', label: 'Large (3h+)' },
  { key: 'medium', label: 'Medium (1-2h)' },
  { key: 'small', label: 'Small (<30m)' },
];
