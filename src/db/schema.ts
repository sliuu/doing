import type { SQLiteDatabase } from 'expo-sqlite';

const CURRENT_VERSION = 7;

const CREATE_TASKS = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  is_self_care INTEGER NOT NULL DEFAULT 0,
  is_seed INTEGER NOT NULL DEFAULT 0,
  size TEXT,
  recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  tracks_duration INTEGER NOT NULL DEFAULT 0,
  expected_duration INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hide_on_no_work_days INTEGER NOT NULL DEFAULT 0,
  hide_on_low_energy_days INTEGER NOT NULL DEFAULT 0,
  excluded_dates TEXT NOT NULL DEFAULT '[]',
  self_care_section TEXT
);
`;

const ADD_IS_SEED_COLUMN = `ALTER TABLE tasks ADD COLUMN is_seed INTEGER NOT NULL DEFAULT 0;`;

const ADD_HIDE_COLUMNS = `
ALTER TABLE tasks ADD COLUMN hide_on_no_work_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN hide_on_low_energy_days INTEGER NOT NULL DEFAULT 0;
`;

const ADD_EXCLUDED_DATES_COLUMN = `ALTER TABLE tasks ADD COLUMN excluded_dates TEXT NOT NULL DEFAULT '[]';`;

const RENAME_IS_EASY_WIN_COLUMN = `ALTER TABLE tasks RENAME COLUMN is_easy_win TO is_self_care;`;

// Seeded self-care items used to be rotated a few per day of the week; now they should all show up every day.
const FIX_SEED_RECURRENCE = `UPDATE tasks SET recurrence_rule = '{"freq":"daily"}' WHERE is_seed = 1;`;

const ADD_SELF_CARE_SECTION_COLUMN = `ALTER TABLE tasks ADD COLUMN self_care_section TEXT;`;

// Backfills the section for the seed library's 21 fixed titles on installs that seeded before sections existed.
const BACKFILL_SEED_SELF_CARE_SECTIONS = `
UPDATE tasks SET self_care_section = 'fun' WHERE is_seed = 1 AND title IN (
  'Put on a favorite song and dance for one song'
);
UPDATE tasks SET self_care_section = 'calming' WHERE is_seed = 1 AND title IN (
  'Take one minute to breathe deeply',
  'Do a 5 minute grounding meditation',
  'Make a cup of tea',
  'Write down one worry and one way to let it go',
  'Do a quick body scan and notice how you feel'
);
UPDATE tasks SET self_care_section = 'gratitude' WHERE is_seed = 1 AND title IN (
  'Name three things you''re grateful for today',
  'Name one small win today',
  'Name one thing you like about yourself',
  'Write down one thing you''re looking forward to',
  'Send a kind text to a friend',
  'Give yourself a compliment out loud',
  'Step outside and look at the sky for a minute'
);
UPDATE tasks SET self_care_section = 'cleaning' WHERE is_seed = 1 AND title IN (
  'Tidy your desk or one surface for 5 minutes',
  'Spend 5 minutes cleaning around the house',
  'Delete 20 photos from your camera roll'
);
UPDATE tasks SET self_care_section = 'energizing' WHERE is_seed = 1 AND title IN (
  'Go on a short walk to get some fresh air',
  'Light a candle or use a scent you like',
  'Do 5 squats',
  'Spend 5 minutes stretching',
  'Refill your water bottle and drink a glass'
);
`;

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
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE (task_id, date)
);
`;

// Columns that were never surfaced anywhere in the UI (emoji, notes) or belonged to the
// removed subtasks feature. Dropped in v7 to keep the schema matched to what the app uses.
const DROP_UNUSED_COLUMNS = `
ALTER TABLE tasks DROP COLUMN emoji;
ALTER TABLE tasks DROP COLUMN subtasks;
ALTER TABLE task_instances DROP COLUMN subtask_states;
ALTER TABLE task_instances DROP COLUMN notes;
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
  if (currentVersion >= 2 && currentVersion < 3) {
    await db.execAsync(ADD_HIDE_COLUMNS);
  }
  if (currentVersion >= 3 && currentVersion < 4) {
    await db.execAsync(ADD_EXCLUDED_DATES_COLUMN);
  }
  if (currentVersion >= 1 && currentVersion < 5) {
    await db.execAsync(RENAME_IS_EASY_WIN_COLUMN);
    await db.execAsync(FIX_SEED_RECURRENCE);
  }
  if (currentVersion >= 1 && currentVersion < 6) {
    await db.execAsync(ADD_SELF_CARE_SECTION_COLUMN);
    await db.execAsync(BACKFILL_SEED_SELF_CARE_SECTIONS);
  }
  if (currentVersion >= 1 && currentVersion < 7) {
    await db.execAsync(DROP_UNUSED_COLUMNS);
  }
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
}
