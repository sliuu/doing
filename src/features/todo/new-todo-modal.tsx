import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';
import type { TaskSize } from '@/db/types';
import { createId } from '@/lib/id';

import { SIZE_SECTIONS } from '@/features/todo/types';

export function NewTodoModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState<TaskSize>('medium');
  const [tracksDuration, setTracksDuration] = useState(false);
  const [expectedDuration, setExpectedDuration] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const addSubtask = () => {
    if (subtaskDraft.trim() === '') return;
    setSubtasks((prev) => [...prev, { id: createId(), title: subtaskDraft.trim() }]);
    setSubtaskDraft('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const canSubmit = title.trim() !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      emoji: emoji.trim() === '' ? null : emoji.trim(),
      category: category.trim() === '' ? 'uncategorized' : category.trim(),
      size,
      recurring: false,
      recurrenceRule: null,
      tracksDuration,
      expectedDuration: tracksDuration && expectedDuration !== '' ? Number(expectedDuration) : null,
      subtasks,
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">New to-do</ThemedText>

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
