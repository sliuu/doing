import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/id';
import type { RecurrenceRule } from '@/lib/recurrence';

import { Task, TaskRow, TaskSize, taskFromRow } from '@/db/types';

export interface NewTaskInput {
  title: string;
  emoji?: string | null;
  category?: string;
  isSelfCare?: boolean;
  isSeed?: boolean;
  size?: TaskSize | null;
  recurring?: boolean;
  recurrenceRule?: RecurrenceRule | null;
  tracksDuration?: boolean;
  expectedDuration?: number | null;
  orderIndex?: number;
  hideOnNoWorkDays?: boolean;
  hideOnLowEnergyDays?: boolean;
  selfCareSection?: string | null;
}

export async function createTask(db: SQLiteDatabase, input: NewTaskInput): Promise<Task> {
  const id = createId();
  await db.runAsync(
    `INSERT INTO tasks
      (id, title, emoji, category, is_self_care, is_seed, size, recurring, recurrence_rule, tracks_duration, expected_duration, subtasks, order_index, hide_on_no_work_days, hide_on_low_energy_days, self_care_section)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title,
    input.emoji ?? null,
    input.category ?? 'uncategorized',
    input.isSelfCare ? 1 : 0,
    input.isSeed ? 1 : 0,
    input.size ?? null,
    input.recurring ? 1 : 0,
    input.recurrenceRule ? JSON.stringify(input.recurrenceRule) : null,
    input.tracksDuration ? 1 : 0,
    input.expectedDuration ?? null,
    '[]',
    input.orderIndex ?? 0,
    input.hideOnNoWorkDays ? 1 : 0,
    input.hideOnLowEnergyDays ? 1 : 0,
    input.selfCareSection ?? null
  );
  return (await getTask(db, id))!;
}

export async function getTask(db: SQLiteDatabase, id: string): Promise<Task | null> {
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
  return row ? taskFromRow(row) : null;
}

export async function updateTask(db: SQLiteDatabase, id: string, patch: Partial<NewTaskInput>): Promise<void> {
  const current = await getTask(db, id);
  if (!current) return;
  await db.runAsync(
    `UPDATE tasks
     SET title = ?, emoji = ?, category = ?, size = ?, recurring = ?, recurrence_rule = ?,
         tracks_duration = ?, expected_duration = ?, subtasks = ?, hide_on_no_work_days = ?, hide_on_low_energy_days = ?,
         self_care_section = ?
     WHERE id = ?`,
    patch.title ?? current.title,
    patch.emoji !== undefined ? patch.emoji : current.emoji,
    patch.category ?? current.category,
    patch.size !== undefined ? patch.size : current.size,
    (patch.recurring ?? current.recurring) ? 1 : 0,
    patch.recurrenceRule !== undefined
      ? patch.recurrenceRule ? JSON.stringify(patch.recurrenceRule) : null
      : current.recurrenceRule ? JSON.stringify(current.recurrenceRule) : null,
    (patch.tracksDuration ?? current.tracksDuration) ? 1 : 0,
    patch.expectedDuration !== undefined ? patch.expectedDuration : current.expectedDuration,
    JSON.stringify(current.subtasks),
    (patch.hideOnNoWorkDays ?? current.hideOnNoWorkDays) ? 1 : 0,
    (patch.hideOnLowEnergyDays ?? current.hideOnLowEnergyDays) ? 1 : 0,
    patch.selfCareSection !== undefined ? patch.selfCareSection : current.selfCareSection,
    id
  );
}

export async function deleteTask(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}

/** Marks `dateKey` as excluded so a recurring task's instance for that day is never regenerated. */
export async function excludeDate(db: SQLiteDatabase, taskId: string, dateKey: string): Promise<void> {
  const task = await getTask(db, taskId);
  if (!task || task.excludedDates.includes(dateKey)) return;
  await db.runAsync(
    'UPDATE tasks SET excluded_dates = ? WHERE id = ?',
    JSON.stringify([...task.excludedDates, dateKey]),
    taskId
  );
}

export async function getTasksByIds(db: SQLiteDatabase, ids: string[]): Promise<Task[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<TaskRow>(`SELECT * FROM tasks WHERE id IN (${placeholders})`, ...ids);
  return rows.map(taskFromRow);
}

const SEED_CATEGORIES = ['health', 'work', 'self-care', 'spirituality', 'hobbies'];

/** Seeded categories plus any distinct category already in use, sorted alphabetically. */
export async function listCategories(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ category: string }>(
    "SELECT DISTINCT category FROM tasks WHERE category != 'uncategorized'"
  );
  const all = new Set([...SEED_CATEGORIES, ...rows.map((r) => r.category)]);
  return [...all].sort((a, b) => a.localeCompare(b));
}

export async function listTasks(
  db: SQLiteDatabase,
  filter: { isSelfCare?: boolean; recurring?: boolean } = {}
): Promise<Task[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.isSelfCare !== undefined) {
    clauses.push('is_self_care = ?');
    params.push(filter.isSelfCare ? 1 : 0);
  }
  if (filter.recurring !== undefined) {
    clauses.push('recurring = ?');
    params.push(filter.recurring ? 1 : 0);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks ${where} ORDER BY order_index ASC, created_at ASC`,
    ...params
  );
  return rows.map(taskFromRow);
}
