import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

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
  /** Receives the screen position of the tap, so completion effects can burst from it. */
  onToggleComplete: (pos: { x: number; y: number }) => void;
  onSchedule: () => void;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const { task, instance, categoryColor } = item;
  const completed = instance?.completed ?? false;
  const scheduleState = scheduleStateFor(item, todayKey);

  // Only scheduled items get an outline; transparent otherwise so layout never shifts.
  const borderColor =
    !completed && scheduleState === 'today'
      ? theme.today
      : !completed && scheduleState === 'scheduled'
        ? theme.scheduled
        : 'transparent';

  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor,
          // The whole row is tinted with a translucent wash of the category color.
          backgroundColor: withAlpha(categoryColor ?? theme.stone, 0.16),
        },
        completed && styles.completedRow,
        pressed && styles.pressed,
      ]}>
      <View style={{ flex: 1 }}>
        <ThemedText
          type="default"
          style={completed && styles.strikethrough}
          themeColor={completed ? 'textSecondary' : 'text'}>
          {task.title}
        </ThemedText>
        {!completed && scheduleState === 'today' && (
          <ThemedText type="small" themeColor="today">
            ● Today
          </ThemedText>
        )}
        {!completed && scheduleState === 'scheduled' && (
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
          style={[styles.scheduleButton, { backgroundColor: theme.stoneSoft }]}>
          <ThemedText type="small" themeColor="stone">
            Schedule
          </ThemedText>
        </Pressable>
      )}

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
  scheduleButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
  },
});
