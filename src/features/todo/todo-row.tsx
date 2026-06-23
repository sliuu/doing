import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { scheduleStateFor, TodoItem } from '@/features/todo/types';

export function TodoRow({
  item,
  todayKey,
  onToggleComplete,
  onSchedule,
}: {
  item: TodoItem;
  todayKey: string;
  onToggleComplete: () => void;
  onSchedule: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const completed = instance?.completed ?? false;
  const scheduleState = scheduleStateFor(item, todayKey);

  const highlightColor =
    scheduleState === 'today' ? theme.todaySoft : scheduleState === 'scheduled' ? theme.scheduledSoft : theme.backgroundElement;

  return (
    <View style={[styles.row, { backgroundColor: highlightColor }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={onToggleComplete}
        style={[styles.checkbox, { borderColor: theme.primary }, completed && { backgroundColor: theme.primary }]}>
        {completed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
      </Pressable>

      <ThemedText style={styles.emoji}>{task.emoji ?? '📝'}</ThemedText>

      <View style={{ flex: 1 }}>
        <ThemedText
          type="default"
          style={completed && styles.strikethrough}
          themeColor={completed ? 'textSecondary' : 'text'}>
          {task.title}
        </ThemedText>
        {scheduleState === 'today' && (
          <ThemedText type="small" themeColor="today">
            ● Today
          </ThemedText>
        )}
        {scheduleState === 'scheduled' && (
          <ThemedText type="small" themeColor="scheduled">
            ● Scheduled for {instance?.scheduledDate}
          </ThemedText>
        )}
      </View>

      {!completed && (
        <Pressable onPress={onSchedule} style={[styles.scheduleButton, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="small" themeColor="primary">
            Schedule
          </ThemedText>
        </Pressable>
      )}
    </View>
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
  scheduleButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
  },
});
