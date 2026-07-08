import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatDurationShort } from '@/lib/format';
import { DatePickerField } from '@/features/shared/date-picker-field';
import { DurationPicker } from '@/features/shared/duration-picker';
import type { Task, TaskInstance } from '@/db/types';

export interface CompleteOpts {
  durationSeconds?: number;
  completedDateKey?: string;
}

export function CompleteModal({
  task,
  instance,
  defaultDateKey,
  allowDateSelection = false,
  onCancel,
  onConfirm,
  onAddTime,
}: {
  task: Task;
  instance: TaskInstance | null;
  defaultDateKey: string;
  allowDateSelection?: boolean;
  onCancel: () => void;
  onConfirm: (opts: CompleteOpts) => void;
  onAddTime?: (deltaSeconds: number) => void;
}) {
  const theme = useTheme();
  // Seed from the LIVE duration (frozen at open): if the timer is still running, the elapsed
  // time isn't folded into currentDurationSeconds until the instance is paused/completed.
  const [loggedSeconds, setLoggedSeconds] = useState(() =>
    instance ? getLiveDurationSeconds(instance, Date.now()) : 0
  );
  const [dateKey, setDateKey] = useState(defaultDateKey);

  // Writes the new total through but never closes the dialog — the user may still want to "Mark done" afterward.
  const setLoggedTotal = (totalMinutes: number) => {
    const deltaSeconds = Math.max(0, totalMinutes) * 60 - loggedSeconds;
    if (deltaSeconds === 0) return;
    onAddTime?.(deltaSeconds);
    setLoggedSeconds((s) => Math.max(0, s + deltaSeconds));
  };

  const handleConfirm = () => {
    onConfirm({
      durationSeconds: task.tracksDuration ? loggedSeconds : undefined,
      completedDateKey: allowDateSelection ? dateKey : undefined,
    });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
            <ThemedText type="title" style={styles.title}>
              {task.title}
            </ThemedText>

            {allowDateSelection && (
              <View style={styles.field}>
                <ThemedText themeColor="textSecondary">Completed on</ThemedText>
                <DatePickerField value={dateKey} onChange={setDateKey} />
              </View>
            )}

            {task.tracksDuration && (
              <View style={[styles.durationCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Logged so far
                </ThemedText>
                <ThemedText style={styles.loggedTime}>{formatDurationShort(loggedSeconds)}</ThemedText>

                <View style={styles.setExactColumn}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Log custom time
                  </ThemedText>
                  <DurationPicker totalMinutes={Math.round(loggedSeconds / 60)} onChange={setLoggedTotal} />
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.actionButton}>
                <ThemedText themeColor="textSecondary">Close</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[styles.actionButton, { backgroundColor: theme.primary, borderRadius: Spacing.two }]}>
                <ThemedText style={{ color: theme.onPrimary }}>Mark done</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '400',
    textAlign: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  durationCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  loggedTime: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
  },
  setExactColumn: {
    width: '100%',
    gap: Spacing.one,
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
