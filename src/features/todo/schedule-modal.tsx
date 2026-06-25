import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DatePickerField } from '@/features/shared/date-picker-field';

import { TodoItem } from '@/features/todo/types';

export function ScheduleModal({
  item,
  todayKey,
  onCancel,
  onSchedule,
}: {
  item: TodoItem;
  todayKey: string;
  onCancel: () => void;
  onSchedule: (dateKey: string | null) => void;
}) {
  const theme = useTheme();
  const [customDate, setCustomDate] = useState(item.instance?.scheduledDate ?? todayKey);

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ThemedText type="subtitle">{item.task.title}</ThemedText>

          <Pressable
            onPress={() => onSchedule(todayKey)}
            style={[styles.optionButton, { backgroundColor: theme.todaySoft }]}>
            <ThemedText themeColor="today">Add to Today</ThemedText>
          </Pressable>

          <View style={styles.field}>
            <ThemedText themeColor="textSecondary">Or pick a date</ThemedText>
            <DatePickerField value={customDate} onChange={setCustomDate} />
            <Pressable
              onPress={() => customDate.trim() !== '' && onSchedule(customDate.trim())}
              style={[styles.optionButton, { backgroundColor: theme.scheduledSoft }]}>
              <ThemedText themeColor="scheduled">Set date</ThemedText>
            </Pressable>
          </View>

          <View style={styles.actions}>
            {item.instance?.scheduledDate && (
              <Pressable onPress={() => onSchedule(null)} style={styles.actionButton}>
                <ThemedText themeColor="textSecondary">Clear schedule</ThemedText>
              </Pressable>
            )}
            <Pressable onPress={onCancel} style={styles.actionButton}>
              <ThemedText themeColor="textSecondary">Cancel</ThemedText>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  field: {
    gap: Spacing.one,
  },
  optionButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
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
