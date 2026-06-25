import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shown when deleting a recurring task, to disambiguate "just today" from the whole series. */
export function DeleteChoiceModal({
  title,
  onCancel,
  onDeleteToday,
  onDeleteAll,
}: {
  title: string;
  onCancel: () => void;
  onDeleteToday: () => void;
  onDeleteAll: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrapper}>
          <ThemedView style={[styles.sheet, { backgroundColor: theme.background }]} type="background">
            <ThemedText type="subtitle">{title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.one, marginBottom: Spacing.two }}>
              This task repeats. What would you like to delete?
            </ThemedText>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

            <Pressable onPress={onDeleteToday} style={styles.option}>
              <ThemedText style={{ color: theme.danger }}>Just today</ThemedText>
            </Pressable>

            <Pressable onPress={onDeleteAll} style={styles.option}>
              <ThemedText style={{ color: theme.danger }}>All recurring days</ThemedText>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

            <Pressable onPress={onCancel} style={styles.option}>
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
