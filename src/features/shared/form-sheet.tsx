import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Bottom-sheet wrapper shared by every form modal: dims the screen, slides up from
 * the bottom, avoids the keyboard, and scrolls when the form is taller than the screen.
 */
export function FormSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* The tap-to-dismiss backdrop is an absolutely-filled sibling *behind* the card,
            not an ancestor of it. Wrapping the card in a Pressable makes that Pressable
            compete with the ScrollView for the drag gesture, so scrolling only works
            intermittently. As a plain sibling it never touches the card's gestures. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView
          style={[styles.card, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.four }]}
          type="background">
          {/* The height cap must sit on the ScrollView itself: the card is auto-sized
              by its content, so a maxHeight (or flex) higher up doesn't bound the
              ScrollView — content just gets clipped with no way to scroll to it. */}
          <ScrollView
            style={{ maxHeight: windowHeight * 0.7 }}
            contentContainerStyle={{ gap: Spacing.three }}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A labelled form field: small secondary label above arbitrary content. */
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      {children}
    </View>
  );
}

/** A TextInput with the app's standard border and colors. */
export function FormTextInput(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
    />
  );
}

/** A wrapping row of single-select chips. */
export function ChipRow<K extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { key: K; label: string }[];
  selected: K | ((key: K) => boolean);
  onSelect: (key: K) => void;
}) {
  const theme = useTheme();
  const isSelected = typeof selected === 'function' ? selected : (key: K) => key === selected;

  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onSelect(opt.key)}
          style={[
            styles.chip,
            { borderColor: theme.backgroundSelected },
            isSelected(opt.key) && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}>
          <ThemedText style={isSelected(opt.key) ? { color: '#fff' } : undefined} type="small">
            {opt.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

/** A label with a Switch on the right. */
export function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

/** The bottom action row: optional Delete on the left, Cancel + submit on the right. */
export function FormActions({
  submitLabel,
  canSubmit,
  onSubmit,
  onCancel,
  onDelete,
}: {
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.actions}>
      {onDelete && (
        <>
          <Pressable onPress={onDelete} style={styles.actionButton}>
            <ThemedText style={{ color: theme.danger }}>Delete</ThemedText>
          </Pressable>
          <View style={{ flex: 1 }} />
        </>
      )}
      <Pressable onPress={onCancel} style={styles.actionButton}>
        <ThemedText themeColor="textSecondary">Cancel</ThemedText>
      </Pressable>
      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[
          styles.actionButton,
          { backgroundColor: canSubmit ? theme.primary : theme.backgroundSelected, borderRadius: Spacing.two },
        ]}>
        <ThemedText style={{ color: canSubmit ? '#fff' : theme.textSecondary }}>{submitLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
