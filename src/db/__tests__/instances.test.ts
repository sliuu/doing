import type { SQLiteDatabase } from 'expo-sqlite';

import {
  adjustDuration,
  completeInstance,
  deleteInstance,
  ensureInstancesForDate,
  getInstance,
  getLiveDurationSeconds,
  getOrCreateInstance,
  getOrCreateTodoInstance,
  listInstancesForDate,
  listInstancesForTask,
  pauseTimer,
  setScheduledDate,
  setTimeOfDay,
  startTimer,
  uncompleteInstance,
} from '@/db/instances';
import { createTask, excludeDate } from '@/db/tasks';
import { createTestDb } from '@/test-utils/sqlite';

describe('getOrCreateInstance', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('creates a new instance with the given defaults', async () => {
    const task = await createTask(db, { title: 'Read' });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19', { timeOfDay: 'morning' });

    expect(instance.taskId).toBe(task.id);
    expect(instance.date).toBe('2026-06-19');
    expect(instance.timeOfDay).toBe('morning');
    expect(instance.completed).toBe(false);
  });

  it('defaults timeOfDay to anytime when none is given', async () => {
    const task = await createTask(db, { title: 'Read' });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');
    expect(instance.timeOfDay).toBe('anytime');
  });

  it('is idempotent for the same task+date, ignoring defaults on the second call', async () => {
    const task = await createTask(db, { title: 'Read' });
    const first = await getOrCreateInstance(db, task.id, '2026-06-19', { timeOfDay: 'morning' });
    const second = await getOrCreateInstance(db, task.id, '2026-06-19', { timeOfDay: 'evening' });
    expect(second.id).toBe(first.id);
    expect(second.timeOfDay).toBe('morning');
  });
});

describe('ensureInstancesForDate', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('creates an instance for a daily task on every date', async () => {
    const task = await createTask(db, { title: 'Stretch', recurring: true, recurrenceRule: { freq: 'daily' } });

    await ensureInstancesForDate(db, '2026-06-19');
    await ensureInstancesForDate(db, '2026-06-20');

    const instances = await listInstancesForTask(db, task.id);
    expect(instances.map((i) => i.date)).toEqual(['2026-06-19', '2026-06-20']);
  });

  it('only creates an instance for a weekly task on its configured weekday', async () => {
    // 2026-06-19 is a Friday (5), 2026-06-20 is a Saturday (6)
    const task = await createTask(db, {
      title: 'Weigh in',
      recurring: true,
      recurrenceRule: { freq: 'weekly', daysOfWeek: [5] },
    });

    await ensureInstancesForDate(db, '2026-06-19');
    await ensureInstancesForDate(db, '2026-06-20');

    const instances = await listInstancesForTask(db, task.id);
    expect(instances.map((i) => i.date)).toEqual(['2026-06-19']);
  });

  it('only creates an instance for a monthly task on its configured day of month', async () => {
    const task = await createTask(db, {
      title: 'Pay rent',
      recurring: true,
      recurrenceRule: { freq: 'monthly', dayOfMonth: 1 },
    });

    await ensureInstancesForDate(db, '2026-06-01');
    await ensureInstancesForDate(db, '2026-06-15');
    await ensureInstancesForDate(db, '2026-07-01');

    const instances = await listInstancesForTask(db, task.id);
    expect(instances.map((i) => i.date)).toEqual(['2026-06-01', '2026-07-01']);
  });

  it('does not touch non-recurring tasks', async () => {
    const task = await createTask(db, { title: 'One-off', recurring: false });
    await ensureInstancesForDate(db, '2026-06-19');
    expect(await listInstancesForTask(db, task.id)).toEqual([]);
  });

  it('skips generating an instance for a date excluded on the task, but still generates other dates', async () => {
    const task = await createTask(db, { title: 'Stretch', recurring: true, recurrenceRule: { freq: 'daily' } });
    await excludeDate(db, task.id, '2026-06-19');

    await ensureInstancesForDate(db, '2026-06-19');
    await ensureInstancesForDate(db, '2026-06-20');

    const instances = await listInstancesForTask(db, task.id);
    expect(instances.map((i) => i.date)).toEqual(['2026-06-20']);
  });

  it("deleting just one day's instance doesn't stop it reappearing unless that date is excluded", async () => {
    const task = await createTask(db, { title: 'Stretch', recurring: true, recurrenceRule: { freq: 'daily' } });
    await ensureInstancesForDate(db, '2026-06-19');
    const [instance] = await listInstancesForTask(db, task.id);

    await deleteInstance(db, instance.id);
    expect(await listInstancesForTask(db, task.id)).toEqual([]);

    // Without excluding the date, the next ensure call regenerates it.
    await ensureInstancesForDate(db, '2026-06-19');
    expect((await listInstancesForTask(db, task.id)).map((i) => i.date)).toEqual(['2026-06-19']);
  });

  it("carries a recurring task's time-of-day section forward day to day", async () => {
    const task = await createTask(db, { title: 'Meditate', recurring: true, recurrenceRule: { freq: 'daily' } });

    await ensureInstancesForDate(db, '2026-06-19');
    const day1 = await listInstancesForTask(db, task.id);
    expect(day1[0].timeOfDay).toBe('anytime');

    // User drags it into "morning" on day 1.
    await setTimeOfDay(db, day1[0].id, 'morning');

    // Next day's instance should land in "morning" too, not reset to "anytime".
    await ensureInstancesForDate(db, '2026-06-20');
    const day2 = await listInstancesForTask(db, task.id);
    const newInstance = day2.find((i) => i.date === '2026-06-20')!;
    expect(newInstance.timeOfDay).toBe('morning');
  });

  it('lets each new day be moved independently without affecting past days', async () => {
    const task = await createTask(db, { title: 'Meditate', recurring: true, recurrenceRule: { freq: 'daily' } });

    await ensureInstancesForDate(db, '2026-06-19');
    const [instanceDay1] = await listInstancesForTask(db, task.id);
    await setTimeOfDay(db, instanceDay1.id, 'morning');

    await ensureInstancesForDate(db, '2026-06-20');
    const day2Instances = await listInstancesForTask(db, task.id);
    const instanceDay2 = day2Instances.find((i) => i.date === '2026-06-20')!;
    await setTimeOfDay(db, instanceDay2.id, 'evening');

    await ensureInstancesForDate(db, '2026-06-21');
    const all = await listInstancesForTask(db, task.id);
    expect(all.find((i) => i.date === '2026-06-19')?.timeOfDay).toBe('morning');
    expect(all.find((i) => i.date === '2026-06-20')?.timeOfDay).toBe('evening');
    expect(all.find((i) => i.date === '2026-06-21')?.timeOfDay).toBe('evening');
  });
});

