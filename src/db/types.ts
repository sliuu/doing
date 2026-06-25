import type { RecurrenceRule } from '@/lib/recurrence';

export type TaskSize = 'large' | 'medium' | 'small';
export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';
export type TimerState = 'idle' | 'running' | 'paused';

export interface Subtask {
  id: string;
  title: string;
}

export interface SubtaskState {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  emoji: string | null;
  category: string;
  isSelfCare: boolean;
  isSeed: boolean;
  size: TaskSize | null;
  recurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  tracksDuration: boolean;
  expectedDuration: number | null; // minutes
  subtasks: Subtask[];
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
  subtaskStates: SubtaskState[];
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface Settings {
  dayStartHour: number;
}

/** Row shapes as stored in SQLite (snake_case, JSON-encoded blobs, 0/1 booleans). */
export interface TaskRow {
  id: string;
  title: string;
  emoji: string | null;
  category: string;
  is_self_care: number;
  is_seed: number;
  size: TaskSize | null;
  recurring: number;
  recurrence_rule: string | null;
  tracks_duration: number;
  expected_duration: number | null;
  subtasks: string;
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
  subtask_states: string;
  completed: number;
  completed_at: string | null;
  notes: string | null;
  order_index: number;
}

export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    category: row.category,
    isSelfCare: row.is_self_care === 1,
    isSeed: row.is_seed === 1,
    size: row.size,
    recurring: row.recurring === 1,
    recurrenceRule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null,
    tracksDuration: row.tracks_duration === 1,
    expectedDuration: row.expected_duration,
    subtasks: JSON.parse(row.subtasks),
    orderIndex: row.order_index,
    createdAt: row.created_at,
    hideOnNoWorkDays: row.hide_on_no_work_days === 1,
    hideOnLowEnergyDays: row.hide_on_low_energy_days === 1,
    excludedDates: JSON.parse(row.excluded_dates),
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
    subtaskStates: JSON.parse(row.subtask_states),
    completed: row.completed === 1,
    completedAt: row.completed_at,
    notes: row.notes,
    orderIndex: row.order_index,
  };
}
