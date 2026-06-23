import type { SQLiteDatabase } from 'expo-sqlite';

import { dateKeyFor, todayKey, weekdayForKey, addDaysToKey } from '@/lib/day';

import { Task } from '@/db/types';
import { getTasksByIds } from '@/db/tasks';

export type StatsPeriod = 'week' | 'month' | 'year' | 'all';

export interface TaskStat {
  task: Task;
  completions: number;
  totalDurationSeconds: number;
}

interface CompletedRow {
  task_id: string;
  completed_at: string;
  current_duration_seconds: number;
}

function startKeyForPeriod(todaysKey: string, period: StatsPeriod): string | null {
  if (period === 'all') return null;
  if (period === 'week') return addDaysToKey(todaysKey, -weekdayForKey(todaysKey));
  const [year, month] = todaysKey.split('-');
  if (period === 'month') return `${year}-${month}-01`;
  return `${year}-01-01`;
}

export async function getTaskStats(
  db: SQLiteDatabase,
  dayStartHour: number,
  period: StatsPeriod,
  isEasyWin: boolean
): Promise<TaskStat[]> {
  const today = todayKey(dayStartHour);
  const startKey = startKeyForPeriod(today, period);

  const rows = await db.getAllAsync<CompletedRow>(
    `SELECT ti.task_id as task_id, ti.completed_at as completed_at, ti.current_duration_seconds as current_duration_seconds
     FROM task_instances ti JOIN tasks t ON t.id = ti.task_id
     WHERE ti.completed = 1 AND ti.completed_at IS NOT NULL AND t.is_easy_win = ?`,
    isEasyWin ? 1 : 0
  );

  const inRange = rows.filter((row) => {
    const key = dateKeyFor(new Date(row.completed_at), dayStartHour);
    return (!startKey || key >= startKey) && key <= today;
  });

  const byTask = new Map<string, { completions: number; totalDurationSeconds: number }>();
  for (const row of inRange) {
    const agg = byTask.get(row.task_id) ?? { completions: 0, totalDurationSeconds: 0 };
    agg.completions += 1;
    agg.totalDurationSeconds += row.current_duration_seconds;
    byTask.set(row.task_id, agg);
  }

  const tasks = await getTasksByIds(db, [...byTask.keys()]);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  return [...byTask.entries()]
    .map(([taskId, agg]) => {
      const task = taskById.get(taskId);
      return task ? { task, ...agg } : null;
    })
    .filter((stat): stat is TaskStat => stat !== null)
    .sort((a, b) => b.completions - a.completions || b.totalDurationSeconds - a.totalDurationSeconds);
}
