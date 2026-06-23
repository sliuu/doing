import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatDurationShort } from '@/lib/format';

import { DailyItem } from '@/features/daily/types';

export function TaskRow({
  item,
  now,
  onToggleComplete,
  onStartTimer,
}: {
  item: DailyItem;
  now: number;
  onToggleComplete: () => void;
  onStartTimer: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const isRunning = instance.timerState === 'running';
  // `now` forces a re-render every second so the live duration ticks while running.
  void now;
  const liveSeconds = getLiveDurationSeconds(instance);

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: instance.completed }}
        onPress={onToggleComplete}
        style={[
          styles.checkbox,
          { borderColor: theme.primary },
          instance.completed && { backgroundColor: theme.primary },
        ]}>
        {instance.completed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
      </Pressable>

      <ThemedText style={styles.emoji}>{task.emoji ?? '📝'}</ThemedText>

      <View style={{ flex: 1 }}>
        <ThemedText
          type="default"
          style={instance.completed && styles.strikethrough}
          themeColor={instance.completed ? 'textSecondary' : 'text'}>
          {task.title}
        </ThemedText>
        {task.subtasks.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {instance.subtaskStates.filter((s) => s.done).length}/{task.subtasks.length} subtasks
          </ThemedText>
        )}
      </View>

      {task.tracksDuration && (
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {(liveSeconds > 0 || isRunning) && (
            <ThemedText type="small" themeColor={isRunning ? 'today' : 'textSecondary'}>
              {isRunning ? '● ' : ''}
              {formatDurationShort(liveSeconds)}
            </ThemedText>
          )}
          {!instance.completed && (
            <Pressable onPress={onStartTimer} style={[styles.startButton, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="small" themeColor="primary">
                {isRunning || instance.timerState === 'paused' ? 'Resume' : 'Start'}
              </ThemedText>
            </Pressable>
          )}
        </View>
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
  startButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
  },
});
