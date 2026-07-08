import type { SQLiteDatabase } from 'expo-sqlite';

import { getTaskStats } from '@/db/stats';
import { completeInstance, getOrCreateInstance } from '@/db/instances';
import { createTask } from '@/db/tasks';
import { todayKey } from '@/lib/day';
import { createTestDb } from '@/test-utils/sqlite';

const DAY_START_HOUR = 4;

describe('stats', () => {
  let db: SQLiteDatabase;
  let today: string;

  beforeEach(async () => {
    db = await createTestDb();
    today = todayKey(DAY_START_HOUR);
  });

  async function completeToday(taskId: string, durationSeconds = 0) {
    const instance = await getOrCreateInstance(db, taskId, today);
    await completeInstance(db, instance.id, { durationSeconds });
  }

  it('aggregates completions and duration per task, most-completed first', async () => {
    const stretch = await createTask(db, { title: 'Stretch', tracksDuration: true });
    const read = await createTask(db, { title: 'Read' });

    await completeToday(stretch.id, 600);
    await completeToday(read.id);

    const stats = await getTaskStats(db, DAY_START_HOUR, 'week', false);
    expect(stats).toHaveLength(2);
    const stretchStat = stats.find((s) => s.task.id === stretch.id);
    expect(stretchStat?.completions).toBe(1);
    expect(stretchStat?.totalDurationSeconds).toBe(600);
  });

  it('separates self-care stats from regular task stats', async () => {
    const task = await createTask(db, { title: 'Work thing' });
    const care = await createTask(db, { title: 'Tea', isSelfCare: true });
    await completeToday(task.id);
    await completeToday(care.id);

    const regular = await getTaskStats(db, DAY_START_HOUR, 'week', false);
    const selfCare = await getTaskStats(db, DAY_START_HOUR, 'week', true);
    expect(regular.map((s) => s.task.id)).toEqual([task.id]);
    expect(selfCare.map((s) => s.task.id)).toEqual([care.id]);
  });

  it('excludes incomplete instances', async () => {
    const task = await createTask(db, { title: 'Not done' });
    await getOrCreateInstance(db, task.id, today);

    expect(await getTaskStats(db, DAY_START_HOUR, 'all', false)).toEqual([]);
  });

  it('excludes completions before the period start', async () => {
    const task = await createTask(db, { title: 'Old win' });
    const instance = await getOrCreateInstance(db, task.id, '2020-01-01');
    await completeInstance(db, instance.id, { completedAt: '2020-01-01T12:00:00.000Z' });

    expect(await getTaskStats(db, DAY_START_HOUR, 'week', false)).toEqual([]);
    expect((await getTaskStats(db, DAY_START_HOUR, 'all', false)).length).toBe(1);
  });
});
