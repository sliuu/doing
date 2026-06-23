import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { EditEasyWinModal } from '@/features/easy-wins/edit-easy-win-modal';
import { EasyWinRow } from '@/features/easy-wins/easy-win-row';
import { NewEasyWinModal } from '@/features/easy-wins/new-easy-win-modal';
import { EasyWinItem } from '@/features/easy-wins/types';
import { useEasyWins } from '@/features/easy-wins/use-easy-wins';

export default function EasyWinsScreen() {
  const theme = useTheme();
  const { loading, seeded, custom, addTask, toggleComplete, editTask, removeTask } = useEasyWins();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const allItems: EasyWinItem[] = [...seeded, ...custom];
  const editingItem = allItems.find((i) => i.task.id === editingTaskId) ?? null;

  if (loading) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
          <View style={styles.header}>
            <ThemedText type="title">Easy Wins</ThemedText>
            <Pressable
              onPress={() => setShowNew(true)}
              style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
              <ThemedText themeColor="primary">+ Add</ThemedText>
            </Pressable>
          </View>

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">All</ThemedText>
            {seeded.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing for today.</ThemedText>
            ) : (
              seeded.map((item) => (
                <EasyWinRow
                  key={item.task.id}
                  item={item}
                  onToggleComplete={() => toggleComplete(item)}
                  onEdit={() => setEditingTaskId(item.task.id)}
                />
              ))
            )}
          </View>

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">Custom</ThemedText>
            {custom.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing here yet.</ThemedText>
            ) : (
              custom.map((item) => (
                <EasyWinRow
                  key={item.task.id}
                  item={item}
                  onToggleComplete={() => toggleComplete(item)}
                  onEdit={() => setEditingTaskId(item.task.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {editingItem && (
        <EditEasyWinModal
          task={editingItem.task}
          onCancel={() => setEditingTaskId(null)}
          onSave={(patch) => {
            editTask(editingItem.task.id, patch);
            setEditingTaskId(null);
          }}
          onDelete={() => {
            removeTask(editingItem.task.id);
            setEditingTaskId(null);
          }}
        />
      )}

      {showNew && (
        <NewEasyWinModal
          onCancel={() => setShowNew(false)}
          onSubmit={(input) => {
            addTask(input);
            setShowNew(false);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