describe('listInstancesForDate', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('includes recurring instances dated today plus to-do instances scheduled to today', async () => {
    const recurring = await createTask(db, { title: 'Daily', recurring: true, recurrenceRule: { freq: 'daily' } });
    await ensureInstancesForDate(db, '2026-06-19');

    const todo = await createTask(db, { title: 'Errand', recurring: false });
    const todoInstance = await getOrCreateTodoInstance(db, todo.id, '2026-06-18T00:00:00.000Z');
    await setScheduledDate(db, todoInstance.id, '2026-06-19');

    const items = await listInstancesForDate(db, '2026-06-19');
    expect(items.map((i) => i.taskId).sort()).toEqual([recurring.id, todo.id].sort());
  });
});

describe('timer + duration tracking', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
    jest.useFakeTimers().setSystemTime(new Date('2026-06-19T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('folds elapsed running time into currentDurationSeconds on pause', async () => {
    const task = await createTask(db, { title: 'Work', tracksDuration: true });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');

    await startTimer(db, instance.id);
    jest.advanceTimersByTime(90 * 1000);
    await pauseTimer(db, instance.id);

    const updated = await getInstance(db, instance.id);
    expect(updated?.timerState).toBe('paused');
    expect(updated?.currentDurationSeconds).toBe(90);
  });

  it('reports live duration while running without mutating the stored value', async () => {
    const task = await createTask(db, { title: 'Work', tracksDuration: true });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');
    await startTimer(db, instance.id);
    jest.advanceTimersByTime(30 * 1000);

    const live = await getInstance(db, instance.id);
    expect(getLiveDurationSeconds(live!, Date.now())).toBe(30);
    expect(live?.currentDurationSeconds).toBe(0); // unchanged until paused
  });

  it('starting a timer pauses any other instance that was running', async () => {
    const taskA = await createTask(db, { title: 'Work A', tracksDuration: true });
    const taskB = await createTask(db, { title: 'Work B', tracksDuration: true });
    const instanceA = await getOrCreateInstance(db, taskA.id, '2026-06-19');
    const instanceB = await getOrCreateInstance(db, taskB.id, '2026-06-19');

    await startTimer(db, instanceA.id);
    jest.advanceTimersByTime(40 * 1000);
    await startTimer(db, instanceB.id);

    const a = await getInstance(db, instanceA.id);
    const b = await getInstance(db, instanceB.id);
    expect(a?.timerState).toBe('paused');
    expect(a?.currentDurationSeconds).toBe(40);
    expect(b?.timerState).toBe('running');
  });

  it('adjustDuration bumps and clamps at zero', async () => {
    const task = await createTask(db, { title: 'Work', tracksDuration: true });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');

    await adjustDuration(db, instance.id, 600);
    expect((await getInstance(db, instance.id))?.currentDurationSeconds).toBe(600);

    await adjustDuration(db, instance.id, -10000);
    expect((await getInstance(db, instance.id))?.currentDurationSeconds).toBe(0);
  });

  it('completing pauses any running timer and stores the final duration', async () => {
    const task = await createTask(db, { title: 'Work', tracksDuration: true });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');
    await startTimer(db, instance.id);
    jest.advanceTimersByTime(45 * 1000);

    await completeInstance(db, instance.id);

    const completed = await getInstance(db, instance.id);
    expect(completed?.completed).toBe(true);
    expect(completed?.timerState).toBe('idle');
    expect(completed?.currentDurationSeconds).toBe(45);
    expect(completed?.completedAt).not.toBeNull();
  });

  it('uncompleting clears the completed flag and timestamp', async () => {
    const task = await createTask(db, { title: 'Work' });
    const instance = await getOrCreateInstance(db, task.id, '2026-06-19');
    await completeInstance(db, instance.id);
    await uncompleteInstance(db, instance.id);

    const reopened = await getInstance(db, instance.id);
    expect(reopened?.completed).toBe(false);
    expect(reopened?.completedAt).toBeNull();
  });
});

