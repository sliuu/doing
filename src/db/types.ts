import type { RecurrenceRule } from '@/lib/recurrence';

export type TaskSize = 'large' | 'medium' | 'small';
export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';
export type TimerState = 'idle' | 'running' | 'paused';

export interface Task {
  id: string;
  title: string;
  category: string;
  isSelfCare: boolean;
  isSeed: boolean;
  size: TaskSize | null;
  recurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  tracksDuration: boolean;
  expectedDuration: number | null; // minutes
  orderIndex: number;
  createdAt: string;
  hideOnNoWorkDays: boolean;
  hideOnLowEnergyDays: boolean;
  excludedDates: string[]; // logical day keys excluded from a recurring task's occurrences
  selfCareSection: string | null;
}

export interface TaskInstance {
  id: string;
  taskId: string;
  date: string; // logical day key, YYYY-MM-DD
  timeOfDay: TimeOfDay | null;
  scheduledDate: string | null;
  currentDurationSeconds: number;
  timerState: TimerState;
  timerStartedAt: string | null; // ISO timestamp
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
}

export interface Settings {
  dayStartHour: number;
}

/** Row shapes as stored in SQLite (snake_case, JSON-encoded blobs, 0/1 booleans). */
export interface TaskRow {
  id: string;
  title: string;
  category: string;
  is_self_care: number;
  is_seed: number;
  size: TaskSize | null;
  recurring: number;
  recurrence_rule: string | null;
  tracks_duration: number;
  expected_duration: number | null;
  order_index: number;
  created_at: string;
  hide_on_no_work_days: number;
  hide_on_low_energy_days: number;
  excluded_dates: string;
  self_care_section: string | null;
}

export interface TaskInstanceRow {
  id: string;
  task_id: string;
  date: string;
  time_of_day: TimeOfDay | null;
  scheduled_date: string | null;
  current_duration_seconds: number;
  timer_state: TimerState;
  timer_started_at: string | null;
  completed: number;
  completed_at: string | null;
  order_index: number;
}

/**
 * Parses a JSON column, falling back (and logging) instead of throwing on bad data.
 * A single malformed row must never blow up the whole app — one corrupt task would
 * otherwise crash DbBootstrap and blank every screen. Handles NULL, empty, and legacy
 * junk like the literal string "undefined" left by earlier builds.
 */
function parseJsonColumn<T>(value: string | null, fallback: T, context: string): T {
  if (value == null || value === '' || value === 'undefined' || value === 'null') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn(`[db] ignoring malformed JSON in ${context}:`, value);
    return fallback;
  }
}

export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    isSelfCare: row.is_self_care === 1,
    isSeed: row.is_seed === 1,
    size: row.size,
    recurring: row.recurring === 1,
    recurrenceRule: parseJsonColumn(row.recurrence_rule, null, 'tasks.recurrence_rule'),
    tracksDuration: row.tracks_duration === 1,
    expectedDuration: row.expected_duration,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    hideOnNoWorkDays: row.hide_on_no_work_days === 1,
    hideOnLowEnergyDays: row.hide_on_low_energy_days === 1,
    excludedDates: parseJsonColumn(row.excluded_dates, [], 'tasks.excluded_dates'),
    selfCareSection: row.self_care_section,
  };
}

export function instanceFromRow(row: TaskInstanceRow): TaskInstance {
  return {
    id: row.id,
    taskId: row.task_id,
    date: row.date,
    timeOfDay: row.time_of_day,
    scheduledDate: row.scheduled_date,
    currentDurationSeconds: row.current_duration_seconds,
    timerState: row.timer_state,
    timerStartedAt: row.timer_started_at,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    orderIndex: row.order_index,
  };
}
