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
  onEdit,
}: {
  item: TodoItem;
  todayKey: string;
  onToggleComplete: () => void;
  onSchedule: () => void;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const completed = instance?.completed ?? false;
  const scheduleState = scheduleStateFor(item, todayKey);

  const borderColor =
    scheduleState === 'today' ? theme.today : scheduleState === 'scheduled' ? theme.scheduled : theme.backgroundSelected;

  return (
    <Pressable onPress={onEdit} style={[styles.row, { borderColor }]}>
      <ThemedText themeColor="textSecondary" style={styles.handle}>
        ⋮
      </ThemedText>

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
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
          style={[styles.scheduleButton, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="small" themeColor="primary">
            Schedule
          </ThemedText>
        </Pressable>
      )}

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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  handle: {
    fontSize: 16,
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
  scheduleButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
  },
});
