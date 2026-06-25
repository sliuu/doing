import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DailyItem } from '@/features/daily/types';

export function TaskActionsModal({
  item,
  onEdit,
  onStartTimer,
  onDelete,
  onClose,
}: {
  item: DailyItem;
  onEdit: () => void;
  onStartTimer: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const canStartTimer = task.tracksDuration && !instance.completed;
  const isResuming = instance.timerState === 'running' || instance.timerState === 'paused';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrapper}>
          <ThemedView style={[styles.sheet, { backgroundColor: theme.background }]} type="background">
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.two }}>
              {task.title}
            </ThemedText>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

            <Pressable onPress={onEdit} style={styles.option}>
              <ThemedText>Edit task</ThemedText>
            </Pressable>

            {canStartTimer && (
              <Pressable onPress={onStartTimer} style={styles.option}>
                <ThemedText>{isResuming ? 'Resume timer' : 'Start timer'}</ThemedText>
              </Pressable>
            )}

            <Pressable onPress={onDelete} style={styles.option}>
              <ThemedText style={{ color: theme.danger }}>Delete task</ThemedText>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

            <Pressable onPress={onClose} style={styles.option}>
              <ThemedText themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
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
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.three,
  },
});
