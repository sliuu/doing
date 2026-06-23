import type { SQLiteDatabase } from 'expo-sqlite';

import { createTask, deleteTask, getTask, getTasksByIds, listTasks, updateTask } from '@/db/tasks';
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
      subtasks: [{ id: 's1', title: 'Fill bottle' }],
    });

    const fetched = await getTask(db, task.id);
    expect(fetched).toEqual(task);
    expect(fetched?.title).toBe('Drink water');
    expect(fetched?.recurrenceRule).toEqual({ freq: 'daily' });
    expect(fetched?.subtasks).toEqual([{ id: 's1', title: 'Fill bottle' }]);
  });

  it('applies sensible defaults for omitted fields', async () => {
    const task = await createTask(db, { title: 'Untitled' });
    expect(task.category).toBe('uncategorized');
    expect(task.isEasyWin).toBe(false);
    expect(task.recurring).toBe(false);
    expect(task.recurrenceRule).toBeNull();
    expect(task.subtasks).toEqual([]);
  });

  it('lists tasks filtered by recurring and isEasyWin', async () => {
    await createTask(db, { title: 'One-off', recurring: false });
    await createTask(db, { title: 'Daily habit', recurring: true, recurrenceRule: { freq: 'daily' } });
    await createTask(db, { title: 'Easy win', isEasyWin: true });

    expect((await listTasks(db, { recurring: true })).map((t) => t.title)).toEqual(['Daily habit']);
    expect((await listTasks(db, { isEasyWin: true })).map((t) => t.title)).toEqual(['Easy win']);
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
});
