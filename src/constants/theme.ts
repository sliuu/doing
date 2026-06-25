/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** A single fixed dark-maroon aesthetic — intentionally the same in both schemes. */
const palette = {
  text: '#F1E3D6',
  background: '#190a0a',
  backgroundElement: '#2b1414',
  backgroundSelected: '#3d1c1c',
  textSecondary: '#b08d83',
  primary: '#e9cda2',
  primarySoft: '#3a2a1c',
  scheduled: '#93a3c9',
  scheduledSoft: '#23283a',
  today: '#d8b26b',
  todaySoft: '#3a2e18',
  danger: '#e2666b',
  border: '#4a2424',
  surface: '#1f0e0e',
  pill: '#f2e6d8',
  pillText: '#3a1414',
  tabActive: 'rgba(233, 205, 162, 0.16)',
} as const;

export const Colors = {
  light: palette,
  dark: palette,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
