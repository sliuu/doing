import type { Task, TaskInstance, TimeOfDay } from '@/db/types';

export interface DailyItem {
  instance: TaskInstance;
  task: Task;
  /** The task's category color, joined in at load time (null for uncategorized). */
  categoryColor: string | null;
}

export type DailySections = Record<TimeOfDay, DailyItem[]>;

export const TIME_OF_DAY_SECTIONS: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'morning routine' },
  { key: 'afternoon', label: 'work' },
  { key: 'evening', label: 'evening' },
  { key: 'anytime', label: 'anytime' },
];

export type DayMode = 'normal' | 'low-energy' | 'no-work';

export const DAY_MODE_OPTIONS: { key: DayMode; label: string }[] = [
  { key: 'normal', label: 'normal' },
  { key: 'low-energy', label: 'low energy' },
  { key: 'no-work', label: 'no-work' },
];

/** On low-energy days, expected durations are halved (rounded down to the nearest minute). */
export function effectiveExpectedMinutes(minutes: number | null, dayMode: DayMode): number | null {
  if (minutes === null) return null;
  return dayMode === 'low-energy' ? Math.floor(minutes / 2) : minutes;
}
