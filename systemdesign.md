# System Design

This document explains how the **doing** app is built, from the ground up, assuming no prior knowledge of the tools involved. It covers what each technology is, why it was chosen, how the code is organized, and the hard-won lessons baked into the current design.

---

## 1. What this app is

**doing** is a personal task-management app for iPhone with five tabs:

- **To-dos** — a backlog of one-off tasks, grouped by size (big / medium / small), schedulable onto a specific day.
- **Today** — today's tasks, grouped by time of day (morning / work / evening / anytime), with optional timers.
- **Self-Care** — small kind things to do, grouped into fun / calming / gratitude / cleaning / energizing. Comes pre-loaded with 21 suggestions.
- **Me** — a day streak, plus stats on what you've completed and how long you spent.
- **Tools** — placeholder for future utilities.

Two properties shape the entire design:

1. **Single-user and offline.** There is no server, no account, no network calls. Everything lives in one database file on the phone.
2. **Personal-scale data.** A few hundred rows, not millions. This means we can prefer *simple and readable* over *maximally efficient* everywhere.

---

## 2. The technology stack — what each tool is and why it's here

### React Native — the app framework

**What it is:** React Native lets you write mobile apps in JavaScript/TypeScript using React (the same component model used for websites). Instead of rendering to a browser, your components render *real native iOS views* — a React Native `<Text>` becomes a genuine UILabel, not a web page in a wrapper.

**Why it helps here:** One familiar language (TypeScript), a huge ecosystem, and fast iteration. You describe UI as functions of state ("when `completed` is true, show a checkmark"), and React handles updating the screen when state changes.

**The mental model:** every screen is a function that returns UI. When data changes (via `useState`), React re-runs the function and updates only what changed on screen.

### Expo — the toolchain around React Native

**What it is:** Expo is a set of tools and pre-built native modules that sit on top of React Native. Raw React Native requires you to write/configure a lot of native iOS code yourself; Expo packages the common stuff (SQLite, haptics, audio, splash screens…) as installable modules and provides the build tooling.

**Why it helps here:** the app uses `expo-sqlite` (database), `expo-haptics` (vibration when a timer finishes), `expo-audio` (the gong sound), `expo-splash-screen`, and Expo Router. None of these required writing a line of Swift.

**Important nuance — this project is "prebuilt":** the `ios/` folder is checked into the repo and contains a real Xcode project. The app is built and installed onto the phone **from Xcode**, not from Expo's cloud. Two practical consequences:

- Adding a dependency that contains native code (like `@react-native-community/datetimepicker`) requires re-running `pod install` / `npx expo prebuild` and rebuilding in Xcode. Just editing `package.json` is not enough.
- **The JavaScript is bundled into the app at build time.** If you change the code and just relaunch the app from your phone, you're running the *old* code. You must rebuild from Xcode — and if things look stale, do **Product → Clean Build Folder (⇧⌘K)** first. This exact confusion has caused "my fix didn't work" mysteries before; when in doubt, clean-build.

### Expo Router — screens as files

**What it is:** a routing library where the file structure *is* the navigation structure. A file at `src/app/(tabs)/daily.tsx` automatically becomes the "daily" screen inside a tab navigator.

**Why it helps here:** no manual route configuration. The `(tabs)` folder (parentheses mean "grouping folder, not part of the URL") holds the five tab screens, and `(tabs)/_layout.tsx` declares the tab bar itself — labels, icons, order.

- `src/app/_layout.tsx` — the root of the whole app. Everything is wrapped here (theme, database, bootstrap — see §5).
- `src/app/(tabs)/_layout.tsx` — the 5-tab bottom bar.
- `src/app/(tabs)/index.tsx` — To-dos (a file named `index` is the default/first tab).
- `src/app/(tabs)/daily.tsx`, `self-care.tsx`, `stats.tsx`, `tools.tsx` — the rest.

### TypeScript — JavaScript with types

**What it is:** a superset of JavaScript where you declare the *shape* of your data (`Task` has a `title: string`, a `completed: boolean`, …). The compiler catches mismatches before the app ever runs.

**Why it helps here:** the biggest win is at the database boundary. The compiler knows exactly which fields a `Task` has, so a typo like `task.titel` or forgetting to handle `expectedDuration` being `null` is caught at compile time (`npx tsc --noEmit` checks the whole project). When we removed the subtasks feature, TypeScript pointed at every file that still referenced it.

### SQLite (via `expo-sqlite`) — the database

