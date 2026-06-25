import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatDurationShort, formatTimer } from '@/lib/format';

import { DailyItem, DayMode, effectiveExpectedMinutes } from '@/features/daily/types';

export function TaskRow({
  item,
  now,
  dayMode,
  onToggleComplete,
  onStartTimer,
  onPress,
}: {
  item: DailyItem;
  now: number;
  dayMode: DayMode;
  onToggleComplete: () => void;
  onStartTimer: () => void;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const isRunning = instance.timerState === 'running';
  // `now` forces a re-render every second so the live duration ticks while running.
  void now;
  const liveSeconds = getLiveDurationSeconds(instance);
  const expectedMinutes = effectiveExpectedMinutes(task.expectedDuration, dayMode);
  const expectedSeconds = expectedMinutes ? expectedMinutes * 60 : null;
  const hasLogged = liveSeconds > 0 || isRunning;
  // Second-level precision while running so the number visibly counts up; coarser once stopped.
  const liveLabel = isRunning ? formatTimer(liveSeconds) : formatDurationShort(liveSeconds);
  const durationLabel =
    expectedSeconds !== null
      ? hasLogged
        ? `${liveLabel}/${formatDurationShort(expectedSeconds)}`
        : formatDurationShort(expectedSeconds)
      : liveLabel;

  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: instance.completed }}
        onPress={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        style={[
          styles.checkbox,
          { borderColor: theme.primary },
          instance.completed && { backgroundColor: theme.primary },
        ]}>
        {instance.completed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
      </Pressable>

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
        <View style={styles.durationRow}>
          <ThemedText type="small" themeColor={isRunning ? 'today' : 'textSecondary'}>
            {isRunning ? '● ' : ''}
            {durationLabel}
          </ThemedText>
          {!instance.completed && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onStartTimer();
              }}
              style={[styles.startButton, { backgroundColor: isRunning ? theme.todaySoft : theme.primarySoft }]}>
              <ThemedText type="small" themeColor={isRunning ? 'today' : 'primary'}>
                {isRunning ? 'Running' : instance.timerState === 'paused' ? 'Resume' : 'Start'}
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  startButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
  },
});
