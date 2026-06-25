import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';
import type { Task, TaskSize } from '@/db/types';
import { createId } from '@/lib/id';

import { CategoryPicker } from '@/features/shared/category-picker';
import { useCategories } from '@/features/shared/use-categories';
import { SIZE_SECTIONS } from '@/features/todo/types';

export function EditTodoModal({
  task,
  onCancel,
  onSave,
  onDelete,
}: {
  task: Task;
  onCancel: () => void;
  onSave: (patch: Partial<NewTaskInput>) => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const categories = useCategories();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category);
  const [size, setSize] = useState<TaskSize>(task.size ?? 'medium');
  const [tracksDuration, setTracksDuration] = useState(task.tracksDuration);
  const [expectedDuration, setExpectedDuration] = useState(
    task.expectedDuration != null ? String(task.expectedDuration) : ''
  );
  const [subtasks, setSubtasks] = useState(task.subtasks);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const addSubtask = () => {
    if (subtaskDraft.trim() === '') return;
    setSubtasks((prev) => [...prev, { id: createId(), title: subtaskDraft.trim() }]);
    setSubtaskDraft('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const canSave = title.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      category,
      size,
      tracksDuration,
      expectedDuration: tracksDuration && expectedDuration !== '' ? Number(expectedDuration) : null,
      subtasks,
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">Edit to-do</ThemedText>

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
              <ThemedText themeColor="textSecondary">Size</ThemedText>
              <View style={styles.chipRow}>
                {SIZE_SECTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSize(opt.key)}
                    style={[
                      styles.chip,
                      { borderColor: theme.backgroundSelected },
                      size === opt.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}>
                    <ThemedText style={size === opt.key ? { color: '#fff' } : undefined} type="small">
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
              <Pressable onPress={onDelete} style={styles.actionButton}>
                <ThemedText style={{ color: theme.danger }}>Delete</ThemedText>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={onCancel} style={styles.actionButton}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={[
                  styles.actionButton,
                  { backgroundColor: canSave ? theme.primary : theme.backgroundSelected, borderRadius: Spacing.two },
                ]}>
                <ThemedText style={{ color: canSave ? '#fff' : theme.textSecondary }}>Save</ThemedText>
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
  subtaskDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
