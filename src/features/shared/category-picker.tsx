import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_COLORS, suggestColor } from '@/db/categories';
import { useCategories } from '@/features/shared/use-categories';

/** A row of tappable color swatches. */
function ColorSwatches({ selected, onSelect }: { selected: string; onSelect: (color: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.swatchRow}>
      {CATEGORY_COLORS.map((color) => (
        <Pressable
          key={color}
          onPress={() => onSelect(color)}
          style={[
            styles.swatch,
            { backgroundColor: color },
            color === selected && { borderColor: theme.text, borderWidth: 2 },
          ]}
        />
      ))}
    </View>
  );
}

function ColorDot({ color }: { color: string | null }) {
  if (!color) return null;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

/**
 * Category select + management. Tapping the field opens a sheet listing every
 * category (with its color), a swatch row to recolor the selected category, and
 * an inline "add new" flow where the user picks the new category's color.
 */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (category: string) => void }) {
  const theme = useTheme();
  const { categories, saveCategory } = useCategories();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState<string | null>(null);

  const colorOf = (name: string) => categories.find((c) => c.name === name)?.color ?? null;
  const suggested = suggestColor(categories);

  const selectCategory = (category: string) => {
    onChange(category);
    setOpen(false);
    setDraft('');
    setDraftColor(null);
  };

  const addCategory = async () => {
    const trimmed = draft.trim().toLowerCase();
    if (trimmed === '') return;
    await saveCategory(trimmed, draftColor ?? suggested);
    selectCategory(trimmed);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: theme.backgroundSelected }]}>
        <ColorDot color={colorOf(value)} />
        <ThemedText style={{ flex: 1 }}>{value}</ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdropWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheetWrapper}>
            <ThemedView style={[styles.sheet, { backgroundColor: theme.background }]} type="background">
              <ThemedText themeColor="textSecondary" type="small" style={{ marginBottom: Spacing.two }}>
                Category
              </ThemedText>
              <ScrollView style={{ maxHeight: 240 }}>
                <Pressable
                  onPress={() => selectCategory('uncategorized')}
                  style={[styles.option, value === 'uncategorized' && { backgroundColor: theme.primarySoft }]}>
                  <ThemedText themeColor={value === 'uncategorized' ? 'primary' : 'textSecondary'}>
                    uncategorized
                  </ThemedText>
                </Pressable>
                {categories.map((category) => (
                  <Pressable
                    key={category.name}
                    onPress={() => selectCategory(category.name)}
                    style={[styles.option, category.name === value && { backgroundColor: theme.primarySoft }]}>
                    <ColorDot color={category.color} />
                    <ThemedText themeColor={category.name === value ? 'primary' : 'text'}>{category.name}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              {value !== 'uncategorized' && colorOf(value) && (
                <View style={[styles.section, { borderTopColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Color for “{value}”
                  </ThemedText>
                  <ColorSwatches selected={colorOf(value)!} onSelect={(color) => saveCategory(value, color)} />
                </View>
              )}

              <View style={[styles.section, { borderTopColor: theme.backgroundSelected }]}>
                <View style={styles.addRow}>
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
                {draft.trim() !== '' && (
                  <ColorSwatches selected={draftColor ?? suggested} onSelect={setDraftColor} />
                )}
              </View>
            </ThemedView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  backdropWrap: {
    flex: 1,
    backgroundColor: Colors.overlay,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
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
