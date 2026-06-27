import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/lib/id';
import { matchesRecurrence } from '@/lib/recurrence';

import { instanceFromRow, TaskInstance, TaskInstanceRow } from '@/db/types';
import { listTasks } from '@/db/tasks';

export async function getInstance(db: SQLiteDatabase, id: string): Promise<TaskInstance | null> {
  const row = await db.getFirstAsync<TaskInstanceRow>('SELECT * FROM task_instances WHERE id = ?', id);
  return row ? instanceFromRow(row) : null;
}

/** Today's recurring instances, plus any to-do instance scheduled to today (`scheduled_date`). */
export async function listInstancesForDate(db: SQLiteDatabase, dateKey: string): Promise<TaskInstance[]> {
  const rows = await db.getAllAsync<TaskInstanceRow>(
    'SELECT * FROM task_instances WHERE date = ? OR scheduled_date = ? ORDER BY order_index ASC',
    dateKey,
    dateKey
  );
  return rows.map(instanceFromRow);
}

/** Every TaskInstance for a given task — non-recurring (to-do) tasks have at most one. */
export async function listInstancesForTask(db: SQLiteDatabase, taskId: string): Promise<TaskInstance[]> {
  const rows = await db.getAllAsync<TaskInstanceRow>(
    'SELECT * FROM task_instances WHERE task_id = ? ORDER BY date ASC',
    taskId
  );
  return rows.map(instanceFromRow);
}