**What it is:** SQLite is a tiny, battle-tested relational database that lives in a single file on the device (`doing.db`). You talk to it with SQL (`SELECT`, `INSERT`, `UPDATE`…). `expo-sqlite` is the Expo module that exposes it to JavaScript.

**Why it helps here:** the app's data is relational by nature — tasks have many per-day instances — and needs to survive app restarts. SQLite gives durable storage, real queries, and constraints (e.g. "only one instance per task per day", enforced by the database itself with `UNIQUE (task_id, date)`).

**Why there's no Redux / Zustand / other state library:** SQLite is the single source of truth. Screens load from it into ordinary React `useState`, and after any write they simply re-query (`refresh()`). At personal scale this "read → change → re-read" loop is fast, dead simple, and can't drift out of sync with the database.

### React Compiler — automatic performance, with one big gotcha

**What it is:** an experimental compiler (enabled in `app.json` via `"reactCompiler": true`) that automatically memoizes your components — it caches computations and skips re-running them when their inputs haven't changed. Normally you'd hand-write `useMemo`/`useCallback` for this; the compiler does it for you.

**The gotcha that bit this app:** the compiler assumes your render code is *pure* — same inputs, same output. A function that secretly reads `Date.now()` breaks this contract. `getLiveDurationSeconds(instance)` used to read the clock internally; the compiler saw that `instance` hadn't changed between renders, served the cached result, and **the on-screen timer froze** even though time was accruing correctly underneath.

**The fix and the rule:** the function now takes time as an explicit parameter — `getLiveDurationSeconds(instance, now)` — where `now` is React state that a `setInterval` updates every second. Now the compiler sees `now` change and recomputes. **Rule: anything computed during render must depend only on its explicit inputs. Clocks, randomness, and globals must be passed in as props/state.**

### Jest + better-sqlite3 — testing

**What it is:** Jest is the standard JavaScript test runner. The tests in `src/db/__tests__/` and `src/lib/__tests__/` exercise the database functions and date/recurrence math.

**The clever bit:** `expo-sqlite` only works inside a real app, not in Node where tests run. So `src/test-utils/sqlite.ts` wraps `better-sqlite3` (a Node SQLite library) in a shim that mimics expo-sqlite's API (`getFirstAsync`, `runAsync`, …). Tests run the *actual SQL and migrations* against a real in-memory SQLite database — nothing is mocked. Run them with `npx jest`.

There are no UI tests; screens are verified by hand on the simulator/phone.

### ESLint — code linting

Catches likely mistakes and enforces React rules (especially the hooks/purity rules that matter under React Compiler). Run with `npx expo lint`.

---

## 3. How the folders are organized

```
src/
  app/          Screens. One file = one route. Thin — they wire hooks to components.
  components/   App-wide UI primitives (ThemedText, ThemedView, icons, tab bar).
  constants/    theme.ts — the color palette, fonts, spacing scale.
  db/           Everything that touches SQLite: schema, migrations, queries.
  features/     One folder per tab domain (daily/, todo/, self-care/, stats/)
                plus shared/ for cross-domain pieces.
  hooks/        Tiny cross-cutting hooks (use-theme).
  lib/          Pure utility functions. No React, no SQLite — just logic.
  test-utils/   The better-sqlite3 test shim.
ios/            The checked-in native Xcode project.
```

The layering rule, top to bottom:

- **`app/` screens** call one `use-*` hook and render feature components. No business logic.
- **`features/<domain>/`** owns a tab's logic: a `use-<domain>.ts` hook (the only thing that talks to the database and holds state), a `types.ts`, row components, and form modals.
- **`db/`** owns all SQL. Nothing outside `db/` writes a query.
- **`lib/`** is pure functions (date math, recurrence matching, formatting, ID generation). Because they import nothing framework-y, they're trivially unit-testable.

---

## 4. The database design

### The two core tables: `tasks` and `task_instances`

This is the most important idea in the app.

- A **task** is the *definition*: "Stretch, daily, morning, 10 minutes expected." One row, regardless of how many days it repeats.
- A **task instance** is *one occurrence on one day*: "Stretch on 2026-07-05 — completed, took 12 minutes." One row per `(task_id, date)`, enforced unique by the database.

Instances are **created lazily**: when a day's screen loads, `ensureInstancesForDate` walks every recurring task, checks whether its recurrence rule matches that date (`lib/recurrence.ts`), and creates any missing instance rows. Nothing is pre-generated into the future. Deleting "just today" removes the instance *and* records the date in the task's `excluded_dates` list so it doesn't get regenerated.

