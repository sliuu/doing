import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatTimer } from '@/lib/format';

import { DailyItem } from '@/features/daily/types';

const ADJUST_STEPS_SECONDS = [-60, 60, 600];

export function TimerModal({
  item,
  now,
  onToggleRunning,
  onAdjust,
  onToggleSubtask,
  onComplete,
  onClose,
}: {
  item: DailyItem;
  now: number;
  onToggleRunning: () => void;
  onAdjust: (deltaSeconds: number) => void;
  onToggleSubtask: (subtaskId: string, done: boolean) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  // `now` forces a re-render every second so the displayed time ticks while running.
  void now;
  const liveSeconds = getLiveDurationSeconds(instance);
  const expectedSeconds = task.expectedDuration ? task.expectedDuration * 60 : null;
  const reachedExpected = expectedSeconds !== null && liveSeconds >= expectedSeconds;
  const isRunning = instance.timerState === 'running';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ThemedText type="subtitle">
            {task.emoji ?? '📝'} {task.title}
          </ThemedText>

          <ThemedText style={styles.clock} themeColor={reachedExpected ? 'today' : 'text'}>
            {formatTimer(liveSeconds)}
          </ThemedText>
          {reachedExpected && (
            <ThemedText themeColor="today" style={{ textAlign: 'center' }}>
              🔔 expected time reached — keep going if you like
            </ThemedText>
          )}

          <Pressable
            onPress={onToggleRunning}
            style={[styles.primaryButton, { backgroundColor: isRunning ? theme.backgroundSelected : theme.primary }]}>
            <ThemedText style={{ color: isRunning ? theme.text : '#fff' }}>
              {isRunning ? 'Pause' : 'Start'}
            </ThemedText>
          </Pressable>

          <View style={styles.adjustRow}>
            {ADJUST_STEPS_SECONDS.map((delta) => (
              <Pressable
                key={delta}
                onPress={() => onAdjust(delta)}
                style={[styles.adjustButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">
                  {delta > 0 ? '+' : ''}
                  {delta / 60}m
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {task.subtasks.length > 0 && (
            <View style={styles.subtasks}>
              {instance.subtaskStates.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => onToggleSubtask(s.id, !s.done)}
                  style={styles.subtaskRow}>
                  <View style={[styles.subtaskCheckbox, { borderColor: theme.primary }, s.done && { backgroundColor: theme.primary }]}>
                    {s.done && <ThemedText style={{ color: '#fff', fontSize: 12 }}>✓</ThemedText>}
                  </View>
                  <ThemedText themeColor={s.done ? 'textSecondary' : 'text'} style={s.done && { textDecorationLine: 'line-through' }}>
                    {s.title}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.actionButton}>
              <ThemedText themeColor="textSecondary">Minimize</ThemedText>
            </Pressable>
            <Pressable
              onPress={onComplete}
              style={[styles.actionButton, { backgroundColor: theme.primary, borderRadius: Spacing.two }]}>
              <ThemedText style={{ color: '#fff' }}>Done</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  clock: {
    fontSize: 48,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  adjustButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  subtasks: {
    gap: Spacing.two,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
