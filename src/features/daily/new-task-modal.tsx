import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';
import type { TimeOfDay } from '@/db/types';
import { CategoryPicker } from '@/features/shared/category-picker';
import { DurationPicker } from '@/features/shared/duration-picker';
import { useCategories } from '@/features/shared/use-categories';
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
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [freq, setFreq] = useState<RecurrenceFreq>('once');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('1');
  const [tracksDuration, setTracksDuration] = useState(false);
  const [expectedDuration, setExpectedDuration] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(defaultTimeOfDay);
  const [hideOnNoWorkDays, setHideOnNoWorkDays] = useState(false);
  const [hideOnLowEnergyDays, setHideOnLowEnergyDays] = useState(false);

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

    onSubmit(
      {
        title: title.trim(),
        category,
        recurring: freq !== 'once',
        recurrenceRule,
        tracksDuration,
        expectedDuration: tracksDuration && expectedDuration !== '' ? Number(expectedDuration) : null,
        hideOnNoWorkDays: freq !== 'once' ? hideOnNoWorkDays : false,
        hideOnLowEnergyDays: freq !== 'once' ? hideOnLowEnergyDays : false,
      },
      timeOfDay
    );
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background, maxHeight: windowHeight * 0.85, paddingBottom: insets.bottom + Spacing.four }]} type="background">
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

            <View style={styles.field}>
              <ThemedText themeColor="textSecondary">Category</ThemedText>
              <CategoryPicker value={category} categories={categories} onChange={setCategory} />
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
                <ThemedText themeColor="textSecondary">Expected duration (optional)</ThemedText>
                <DurationPicker
                  totalMinutes={Number(expectedDuration) || 0}
                  onChange={(m) => setExpectedDuration(m > 0 ? String(m) : '')}
                />
              </View>
            )}

            {freq !== 'once' && (
              <>
                <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between' }]}>
                  <ThemedText themeColor="textSecondary">Hide on no-work days</ThemedText>
                  <Switch value={hideOnNoWorkDays} onValueChange={setHideOnNoWorkDays} />
                </View>

                <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between' }]}>
                  <ThemedText themeColor="textSecondary">Hide on low-energy days</ThemedText>
                  <Switch value={hideOnLowEnergyDays} onValueChange={setHideOnLowEnergyDays} />
                </View>
              </>
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
      </KeyboardAvoidingView>
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
