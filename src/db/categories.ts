import type { SQLiteDatabase } from 'expo-sqlite';

export interface Category {
  name: string;
  color: string;
}

/** The preset swatches a user can pick from — muted tones that sit well on the dark palette. */
export const CATEGORY_COLORS = [
  '#d98a6f', // terracotta
  '#ddb97f', // gold
  '#a3b878', // sage
  '#7fbcae', // teal
  '#93a3c9', // periwinkle
  '#b493c9', // lavender
  '#cd8ca4', // rose
  '#a8a09a', // stone
] as const;

/** Categories every install starts with, and their default colors. */
const SEED_CATEGORIES: Category[] = [
  { name: 'health', color: '#a3b878' },
  { name: 'work', color: '#93a3c9' },
  { name: 'self-care', color: '#cd8ca4' },
  { name: 'spirituality', color: '#b493c9' },
  { name: 'hobbies', color: '#7fbcae' },
];

/** All categories, alphabetical. `uncategorized` is deliberately not a row — it's the absence of a category. */
export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>('SELECT name, color FROM categories ORDER BY name ASC');
}

/** Creates a category or changes its color. */
export async function upsertCategory(db: SQLiteDatabase, name: string, color: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO categories (name, color) VALUES (?, ?) ON CONFLICT (name) DO UPDATE SET color = excluded.color',
    name,
    color
  );
}

/** The least-used preset color — so new categories spread across the palette instead of repeating. */
export function suggestColor(existing: Category[]): string {
  const counts = new Map<string, number>(CATEGORY_COLORS.map((c) => [c, 0]));
  for (const category of existing) {
    if (counts.has(category.color)) counts.set(category.color, counts.get(category.color)! + 1);
  }
  let best: string = CATEGORY_COLORS[0];
  let bestCount = Infinity;
  for (const [color, count] of counts) {
    if (count < bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Populates the categories table: the seed set, plus a row for every category
 * already in use on tasks (so installs that predate the table get colors too).
 * Idempotent — existing rows are never overwritten.
 */
export async function seedCategories(db: SQLiteDatabase): Promise<void> {
  for (const { name, color } of SEED_CATEGORIES) {
    await db.runAsync('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)', name, color);
  }

  const inUse = await db.getAllAsync<{ category: string }>(
    `SELECT DISTINCT category FROM tasks
     WHERE category != 'uncategorized' AND category NOT IN (SELECT name FROM categories)`
  );
  for (const { category } of inUse) {
    const existing = await listCategories(db);
    await db.runAsync('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)', category, suggestColor(existing));
  }
}
