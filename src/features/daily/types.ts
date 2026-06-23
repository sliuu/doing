import type { Task, TaskInstance, TimeOfDay } from '@/db/types';

export interface DailyItem {
  instance: TaskInstance;
  task: Task;
}

export type DailySections = Record<TimeOfDay, DailyItem[]>;

export const TIME_OF_DAY_SECTIONS: { key: TimeOfDay; label: string }[] = [
  { key: 'anytime', label: 'Anytime' },
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];
