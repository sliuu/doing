import type { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_VERSION = 2;

const CREATE_TASKS = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  is_easy_win INTEGER NOT NULL DEFAULT 0,
  is_seed INTEGER NOT NULL DEFAULT 0,
  size TEXT,
  recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  tracks_duration INTEGER NOT NULL DEFAULT 0,
  expected_duration INTEGER,
  subtasks TEXT NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const ADD_IS_SEED_COLUMN = `ALTER TABLE tasks ADD COLUMN is_seed INTEGER NOT NULL DEFAULT 0;`;

const CREATE_TASK_INSTANCES = `
CREATE TABLE IF NOT EXISTS task_instances (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time_of_day TEXT,
  scheduled_date TEXT,
  current_duration_seconds INTEGER NOT NULL DEFAULT 0,
  timer_state TEXT NOT NULL DEFAULT 'idle',
  timer_started_at TEXT,
  subtask_states TEXT NOT NULL DEFAULT '[]',
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE (task_id, date)
);
`;

const CREATE_TASK_INSTANCES_INDEX = `
CREATE INDEX IF NOT EXISTS idx_task_instances_date ON task_instances(date);
`;

const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 0),
  day_start_hour INTEGER NOT NULL DEFAULT 4
);
`;

const SEED_SETTINGS = `
INSERT INTO settings (id, day_start_hour) VALUES (0, 4)
ON CONFLICT (id) DO NOTHING;
`;

const CREATE_APP_OPENS = `
CREATE TABLE IF NOT EXISTS app_opens (
  date TEXT PRIMARY KEY NOT NULL
);
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= CURRENT_VERSION) return;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      ${CREATE_TASKS}
      ${CREATE_TASK_INSTANCES}
      ${CREATE_TASK_INSTANCES_INDEX}
      ${CREATE_SETTINGS}
      ${SEED_SETTINGS}
      ${CREATE_APP_OPENS}
    `);
  }
  if (currentVersion >= 1 && currentVersion < 2) {
    await db.execAsync(ADD_IS_SEED_COLUMN);
  }
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
}
