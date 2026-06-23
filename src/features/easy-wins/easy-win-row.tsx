import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EasyWinItem } from '@/features/easy-wins/types';

export function EasyWinRow({
  item,
  onToggleComplete,
  onEdit,
}: {
  item: EasyWinItem;
  onToggleComplete: () => void;
  onEdit: () => void;
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

      <ThemedText style={styles.emoji}>{item.task.emoji ?? '🌱'}</ThemedText>

      <ThemedText
        style={[{ flex: 1 }, completed && styles.strikethrough]}
        themeColor={completed ? 'textSecondary' : 'text'}>
        {item.task.title}
      </ThemedText>
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
  emoji: {
    fontSize: 20,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});