The insert uses `INSERT OR IGNORE` so that if two parts of the app race to create the same instance, the loser is silently dropped instead of crashing — the code then re-reads whichever row won.

Other tables:

- **`settings`** — a single row (`id = 0`) holding `day_start_hour`.
- **`app_opens`** — one row per day the app was opened; the streak is counted by walking backwards from today until a day is missing.

### The "logical day"

The day does **not** roll over at midnight — it rolls over at `day_start_hour` (default 4 a.m.). If you're up at 1 a.m. finishing tasks, they still count as "today." All date keys (`"2026-07-05"` strings) are computed through `lib/day.ts`; nothing else in the app is allowed to derive a day from `new Date()` directly.

### Migrations — how the schema evolves safely

`db/schema.ts` holds the schema and a version number (`CURRENT_VERSION`, currently 7). On every app start, `migrateDbIfNeeded` reads the database's stored version (`PRAGMA user_version`) and applies each upgrade step it's missing, in order, then stamps the new version. A fresh install creates the latest schema directly; an existing phone gets stepped forward. Migrations only go forward — there's no rollback, which is fine for a single-user app.

Migration 7 is a good example of deliberate deletion: it drops columns that no UI ever surfaced (`emoji`, `notes`) or that belonged to a removed feature (`subtasks`, `subtask_states`). Dead schema invites dead code.

### Row types vs. domain types

SQLite stores snake_case columns, numbers for booleans (`0`/`1`), and JSON blobs as strings. The app wants camelCase, real booleans, and parsed objects. `db/types.ts` defines both shapes (`TaskRow` vs `Task`) and converter functions (`taskFromRow`, `instanceFromRow`). Every `db/` function returns domain types; the raw row shape never leaks past that file boundary.

### The self-care seed

`db/seed.ts` holds the 21 built-in self-care prompts. On first launch (detected by "no rows with `is_seed = 1`"), they're inserted as ordinary recurring daily tasks tagged `is_seed = 1`. They're seeded **once** — if the user deletes some, they stay deleted.

---

## 5. App startup, step by step

Everything in `src/app/_layout.tsx` nests like this:

```
ThemeProvider          (navigation chrome colors)
  └─ DbProvider        (opens doing.db, runs migrations before anything renders)
       └─ DbBootstrap  (seeds + prepares today, gates the whole app)
            └─ Tabs    (the actual screens)
```

`DbBootstrap` (`db/bootstrap.tsx`) runs once per launch: seed the self-care library if needed → read settings → record today's app-open for the streak → create today's task instances. Crucially, **it renders nothing until this finishes, and renders the error message on screen if it fails.**

That gating exists because of a real bug: screens used to mount in parallel with seeding, query the database before the seed rows existed, and show permanently empty pages with no error anywhere. The two design lessons encoded here:

1. **Sequence startup explicitly.** Don't let consumers race the producer; make "the data is ready" a structural guarantee (children simply don't exist yet), not a convention each screen must remember.
2. **Never swallow errors into a blank screen.** A visible "Something went wrong starting up: \<message\>" turns a mystery into a bug report.

