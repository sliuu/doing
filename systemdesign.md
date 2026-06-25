# System design

A single-user Expo / React Native app for daily task management, to-dos, and self-care. SQLite-backed, offline-only, no network calls.

## Stack

- Expo ~56, Expo Router ~56 (file-based routing, `(tabs)` group)
- React 19 / React Native 0.85
- `expo-sqlite` for storage, no backend
- TypeScript, ESLint, Jest (`jest-expo` preset, `better-sqlite3` for tests)
- `react-native-svg` and `react-native-reanimated`/`react-native-worklets` are present as Expo defaults but the UI is hand-rolled with `View`/`Text` (no chart or UI library in use)

## Top-level layout

```
src/
  app/            Expo Router screens (routes = file paths)
  components/     Generic, app-wide UI primitives
  constants/      Theme tokens
  db/             SQLite schema, migrations, and all data-access functions
  features/       Screen-specific logic and UI, one folder per domain
  hooks/          Small cross-cutting React hooks
  lib/            Pure, framework-free utilities
  test-utils/     Test-only helpers
ios/, android/    Native projects (this repo is prebuilt, not pure managed Expo)
```

The rule of thumb: **`db/`** owns persistence, **`features/<domain>/`** owns the logic and components for one tab, **`app/`** wires features into routes, **`lib/`** has no React and no SQLite — it's plain functions.

## Routing (`src/app`)

Expo Router maps files to routes.

