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
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const completed = item.instance.completed;

  return (
    <Pressable onPress={onEdit} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        style={[styles.checkbox, { borderColor: theme.primary }, completed && { backgroundColor: theme.primary }]}>
        {completed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
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