The per-screen hooks also wrap their loads in `try/catch` → `finally { setLoading(false) }`, so even an unexpected failure degrades to an empty-but-alive screen with the error in the Xcode console (that's where `console.error` output appears when running a phone build).

---

## 6. How a screen actually works (the data flow)

Using Today as the example — every tab follows the same pattern:

1. `daily.tsx` calls `useDaily()`.
2. `useDaily` (in `features/daily/use-daily.ts`) holds React state: the current date key, the loaded items, a `loading` flag. On mount (and whenever the date changes) it calls `db/` functions: `ensureInstancesForDate` → `listInstancesForDate` → `getTasksByIds`, pairs each instance with its task, and stores the result with `setItems`.
3. The screen groups items into sections and renders rows and modals.
4. Every user action (`toggleComplete`, `startTimer`, `editTask`, …) is a function returned by the hook that (a) writes to the database, then (b) calls `refresh()` to re-query. The screen re-renders from fresh data.

There is intentionally **no cache to invalidate and no store to sync** — the database is re-read after every write.

### Timers

Timer state lives on the instance row: `timer_state` (`idle`/`running`/`paused`), `timer_started_at` (when it last started), and `current_duration_seconds` (accumulated time from previous runs). The displayed time is `current_duration_seconds` + (now − `timer_started_at`) when running — computed by `getLiveDurationSeconds(instance, now)`, with `now` ticking once a second in React state (see the React Compiler section for why `now` must be a parameter). Pausing "folds" the elapsed time into `current_duration_seconds` and clears the start timestamp. Only one timer may run at once: starting one pauses any other. When the expected duration is reached, the timer modal plays a gong (`expo-audio`) and vibrates (`expo-haptics`).

### Day modes (Today screen only)

`normal` / `low-energy` / `no-work` is session-only state — never saved. Low-energy halves the *displayed* expected durations and hides tasks marked "hide on low-energy days"; no-work hides "hide on no-work days" tasks. The stored task data is never mutated by day mode.

---

## 7. The shared form system (and the modal lesson)

All six create/edit flows (task, to-do, self-care × new/edit) are built from one kit in `features/shared/`:

- **`form-sheet.tsx`** — `FormSheet` (the bottom sheet itself) plus small building blocks: `FormField` (label + content), `FormTextInput`, `ChipRow` (the selectable pill rows used everywhere), `SwitchRow`, `FormActions` (Delete / Cancel / Save row).
- **`recurrence-picker.tsx`** — the One-time/Daily/Weekly/Monthly chips with weekday and day-of-month follow-ups, plus the pure helpers that convert between form state and a stored `RecurrenceRule`.

Each feature then has exactly **one** form component handling both create and edit (`task-form-modal.tsx`, `todo-form-modal.tsx`, `self-care-form-modal.tsx`) — pass a `task` to edit, omit it to create.

**History, so it doesn't repeat:** these used to be six ~250-line copy-pasted files. Fixes (keyboard avoidance, scrolling) got applied to some copies and not others, so the self-care modal stayed broken long after the others were fixed. Copy-paste isn't just ugly — it's how bugs survive fixes. If you find yourself copying a component to change two lines, extract the shared part instead.

**The layout lesson inside `FormSheet`:** to make a bottom sheet that grows with content but caps at ~70% of screen and scrolls beyond, the `maxHeight` must go **on the `ScrollView` itself**. Putting it on a parent whose height is otherwise automatic doesn't constrain the ScrollView — content just gets clipped with no way to scroll to it. And giving the ScrollView `flex: 1` inside an auto-height parent collapses it to zero height (an invisible modal). Both failure modes shipped at some point; the comment in `form-sheet.tsx` marks the grave.

Modals that are *not* forms (timer, complete-confirmation, schedule, action sheets, the delete-choice dialog) are individual components in their feature folders — they're centered dialogs or menus, not scrolling bottom sheets, so they don't use `FormSheet`.

---

## 8. Theming

- `constants/theme.ts` — one fixed dark-maroon palette (identical in light and dark mode, deliberately), the font stack (system serif for display text, sans for UI), and a spacing scale (`Spacing.one` = 4 up to `Spacing.six` = 64). Using the scale instead of raw pixel numbers keeps spacing consistent.
- `components/themed-text.tsx` / `themed-view.tsx` — the only components that read the palette directly. Everything else styles through them (`<ThemedText type="subtitle" themeColor="textSecondary">`), so a palette change is a one-file edit.

---

## 9. Running, checking, and testing

| What | Command |
| --- | --- |
| Type-check everything | `npx tsc --noEmit` |
| Run tests (45, DB + date/recurrence logic) | `npx jest` |
| Lint | `npx expo lint` |
| Install on device | Build from Xcode (clean build if anything looks stale) |

The pre-commit ritual is: `tsc` → `jest` → build on the phone.

---

## 10. Gotchas checklist (the things that have actually gone wrong)

1. **"My change didn't do anything"** → the phone is running an old JS bundle. Clean build in Xcode (⇧⌘K), rebuild.
2. **A value on screen won't update, but the data is right** → React Compiler memoized an impure computation. Make it a pure function of props/state (pass `Date.now()` in as `now`).
3. **Modal content cut off or invisible** → the ScrollView height rules in §7. `maxHeight` on the ScrollView; never `flex: 1` in an auto-height parent.
4. **A screen is blank with no error** → check the Xcode console for `[DbBootstrap]` / `[useDaily]` / `[useSelfCare]` errors; startup failures also render on screen now.
5. **New native dependency does nothing / crashes** → `pod install` + rebuild from Xcode. JS reload can't load native code.
6. **Seed data with apostrophes** → migration SQL uses raw strings, so literal `'` must be doubled (`you''re`) inside `db/schema.ts`.
7. **Date math looks off by a day** → someone bypassed `lib/day.ts`. All day-keying must respect `day_start_hour`.
