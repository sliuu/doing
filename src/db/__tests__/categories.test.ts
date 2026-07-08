import type { SQLiteDatabase } from 'expo-sqlite';

import { CATEGORY_COLORS, listCategories, seedCategories, suggestColor, upsertCategory } from '@/db/categories';
import { createTask } from '@/db/tasks';
import { createTestDb } from '@/test-utils/sqlite';

describe('categories', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('seeds the five default categories with colors on a fresh install', async () => {
    const categories = await listCategories(db);
    expect(categories.map((c) => c.name)).toEqual(['health', 'hobbies', 'self-care', 'spirituality', 'work']);
    for (const category of categories) {
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('upsertCategory creates a new category and recolors an existing one', async () => {
    await upsertCategory(db, 'errands', '#7fbcae');
    expect(await listCategories(db)).toContainEqual({ name: 'errands', color: '#7fbcae' });

    await upsertCategory(db, 'errands', '#cd8ca4');
    const updated = (await listCategories(db)).find((c) => c.name === 'errands');
    expect(updated?.color).toBe('#cd8ca4');
  });

  it('backfills a category row for task categories that predate the table', async () => {
    await createTask(db, { title: 'Legacy', category: 'chores' });
    await db.runAsync('DELETE FROM categories WHERE name = ?', 'chores'); // simulate a pre-v8 task

    await seedCategories(db);
    const names = (await listCategories(db)).map((c) => c.name);
    expect(names).toContain('chores');
  });

  it('never creates a row for uncategorized', async () => {
    await createTask(db, { title: 'No category' });
    await seedCategories(db);
    expect((await listCategories(db)).map((c) => c.name)).not.toContain('uncategorized');
  });

  it('seedCategories is idempotent and preserves user-picked colors', async () => {
    await upsertCategory(db, 'health', '#a8a09a'); // user recolors a seed category
    await seedCategories(db);

    const health = (await listCategories(db)).find((c) => c.name === 'health');
    expect(health?.color).toBe('#a8a09a');
  });

  it('suggestColor picks the least-used preset color', async () => {
    expect(suggestColor([])).toBe(CATEGORY_COLORS[0]);
    const taken = CATEGORY_COLORS.slice(0, 3).map((color, i) => ({ name: `c${i}`, color }));
    expect(suggestColor(taken)).toBe(CATEGORY_COLORS[3]);
  });
});
