import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';

import { SELF_CARE_SECTIONS, SelfCareSection } from '@/features/self-care/types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type RecurrenceFreq = 'once' | 'daily' | 'weekly' | 'monthly';
const FREQ_OPTIONS: { key: RecurrenceFreq; label: string }[] = [
  { key: 'once', label: 'Just today' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function NewSelfCareModal({
  defaultSection = 'fun',
  onCancel,
  onSubmit,
}: {
  defaultSection?: SelfCareSection;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [section, setSection] = useState<SelfCareSection>(defaultSection);
  const [freq, setFreq] = useState<RecurrenceFreq>('once');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('1');

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
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

    onSubmit({
      title: title.trim(),
      category: 'self-care',
      selfCareSection: section,
      recurring: freq !== 'once',
      recurrenceRule,
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">New self-care</ThemedText>

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Title</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="A small kind thing to do"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Section</ThemedText>
              <View style={styles.chipRow}>
                {SELF_CARE_SECTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSection(opt.key)}
                    style={[
                      styles.chip,
                      { borderColor: theme.backgroundSelected },
                      section === opt.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                    <ThemedText style={section === opt.key ? { color: '#fff' } : undefined} type="small">
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Repeats</ThemedText>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  cardWrapper: {
    width: '100%',
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
