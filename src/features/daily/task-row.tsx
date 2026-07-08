import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PauseIcon, PlayIcon } from '@/components/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { withAlpha } from '@/lib/color';
import { formatDurationShort, formatTimer } from '@/lib/format';

import { DailyItem, DayMode, effectiveExpectedMinutes } from '@/features/daily/types';

export function TaskRow({
  item,
  now,
  dayMode,
  onToggleComplete,
  onToggleRunning,
  onOpenTimer,
  onPress,
}: {
  item: DailyItem;
  now: number;
  dayMode: DayMode;
  /** Receives the screen position of the tap, so completion effects can burst from it. */
  onToggleComplete: (pos: { x: number; y: number }) => void;
  onToggleRunning: () => void;
  onOpenTimer: () => void;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { task, instance, categoryColor } = item;
  const isRunning = instance.timerState === 'running';
  const liveSeconds = getLiveDurationSeconds(instance, now);
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          // The whole row is tinted with a translucent wash of the category color.
          backgroundColor: withAlpha(categoryColor ?? theme.stone, 0.16),
          // A running timer outlines the row; transparent otherwise so layout never shifts.
          borderColor: isRunning ? theme.today : 'transparent',
        },
        instance.completed && styles.completedRow,
        pressed && styles.pressed,
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: instance.completed }}
        onPress={(e) => {
          e.stopPropagation();
          onToggleComplete({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
        }}
        style={[
          styles.checkbox,
          { borderColor: theme.primary },
          instance.completed && { backgroundColor: theme.primary },
        ]}>
        {instance.completed && <ThemedText style={{ color: theme.onPrimary }}>✓</ThemedText>}
      </Pressable>

      <View style={{ flex: 1 }}>
        <ThemedText
          type="default"
          style={instance.completed && styles.strikethrough}
          themeColor={instance.completed ? 'textSecondary' : 'text'}>
          {task.title}
        </ThemedText>
      </View>

      {task.tracksDuration && (
        <View style={styles.durationRow}>
          {/* Tapping the time opens the full timer view; the icon button toggles running. */}
          <Pressable
            hitSlop={Spacing.two}
            onPress={(e) => {
              e.stopPropagation();
              onOpenTimer();
            }}>
            <ThemedText type="small" themeColor={isRunning ? 'today' : 'textSecondary'}>
              {durationLabel}
            </ThemedText>
          </Pressable>
          {!instance.completed && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRunning ? 'Pause timer' : 'Start timer'}
              hitSlop={Spacing.one}
              onPress={(e) => {
                e.stopPropagation();
                onToggleRunning();
              }}
              style={[styles.playButton, { backgroundColor: isRunning ? theme.todaySoft : theme.stoneSoft }]}>
              {isRunning ? (
                <PauseIcon size={13} color={theme.today} />
              ) : (
                <PlayIcon size={13} color={theme.stone} />
              )}
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
