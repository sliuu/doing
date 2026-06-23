import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Task, TaskInstance } from '@/db/types';

export interface CompleteOpts {
  durationSeconds?: number;
  notes: string | null;
  completedDateKey?: string;
}

export function CompleteModal({
  task,
  instance,
  defaultDateKey,
  allowDateSelection = false,
  onCancel,
  onConfirm,
}: {
  task: Task;
  instance: TaskInstance | null;
  defaultDateKey: string;
  allowDateSelection?: boolean;
  onCancel: () => void;
  onConfirm: (opts: CompleteOpts) => void;
}) {
  const theme = useTheme();
  const [minutes, setMinutes] = useState(
    String(Math.round((instance?.currentDurationSeconds ?? 0) / 60))
  );
  const [notes, setNotes] = useState(instance?.notes ?? '');
  const [dateKey, setDateKey] = useState(defaultDateKey);

  const handleConfirm = () => {
    const parsedMinutes = Number(minutes);
    onConfirm({
      durationSeconds: task.tracksDuration && !Number.isNaN(parsedMinutes) ? parsedMinutes * 60 : undefined,
      notes: notes.trim() === '' ? null : notes.trim(),
      completedDateKey: allowDateSelection ? dateKey : undefined,
    });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ThemedText type="subtitle">
            {task.emoji ?? '📝'} {task.title}
          </ThemedText>

          {allowDateSelection && (
            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Completed on (YYYY-MM-DD)</ThemedText>
              <TextInput
                value={dateKey}
                onChangeText={setDateKey}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
          )}

          {task.tracksDuration && (
            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Minutes spent</ThemedText>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
          )}

          <View style={styles.field}>
            <ThemedText themeColor="textSecondary">Notes (optional)</ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[styles.input, styles.notesInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.actionButton}>
              <ThemedText themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[styles.actionButton, { backgroundColor: theme.primary, borderRadius: Spacing.two }]}>
              <ThemedText style={{ color: '#fff' }}>Mark done</ThemedText>
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
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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
