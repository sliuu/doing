import type { SQLiteDatabase } from 'expo-sqlite';

import { createTask, deleteTask, excludeDate, getTask, getTasksByIds, listCategories, listTasks, updateTask } from '@/db/tasks';
import { createTestDb } from '@/test-utils/sqlite';

describe('tasks', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('creates a task and reads back the same data', async () => {
    const task = await createTask(db, {
      title: 'Drink water',
      emoji: '💧',
      category: 'health',
      recurring: true,
      recurrenceRule: { freq: 'daily' },
      tracksDuration: false,
    });

    const fetched = await getTask(db, task.id);
    expect(fetched).toEqual(task);
    expect(fetched?.title).toBe('Drink water');
    expect(fetched?.recurrenceRule).toEqual({ freq: 'daily' });
    expect(fetched?.subtasks).toEqual([]);
  });

  it('applies sensible defaults for omitted fields', async () => {
    const task = await createTask(db, { title: 'Untitled' });
    expect(task.category).toBe('uncategorized');
    expect(task.isSelfCare).toBe(false);
    expect(task.recurring).toBe(false);
    expect(task.recurrenceRule).toBeNull();
    expect(task.subtasks).toEqual([]);
  });

  it('lists tasks filtered by recurring and isSelfCare', async () => {
    await createTask(db, { title: 'One-off', recurring: false });
    await createTask(db, { title: 'Daily habit', recurring: true, recurrenceRule: { freq: 'daily' } });
    await createTask(db, { title: 'Self-care', isSelfCare: true });

    expect((await listTasks(db, { recurring: true })).map((t) => t.title)).toEqual(['Daily habit']);
    expect((await listTasks(db, { isSelfCare: true })).map((t) => t.title)).toEqual(['Self-care']);
    expect((await listTasks(db)).length).toBe(3);
  });

  it('updates a task in place', async () => {
    const task = await createTask(db, { title: 'Old title' });
    await updateTask(db, task.id, { title: 'New title', recurring: true, recurrenceRule: { freq: 'daily' } });

    const updated = await getTask(db, task.id);
    expect(updated?.title).toBe('New title');
    expect(updated?.recurring).toBe(true);
    expect(updated?.recurrenceRule).toEqual({ freq: 'daily' });
  });

  it('fetches multiple tasks by id', async () => {
    const a = await createTask(db, { title: 'A' });
    const b = await createTask(db, { title: 'B' });

    const fetched = await getTasksByIds(db, [a.id, b.id]);
    expect(fetched.map((t) => t.title).sort()).toEqual(['A', 'B']);
    expect(await getTasksByIds(db, [])).toEqual([]);
  });

  it('deletes a task', async () => {
    const task = await createTask(db, { title: 'Temporary' });
    await deleteTask(db, task.id);
    expect(await getTask(db, task.id)).toBeNull();
  });

  it('updates category, size, and duration tracking on a task', async () => {
    const task = await createTask(db, { title: 'Old', category: 'health', size: 'small', tracksDuration: false });

    await updateTask(db, task.id, {
      category: 'custom-category',
      size: 'large',
      tracksDuration: true,
      expectedDuration: 30,
    });

    const updated = await getTask(db, task.id);
    expect(updated?.category).toBe('custom-category');
    expect(updated?.size).toBe('large');
    expect(updated?.tracksDuration).toBe(true);
    expect(updated?.expectedDuration).toBe(30);
    expect(updated?.subtasks).toEqual([]);
    // Fields omitted from the patch are left untouched.
    expect(updated?.title).toBe('Old');
  });

  it('defaults the no-work and low-energy hide flags to false, and supports toggling both', async () => {
    const task = await createTask(db, { title: 'Workout' });
    expect(task.hideOnNoWorkDays).toBe(false);
    expect(task.hideOnLowEnergyDays).toBe(false);

    await updateTask(db, task.id, { hideOnNoWorkDays: true, hideOnLowEnergyDays: true });
    const updated = await getTask(db, task.id);
    expect(updated?.hideOnNoWorkDays).toBe(true);
    expect(updated?.hideOnLowEnergyDays).toBe(true);
  });

  it('lists seeded categories plus any in-use categories, deduplicated and sorted', async () => {
    await createTask(db, { title: 'A', category: 'work' });
    await createTask(db, { title: 'B', category: 'zzz-custom' });
    await createTask(db, { title: 'C', category: 'zzz-custom' });

    const categories = await listCategories(db);
    expect(categories).toEqual(['health', 'hobbies', 'self-care', 'spirituality', 'work', 'zzz-custom']);
  });

  it('excludes the default uncategorized bucket from category listings', async () => {
    await createTask(db, { title: 'Uncategorized task' });

    const categories = await listCategories(db);
    expect(categories).not.toContain('uncategorized');
  });

  it('starts with no excluded dates, and excludeDate appends without duplicating', async () => {
    const task = await createTask(db, { title: 'Stretch', recurring: true, recurrenceRule: { freq: 'daily' } });
    expect(task.excludedDates).toEqual([]);

    await excludeDate(db, task.id, '2026-06-19');
    await excludeDate(db, task.id, '2026-06-19'); // idempotent
    await excludeDate(db, task.id, '2026-06-20');

    const updated = await getTask(db, task.id);
    expect(updated?.excludedDates).toEqual(['2026-06-19', '2026-06-20']);
  });
});
