import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CategoryPicker({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: string[];
  onChange: (category: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const options = categories.includes(value) ? categories : [...categories, value].sort((a, b) => a.localeCompare(b));

  const selectCategory = (category: string) => {
    onChange(category);
    setOpen(false);
    setDraft('');
  };

  const addCategory = () => {
    const trimmed = draft.trim();
    if (trimmed === '') return;
    selectCategory(trimmed);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: theme.backgroundSelected }]}>
        <ThemedText style={{ flex: 1 }}>{value}</ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrapper}>
            <ThemedView style={[styles.sheet, { backgroundColor: theme.background }]} type="background">
              <ThemedText themeColor="textSecondary" type="small" style={{ marginBottom: Spacing.two }}>
                Category
              </ThemedText>
              <ScrollView style={{ maxHeight: 240 }}>
                {options.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => selectCategory(category)}
                    style={[styles.option, category === value && { backgroundColor: theme.primarySoft }]}>
                    <ThemedText themeColor={category === value ? 'primary' : 'text'}>{category}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={[styles.addRow, { borderTopColor: theme.backgroundSelected }]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Add a new category…"
                  placeholderTextColor={theme.textSecondary}
                  onSubmitEditing={addCategory}
                  style={[styles.input, { color: theme.text }]}
                />
                <Pressable onPress={addCategory} style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText themeColor="primary" type="small">
                    Add
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  sheetWrapper: {
    width: '100%',
    maxWidth: 360,
  },
  sheet: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  option: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.one,
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    justifyContent: 'center',
  },
});
