import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/id';
import type { RecurrenceRule } from '@/lib/recurrence';

import { Task, TaskRow, TaskSize, taskFromRow, Subtask } from '@/db/types';

export interface NewTaskInput {
  title: string;
  emoji?: string | null;
  category?: string;
  isEasyWin?: boolean;
  isSeed?: boolean;
  size?: TaskSize | null;
  recurring?: boolean;
  recurrenceRule?: RecurrenceRule | null;
  tracksDuration?: boolean;
  expectedDuration?: number | null;
  subtasks?: Subtask[];
  orderIndex?: number;
}

export async function createTask(db: SQLiteDatabase, input: NewTaskInput): Promise<Task> {
  const id = createId();
  await db.runAsync(
    `INSERT INTO tasks
      (id, title, emoji, category, is_easy_win, is_seed, size, recurring, recurrence_rule, tracks_duration, expected_duration, subtasks, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title,
    input.emoji ?? null,
    input.category ?? 'uncategorized',
    input.isEasyWin ? 1 : 0,
    input.isSeed ? 1 : 0,
    input.size ?? null,
    input.recurring ? 1 : 0,
    input.recurrenceRule ? JSON.stringify(input.recurrenceRule) : null,
    input.tracksDuration ? 1 : 0,
    input.expectedDuration ?? null,
    JSON.stringify(input.subtasks ?? []),
    input.orderIndex ?? 0
  );
  return (await getTask(db, id))!;
}

export async function getTask(db: SQLiteDatabase, id: string): Promise<Task | null> {
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
  return row ? taskFromRow(row) : null;
}

export async function updateTask(
  db: SQLiteDatabase,
  id: string,
  patch: { title?: string; emoji?: string | null; recurring?: boolean; recurrenceRule?: RecurrenceRule | null }
): Promise<void> {
  const current = await getTask(db, id);
  if (!current) return;
  await db.runAsync(
    'UPDATE tasks SET title = ?, emoji = ?, recurring = ?, recurrence_rule = ? WHERE id = ?',
    patch.title ?? current.title,
    patch.emoji !== undefined ? patch.emoji : current.emoji,
    (patch.recurring ?? current.recurring) ? 1 : 0,
    patch.recurrenceRule !== undefined
      ? patch.recurrenceRule ? JSON.stringify(patch.recurrenceRule) : null
      : current.recurrenceRule ? JSON.stringify(current.recurrenceRule) : null,
    id
  );
}

export async function deleteTask(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}

export async function getTasksByIds(db: SQLiteDatabase, ids: string[]): Promise<Task[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<TaskRow>(`SELECT * FROM tasks WHERE id IN (${placeholders})`, ...ids);
  return rows.map(taskFromRow);
}

export async function listTasks(
  db: SQLiteDatabase,
  filter: { isEasyWin?: boolean; recurring?: boolean } = {}
): Promise<Task[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.isEasyWin !== undefined) {
    clauses.push('is_easy_win = ?');
    params.push(filter.isEasyWin ? 1 : 0);
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
