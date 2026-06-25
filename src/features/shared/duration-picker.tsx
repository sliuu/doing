import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, h) => h);
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function OptionDropdown({
  label,
  value,
  options,
  formatOption,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  formatOption: (n: number) => string;
  onChange: (n: number) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.field, { borderColor: theme.backgroundSelected }]}>
        <ThemedText style={{ flex: 1 }}>{formatOption(value)}</ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetWrapper}>
            <ThemedView style={[styles.sheet, { backgroundColor: theme.background }]} type="background">
              <ThemedText themeColor="textSecondary" type="small" style={{ marginBottom: Spacing.two }}>
                {label}
              </ThemedText>
              <ScrollView style={{ maxHeight: 240 }}>
                {options.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    style={[styles.option, opt === value && { backgroundColor: theme.primarySoft }]}>
                    <ThemedText themeColor={opt === value ? 'primary' : 'text'}>{formatOption(opt)}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** `totalMinutes` is the full duration in minutes; reported back the same way via `onChange`. */
export function DurationPicker({
  totalMinutes,
  onChange,
}: {
  totalMinutes: number;
  onChange: (totalMinutes: number) => void;
}) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <View style={styles.row}>
      <OptionDropdown
        label="Hours"
        value={hours}
        options={HOUR_OPTIONS}
        formatOption={(h) => `${h}h`}
        onChange={(h) => onChange(h * 60 + minutes)}
      />
      <OptionDropdown
        label="Minutes"
        value={minutes}
        options={MINUTE_OPTIONS}
        formatOption={(m) => `${m}m`}
        onChange={(m) => onChange(hours * 60 + m)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  field: {
    flex: 1,
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
    maxWidth: 240,
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
});
