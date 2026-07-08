import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export function TabBarIcon({
  glyph,
  render,
  size = 18,
  focused,
}: {
  glyph?: string;
  render?: (color: string) => ReactNode;
  size?: number;
  focused: boolean;
}) {
  const theme = Colors;
  const color = focused ? theme.primary : theme.textSecondary;

  if (render) return <>{render(color)}</>;
  return <Text style={{ fontSize: size, lineHeight: size * 1.15, color }}>{glyph}</Text>;
}

/** Wraps the default icon+label content in a pill so the active highlight encompasses both. */
export function TabBarButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  testID,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: ((e: GestureResponderEvent) => void) | null;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: { selected?: boolean } | null;
  testID?: string;
}) {
  const theme = Colors;
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityState={accessibilityState ?? undefined}
      accessibilityRole="button"
      testID={testID}
      style={style}>
      <View style={[styles.pill, focused && { backgroundColor: theme.tabActive }]}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
