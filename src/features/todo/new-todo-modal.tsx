import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NewTaskInput } from '@/db/tasks';
import type { TaskSize } from '@/db/types';
import { CategoryPicker } from '@/features/shared/category-picker';
import { useCategories } from '@/features/shared/use-categories';
import { SIZE_SECTIONS } from '@/features/todo/types';

export function NewTodoModal({
  defaultSize,
  onCancel,
  onSubmit,
}: {
  defaultSize: TaskSize;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
}) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [size, setSize] = useState<TaskSize>(defaultSize);
  const [tracksDuration, setTracksDuration] = useState(false);
  const [expectedDuration, setExpectedDuration] = useState('');
  const canSubmit = title.trim() !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      category,
      size,
      recurring: false,
      recurrenceRule: null,
      tracksDuration,
      expectedDuration: tracksDuration && expectedDuration !== '' ? Number(expectedDuration) : null,
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background, maxHeight: windowHeight * 0.85, paddingBottom: insets.bottom + Spacing.four }]} type="background">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: Spacing.three }} keyboardShouldPersistTaps="handled">
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
