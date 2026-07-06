import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DeleteChoiceModal } from '@/features/shared/delete-choice-modal';
import { SelfCareFormModal } from '@/features/self-care/self-care-form-modal';
import { SelfCareRow } from '@/features/self-care/self-care-row';
import { SELF_CARE_SECTIONS, SelfCareItem, SelfCareSection, sectionForItem } from '@/features/self-care/types';
import { useSelfCare } from '@/features/self-care/use-self-care';

export default function SelfCareScreen() {
  const theme = useTheme();
  const { loading, items, addTask, toggleComplete, editTask, removeTask, removeTaskOccurrence } = useSelfCare();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newSection, setNewSection] = useState<SelfCareSection | null>(null);
  const [deleteChoiceInstanceId, setDeleteChoiceInstanceId] = useState<string | null>(null);

  const editingItem = items.find((i) => i.task.id === editingTaskId) ?? null;
  const deleteChoiceItem = items.find((i) => i.instance.id === deleteChoiceInstanceId) ?? null;

  const requestDelete = (item: SelfCareItem) => {
    if (item.task.recurring) {
      setDeleteChoiceInstanceId(item.instance.id);
    } else {
      removeTask(item.task.id);
    }
  };

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
          <ThemedText type="display" style={styles.headerTitle}>
            Self-Care
          </ThemedText>

          {SELF_CARE_SECTIONS.map(({ key, label }) => {
            const sectionItems = items.filter((item) => sectionForItem(item) === key);
            return (
              <View key={key} style={{ gap: Spacing.two }}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="label">{label}</ThemedText>
                  <Pressable
                    onPress={() => setNewSection(key)}
                    style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
                    <ThemedText themeColor="primary">+</ThemedText>
                  </Pressable>
                </View>

                {sectionItems.map((item) => (
                  <SelfCareRow
                    key={item.task.id}
                    item={item}
                    onToggleComplete={() => toggleComplete(item)}
                    onEdit={() => setEditingTaskId(item.task.id)}
                    onDelete={() => requestDelete(item)}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {editingItem && (
        <SelfCareFormModal
          task={editingItem.task}
          onCancel={() => setEditingTaskId(null)}
          onSubmit={(patch) => {
            editTask(editingItem.task.id, patch);
            setEditingTaskId(null);
          }}
          onDelete={() => {
            setEditingTaskId(null);
            requestDelete(editingItem);
          }}
        />
      )}

      {newSection && (
        <SelfCareFormModal
          defaultSection={newSection}
          onCancel={() => setNewSection(null)}
          onSubmit={(input) => {
            addTask(input);
            setNewSection(null);
          }}
        />
      )}

      {deleteChoiceItem && (
        <DeleteChoiceModal
          title={deleteChoiceItem.task.title}
          onCancel={() => setDeleteChoiceInstanceId(null)}
          onDeleteToday={() => {
            removeTaskOccurrence(deleteChoiceItem.instance.id, deleteChoiceItem.task.id, deleteChoiceItem.instance.date);
            setDeleteChoiceInstanceId(null);
          }}
          onDeleteAll={() => {
            removeTask(deleteChoiceItem.task.id);
            setDeleteChoiceInstanceId(null);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    textAlign: 'center',
  },
  sectionHeader: {
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