/** Creates a TaskInstance for `taskId` on `dateKey` if one doesn't already exist. */
export async function getOrCreateInstance(
  db: SQLiteDatabase,
  taskId: string,
  dateKey: string,
  defaults: { timeOfDay?: TaskInstance['timeOfDay']; scheduledDate?: string | null } = {}
): Promise<TaskInstance> {
  const existing = await db.getFirstAsync<TaskInstanceRow>(
    'SELECT * FROM task_instances WHERE task_id = ? AND date = ?',
    taskId,
    dateKey
  );
  if (existing) return instanceFromRow(existing);

  const id = createId();
  await db.runAsync(
    `INSERT INTO task_instances (id, task_id, date, time_of_day, scheduled_date)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    taskId,
    dateKey,
    defaults.timeOfDay ?? 'anytime',
    defaults.scheduledDate ?? null
  );
  return (await getInstance(db, id))!;
}

/**
 * The single TaskInstance for a non-recurring (to-do) task, creating it on first touch.
 * Keyed by the task's creation date so repeated calls always land on the same row.
 */
export async function getOrCreateTodoInstance(
  db: SQLiteDatabase,
  taskId: string,
  taskCreatedAt: string
): Promise<TaskInstance> {
  const existing = await db.getFirstAsync<TaskInstanceRow>(
    'SELECT * FROM task_instances WHERE task_id = ?',
    taskId
  );
  if (existing) return instanceFromRow(existing);
  return getOrCreateInstance(db, taskId, taskCreatedAt.slice(0, 10));
}

export async function setScheduledDate(
  db: SQLiteDatabase,
  instanceId: string,
  scheduledDate: string | null
): Promise<void> {
  await db.runAsync('UPDATE task_instances SET scheduled_date = ? WHERE id = ?', scheduledDate, instanceId);
}

/** The `time_of_day` of a task's most recent instance before `beforeDateKey`, if any. */
async function getPreviousTimeOfDay(
  db: SQLiteDatabase,
  taskId: string,
  beforeDateKey: string
): Promise<TaskInstance['timeOfDay'] | undefined> {
  const row = await db.getFirstAsync<TaskInstanceRow>(
    'SELECT * FROM task_instances WHERE task_id = ? AND date < ? ORDER BY date DESC LIMIT 1',
    taskId,
    beforeDateKey
  );
  return row ? instanceFromRow(row).timeOfDay : undefined;
}

/** Generates today's TaskInstance for every recurring task whose recurrence rule matches `dateKey`. */
export async function ensureInstancesForDate(db: SQLiteDatabase, dateKey: string): Promise<void> {
  const recurringTasks = await listTasks(db, { recurring: true });
  for (const task of recurringTasks) {
    if (task.excludedDates.includes(dateKey)) continue;
    if (task.recurrenceRule && matchesRecurrence(task.recurrenceRule, dateKey)) {
      const timeOfDay = await getPreviousTimeOfDay(db, task.id, dateKey);
      await getOrCreateInstance(db, task.id, dateKey, { timeOfDay });
    }
  }
}

/** Removes a single occurrence's row outright — pair with `excludeDate` on recurring tasks so it isn't regenerated. */
export async function deleteInstance(db: SQLiteDatabase, instanceId: string): Promise<void> {
  await db.runAsync('DELETE FROM task_instances WHERE id = ?', instanceId);
}

/** Only one timer may run at a time — folds any other running instance's elapsed time first. */
export async function startTimer(db: SQLiteDatabase, instanceId: string): Promise<void> {
  const others = await db.getAllAsync<TaskInstanceRow>(
    `SELECT * FROM task_instances WHERE timer_state = 'running' AND id != ?`,
    instanceId
  );
  for (const row of others) {
    await pauseTimer(db, row.id);
  }

  await db.runAsync(
    `UPDATE task_instances SET timer_state = 'running', timer_started_at = ? WHERE id = ?`,
    new Date().toISOString(),
    instanceId
  );
}

/** Folds any running elapsed time into `current_duration_seconds` and stops the clock. */
export async function pauseTimer(db: SQLiteDatabase, instanceId: string): Promise<void> {
  const instance = await getInstance(db, instanceId);
  if (!instance || instance.timerState !== 'running' || !instance.timerStartedAt) return;

  const elapsedSeconds = Math.floor((Date.now() - new Date(instance.timerStartedAt).getTime()) / 1000);
  await db.runAsync(
    `UPDATE task_instances
     SET current_duration_seconds = current_duration_seconds + ?, timer_state = 'paused', timer_started_at = NULL
     WHERE id = ?`,
    elapsedSeconds,
    instanceId
  );
}

/** Directly bumps (or reduces) the stored duration, independent of whether the timer is running. */
export async function adjustDuration(
  db: SQLiteDatabase,
  instanceId: string,
  deltaSeconds: number
): Promise<void> {
  await db.runAsync(
    `UPDATE task_instances SET current_duration_seconds = MAX(0, current_duration_seconds + ?) WHERE id = ?`,
    deltaSeconds,
    instanceId
  );
}

/** Live duration including any time elapsed since the timer was last started, without touching the DB. */
export function getLiveDurationSeconds(instance: TaskInstance): number {
  if (instance.timerState !== 'running' || !instance.timerStartedAt) {
    return instance.currentDurationSeconds;
  }
  const elapsedSeconds = Math.floor((Date.now() - new Date(instance.timerStartedAt).getTime()) / 1000);
  return instance.currentDurationSeconds + elapsedSeconds;
}

export async function completeInstance(
  db: SQLiteDatabase,
  instanceId: string,
  opts: { durationSeconds?: number; notes?: string | null; completedAt?: string } = {}
): Promise<void> {
  await pauseTimer(db, instanceId); // folds any running elapsed time first

  const instance = (await getInstance(db, instanceId))!;
  await db.runAsync(
    `UPDATE task_instances
     SET completed = 1, completed_at = ?, current_duration_seconds = ?, notes = ?, timer_state = 'idle'
     WHERE id = ?`,
    opts.completedAt ?? new Date().toISOString(),
    opts.durationSeconds ?? instance.currentDurationSeconds,
    opts.notes ?? instance.notes,
    instanceId
  );
}

export async function uncompleteInstance(db: SQLiteDatabase, instanceId: string): Promise<void> {
  await db.runAsync(`UPDATE task_instances SET completed = 0, completed_at = NULL WHERE id = ?`, instanceId);
}

export async function setTimeOfDay(
  db: SQLiteDatabase,
  instanceId: string,
  timeOfDay: TaskInstance['timeOfDay']
): Promise<void> {
  await db.runAsync('UPDATE task_instances SET time_of_day = ? WHERE id = ?', timeOfDay, instanceId);
}

