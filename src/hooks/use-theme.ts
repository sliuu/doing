import { Colors } from '@/constants/theme';

/**
 * The app's palette. A hook (rather than importing Colors directly) so that
 * introducing real theming later is a one-file change.
 */
export function useTheme() {
  return Colors;
}
