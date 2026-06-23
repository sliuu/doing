import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';
import type { TimeOfDay } from '@/db/types';
import { createId } from '@/lib/id';

import { TIME_OF_DAY_SECTIONS } from '@/features/daily/types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type RecurrenceFreq = 'once' | 'daily' | 'weekly' | 'monthly';
const FREQ_OPTIONS: { key: RecurrenceFreq; label: string }[] = [
  { key: 'once', label: 'One-time' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function NewTaskModal({
  defaultTimeOfDay,
  onCancel,
  onSubmit,
}: {
  defaultTimeOfDay: TimeOfDay;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput, timeOfDay: TimeOfDay) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [freq, setFreq] = useState<RecurrenceFreq>('once');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('1');
  const [tracksDuration, setTracksDuration] = useState(false);
  const [expectedDuration, setExpectedDuration] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(defaultTimeOfDay);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const addSubtask = () => {
    if (subtaskDraft.trim() === '') return;
    setSubtasks((prev) => [...prev, { id: createId(), title: subtaskDraft.trim() }]);
    setSubtaskDraft('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const canSubmit = title.trim() !== '' && (freq !== 'weekly' || weekDays.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const recurrenceRule =
      freq === 'daily'
        ? { freq: 'daily' as const }
        : freq === 'weekly'
          ? { freq: 'weekly' as const, daysOfWeek: weekDays }
          : freq === 'monthly'
            ? { freq: 'monthly' as const, dayOfMonth: Number(monthDay) || 1 }
            : null;

    onSubmit(
      {
        title: title.trim(),
        emoji: emoji.trim() === '' ? null : emoji.trim(),
        category: category.trim() === '' ? 'uncategorized' : category.trim(),
        recurring: freq !== 'once',
        recurrenceRule,
        tracksDuration,
        expectedDuration: tracksDuration && expectedDuration !== '' ? Number(expectedDuration) : null,
        subtasks,
      },
      timeOfDay
    );
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">New task</ThemedText>

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Title</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What do you need to do?"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText themeColor="textSecondary">Emoji</ThemedText>
                <TextInput
                  value={emoji}
                  onChangeText={setEmoji}
                  placeholder="📝"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
              <View style={[styles.field, { flex: 2 }]}>
                <ThemedText themeColor="textSecondary">Category</ThemedText>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="work, health, hobbies…"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Recurrence</ThemedText>
              <View style={styles.chipRow}>
                {FREQ_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setFreq(opt.key)}
                    style={[
                      styles.chip,
                      { borderColor: theme.backgroundSelected },
                      freq === opt.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                    <ThemedText style={freq === opt.key ? { color: '#fff' } : undefined} type="small">
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {freq === 'weekly' && (
              <View style={styles.chipRow}>
                {WEEKDAY_LABELS.map((label, day) => (
                  <Pressable
                    key={day}
                    onPress={() => toggleWeekDay(day)}
                    style={[
                      styles.chip,
                      { borderColor: theme.backgroundSelected },
                      weekDays.includes(day) && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                    <ThemedText style={weekDays.includes(day) ? { color: '#fff' } : undefined} type="small">
                      {label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {freq === 'monthly' && (
              <View style={styles.field}>
                <ThemedText themeColor="textSecondary">Day of month</ThemedText>
                <TextInput
                  value={monthDay}
                  onChangeText={setMonthDay}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
            )}

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Section</ThemedText>
              <View style={styles.chipRow}>
                {TIME_OF_DAY_SECTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setTimeOfDay(opt.key)}
                    style={[
                      styles.chip,
                      { borderColor: theme.backgroundSelected },
                      timeOfDay === opt.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                    <ThemedText style={timeOfDay === opt.key ? { color: '#fff' } : undefined} type="small">
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between' }]}>
              <ThemedText themeColor="textSecondary">Track duration / timer</ThemedText>
              <Switch value={tracksDuration} onValueChange={setTracksDuration} />
            </View>

            {tracksDuration && (
              <View style={styles.field}>
                <ThemedText themeColor="textSecondary">Expected duration (minutes, optional)</ThemedText>
                <TextInput
                  value={expectedDuration}
                  onChangeText={setExpectedDuration}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
            )}

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Subtasks</ThemedText>
              {subtasks.map((s) => (
                <View key={s.id} style={styles.subtaskDraftRow}>
                  <ThemedText style={{ flex: 1 }}>{s.title}</ThemedText>
                  <Pressable onPress={() => removeSubtask(s.id)}>
                    <ThemedText themeColor="textSecondary">Remove</ThemedText>
                  </Pressable>
                </View>
              ))}
              <View style={styles.row}>
                <TextInput
                  value={subtaskDraft}
                  onChangeText={setSubtaskDraft}
                  placeholder="Add a subtask"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.backgroundSelected }]}
                  onSubmitEditing={addSubtask}
                />
                <Pressable onPress={addSubtask} style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">Add</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.actionButton}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[
                  styles.actionButton,
                  { backgroundColor: canSubmit ? theme.primary : theme.backgroundSelected, borderRadius: Spacing.two },
                ]}>
                <ThemedText style={{ color: canSubmit ? '#fff' : theme.textSecondary }}>Create</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  field: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  subtaskDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
