import { Platform } from 'react-native';

/**
 * The design tokens for the whole app. Components must never hard-code a color —
 * everything reads from this palette (usually via `useTheme()`), so restyling the
 * app is a one-file change.
 *
 * The app is intentionally dark-only: one fixed near-black, warm palette,
 * regardless of the system light/dark setting.
 */
export const Colors = {
  /** Body text — warm off-white. */
  text: '#F1E3D6',
  /** Muted text: labels, hints, secondary info. */
  textSecondary: '#a89086',
  /** Screen background — near-black with a whisper of warmth. */
  background: '#131010',
  /** Cards and rows sitting on the background. */
  backgroundElement: '#231b1b',
  /** Pressed/selected surfaces and input borders. */
  backgroundSelected: '#372a2a',
  /** Neutral used to tint rows whose task has no category. */
  uncategorized: '#99908a',
  /** The accent — muted gold. Buttons, active chips, checkboxes. */
  primary: '#ddb97f',
  /** Text/icons rendered on top of `primary`. */
  onPrimary: '#2b1d0d',
  /** Soft tint of the accent, for subtle button backgrounds. */
  primarySoft: '#3a2d1c',
  /** "Scheduled for a date" accents on to-dos. */
  scheduled: '#93a3c9',
  scheduledSoft: '#23283a',
  /** "Today" accents: running timers, the today banner. */
  today: '#d8b26b',
  todaySoft: '#3a2e18',
  /** Destructive actions. */
  danger: '#e2666b',
  /** The day-mode pill when active (inverted: light bg, dark text). */
  pill: '#f2e6d8',
  pillText: '#3a1414',
  /** Highlight behind the active tab icon. */
  tabActive: 'rgba(221, 185, 127, 0.14)',
  /** Dimmed backdrop behind modals. */
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS system sans (UI text). */
    sans: 'system-ui',
    /** iOS system serif (display headings, section labels). */
    serif: 'ui-serif',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
  },
});

/** Spacing scale — use these instead of raw pixel numbers to keep rhythm consistent. */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
