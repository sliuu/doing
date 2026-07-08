import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SelfCareItem } from '@/features/self-care/types';

export function SelfCareRow({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  item: SelfCareItem;
  /** Receives the screen position of the tap, so completion effects can burst from it. */
  onToggleComplete: (pos: { x: number; y: number }) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const completed = item.instance.completed;

  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        completed && styles.completedRow,
        pressed && styles.pressed,
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={(e) => {
          e.stopPropagation();
          onToggleComplete({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
        }}
        style={[styles.checkbox, { borderColor: theme.primary }, completed && { backgroundColor: theme.primary }]}>
        {completed && <ThemedText style={{ color: theme.onPrimary }}>✓</ThemedText>}
      </Pressable>

      <ThemedText
        style={[{ flex: 1 }, completed && styles.strikethrough]}
        themeColor={completed ? 'textSecondary' : 'text'}>
        {item.task.title}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete"
        hitSlop={Spacing.two}
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={styles.deleteButton}>
        <ThemedText style={{ color: theme.danger }}>✕</ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  completedRow: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.75,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: Spacing.one,
  },
});
