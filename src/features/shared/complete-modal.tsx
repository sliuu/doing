import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDurationShort } from '@/lib/format';
import { DatePickerField } from '@/features/shared/date-picker-field';
import { DurationPicker } from '@/features/shared/duration-picker';
import type { Task, TaskInstance } from '@/db/types';

const QUICK_ADJUST_MINUTES = [15, 30, 60];

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
  const [loggedSeconds, setLoggedSeconds] = useState(instance?.currentDurationSeconds ?? 0);
  const [addMinutes, setAddMinutes] = useState('');
  const [dateKey, setDateKey] = useState(defaultDateKey);

  const parsedAddSeconds = () => {
    const parsed = Number(addMinutes);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 60) : 0;
  };

  // Folds elapsed/added time into the running total but never closes the dialog — the user may still want to "Mark done" afterward.
  const adjustSeconds = (deltaSeconds: number) => {
    if (deltaSeconds === 0) return;
    onAddTime?.(deltaSeconds);
    setLoggedSeconds((s) => Math.max(0, s + deltaSeconds));
  };

  const setLoggedTotal = (totalMinutes: number) => {
    adjustSeconds(Math.max(0, totalMinutes) * 60 - loggedSeconds);
  };

  const handleAddTime = () => {
    adjustSeconds(parsedAddSeconds());
    setAddMinutes('');
  };

  const handleConfirm = () => {
    onConfirm({
      durationSeconds: task.tracksDuration ? loggedSeconds + parsedAddSeconds() : undefined,
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
                <ThemedText style={styles.loggedTime}>
                  {formatDurationShort(loggedSeconds + parsedAddSeconds())}
                </ThemedText>

                <View style={styles.quickAdjustRow}>
                  {QUICK_ADJUST_MINUTES.map((m) => (
                    <Pressable
                      key={`sub-${m}`}
                      onPress={() => adjustSeconds(-m * 60)}
                      style={[styles.quickAdjustChip, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="small" style={{ color: theme.danger }}>
                        -{formatDurationShort(m * 60)}
                      </ThemedText>
                    </Pressable>
                  ))}
                  {QUICK_ADJUST_MINUTES.map((m) => (
                    <Pressable
                      key={`add-${m}`}
                      onPress={() => adjustSeconds(m * 60)}
                      style={[styles.quickAdjustChip, { backgroundColor: theme.primarySoft }]}>
                      <ThemedText type="small" themeColor="primary">
                        +{formatDurationShort(m * 60)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.setExactColumn}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Or set exactly
                  </ThemedText>
                  <DurationPicker totalMinutes={Math.round(loggedSeconds / 60)} onChange={setLoggedTotal} />
                </View>

                <View style={styles.customAddRow}>
                  <TextInput
                    value={addMinutes}
                    onChangeText={setAddMinutes}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    style={[styles.smallInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    min
                  </ThemedText>
                  {onAddTime && parsedAddSeconds() > 0 && (
                    <Pressable
                      onPress={handleAddTime}
                      style={[styles.addTimeButton, { backgroundColor: theme.primarySoft }]}>
                      <ThemedText type="small" themeColor="primary">
                        Add time
                      </ThemedText>
                    </Pressable>
                  )}
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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
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
  quickAdjustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  quickAdjustChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  setExactColumn: {
    width: '100%',
    gap: Spacing.one,
  },
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  smallInput: {
    width: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  addTimeButton: {
    marginLeft: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.two,
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