- `_layout.tsx` — root layout. Wraps everything in `ThemeProvider` (light/dark from OS), `DbProvider` (opens the SQLite connection), and `DbBootstrap` (runs one-time startup work), then renders a headerless `Stack`.
- `(tabs)/_layout.tsx` — defines the 5-tab bottom bar: **To-dos** (`index`), **Tools** (`tools`), **Today** (`daily`), **Self-Care** (`self-care`), **Me** (`stats`). Tab bar labels use the sans font; screen titles inside each screen use serif.
- `(tabs)/index.tsx` — To-dos screen (backlog of all tasks, not tied to a specific day).
- `(tabs)/daily.tsx` — Today screen (today's task instances, grouped by time of day, with the running-timer banner).
- `(tabs)/self-care.tsx` — Self-Care screen (sectioned lists: fun / calming / gratitude / cleaning / energizing).
- `(tabs)/stats.tsx` — Me screen (streak, period selector, duration bar chart, top tasks, top self-care).
- `(tabs)/tools.tsx` — settings / utilities screen.

Each screen file is intentionally thin: it calls one `use-*` hook for data and state, and renders feature components. Business logic does not live in `app/`.

## Data layer (`src/db`)

SQLite is the only source of truth. There is no separate client-state store (no Redux/Zustand) — screens read straight from SQLite via hooks that call `db/*` functions and keep results in local component state.

- `schema.ts` — table definitions and the migration runner. Migrations are sequential `if (currentVersion >= N && currentVersion < N+1)` blocks gated by `PRAGMA user_version`. There is no rollback; only additive/forward migrations. Raw SQL strings are used with `db.execAsync` (no bound params), so any literal apostrophe in seed data must be manually doubled (`''`).
- `types.ts` — defines the two parallel shapes for every table: a camelCase domain type (`Task`, `TaskInstance`) and a snake_case `*Row` type matching the actual SQLite columns, plus `taskFromRow`/`instanceFromRow` converters. All `db/*` functions return domain types; only the row converters see snake_case.
- `provider.tsx` — opens the SQLite connection (`doing.db`) via `SQLiteProvider`, runs `migrateDbIfNeeded` on init, and re-exports `useSQLiteContext` as `useDb()`.
- `bootstrap.tsx` — runs once per app start: seeds the fixed self-care library if missing, records today's app-open (for the streak), and ensures today's recurring task instances exist.
- `tasks.ts` — CRUD for `tasks` (the recurring/template definition of a thing to do: title, category, recurrence rule, duration target, self-care section, etc).
- `instances.ts` — CRUD and state transitions for `task_instances` (one task's occurrence on one logical day: completion, timer state, scheduled date, subtask checkmarks).
- `seed.ts` — the fixed list of 21 self-care prompts, inserted once and tagged `is_seed = 1`.
- `settings.ts` — the single-row `settings` table (currently just `day_start_hour`).
- `streak.ts` — `app_opens` table and the consecutive-day streak calculation.
- `stats.ts` — read-only aggregation of completions/duration per task, scoped by time period (`week`/`month`/`year`/`all`) and self-care flag, used by the Me screen.

### Tables

- **`tasks`** — the template. Recurring or one-off, optionally self-care, optionally duration-tracked, optionally split into subtasks.
- **`task_instances`** — one row per `(task_id, date)`. Holds everything that varies day-to-day: timer state, completion, notes, ordering. Generated on demand by `ensureInstancesForDate`, not pre-created for the whole recurrence range.
- **`settings`** — single row (`id = 0`), app-wide config.
- **`app_opens`** — one row per day the app was opened, used only for streak counting.

### The "logical day"

A day does not turn over at midnight — it turns over at `settings.day_start_hour` (default 4am). All date-keying goes through `lib/day.ts`'s `dateKeyFor`/`todayKey`, never `new Date()` directly, so that staying up past midnight doesn't roll the day over early.

## Feature modules (`src/features/<domain>`)

Each domain folder holds everything specific to one tab: a `use-<domain>.ts` hook (the only thing that talks to `db/*` and holds state), a `types.ts` for domain-only types/constants, row components, and modals.

- **`daily/`** — Today screen. `use-daily.ts` loads today's instances grouped by time-of-day section; `types.ts` defines `DayMode` (normal / low-energy / no-work) and `effectiveExpectedMinutes`, which halves (floor) a task's expected duration on low-energy days for *display* purposes only — the stored `expectedDuration` on the task is never mutated by day mode. `task-row.tsx`, `timer-modal.tsx`, `task-actions-modal.tsx`, `pie-progress.tsx` (hand-rolled circular progress), `edit-task-modal.tsx`, `new-task-modal.tsx`.
- **`todo/`** — To-dos screen. `types.ts` defines `ScheduleState` (none / today / scheduled) and the three size-based sections (large/medium/small). `use-todo.ts`, `todo-row.tsx`, `schedule-modal.tsx` (calendar-based date picker for scheduling), `edit-todo-modal.tsx`, `new-todo-modal.tsx`.
- **`self-care/`** — Self-Care screen. `types.ts` defines the 5 fixed sections (`fun`/`calming`/`gratitude`/`cleaning`/`energizing`) and `sectionForItem`, which falls back to `fun` for any item without a section. `use-self-care.ts`, `self-care-row.tsx`, `new-self-care-modal.tsx`, `edit-self-care-modal.tsx`.
- **`stats/`** — Me screen. `use-stats.ts` wraps `db/stats.ts` per the selected period. `period-tabs.tsx` (week/month/year/all-time selector), `stats-row.tsx` (one ranked task row), `duration-bar-chart.tsx` (hand-rolled horizontal bar chart, duration-tracked tasks only, names truncated to 25 characters).
- **`shared/`** — cross-domain pieces used by more than one feature: `complete-modal.tsx`, `delete-choice-modal.tsx` (delete this occurrence vs. the whole recurring task), `duration-picker.tsx`, `date-picker-field.tsx` (native calendar picker wrapper around `@react-native-community/datetimepicker`), `category-picker.tsx`, `use-categories.ts`.

## Shared building blocks

- **`components/`** — `themed-text.tsx` / `themed-view.tsx` (the only place that should read `Colors`/`Fonts` directly; everything else should style through these), `tab-bar-icon.tsx`, `icons.tsx` (hand-drawn SVG icon set).
- **`constants/theme.ts`** — single fixed dark-maroon palette (same in light/dark — this app does not visually adapt to system color scheme beyond `ThemeProvider`'s nav-bar chrome), `Fonts` (sans/serif/rounded/mono via `Platform.select`), `Spacing` scale.
- **`hooks/`** — `use-theme.ts` (resolves the active palette), `use-color-scheme.ts`/`.web.ts` (platform split for web).
- **`lib/`** — `day.ts` (logical-day math), `recurrence.ts` (`RecurrenceRule` matching), `format.ts` (display formatting: durations, dates, name truncation), `id.ts` (id generation). No imports from `react` or `expo-sqlite` — these are pure and unit-tested directly.

## Native project (`ios/`)

This repo is **prebuilt**, not a plain managed-Expo project — the `ios/` folder is checked in and contains a real Xcode project with CocoaPods. This matters for any dependency that ships native code (e.g. `@react-native-community/datetimepicker`): adding it to `package.json` is not enough. `pod install` (or `npx expo prebuild`) must be run, and the app must be rebuilt from Xcode or `npx expo run:ios` — a Metro/JS reload alone will not link new native modules.

## Testing

`src/db/__tests__` and `src/lib/__tests__` cover the data layer and pure utilities directly against a real (in-memory, `better-sqlite3`-backed) SQLite instance via `test-utils/sqlite.ts` — not mocked. There are no component/UI tests; UI changes are verified manually in the simulator.
