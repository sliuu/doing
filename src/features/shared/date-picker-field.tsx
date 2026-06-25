import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateFromKey, keyFromDate } from '@/lib/day';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDisplay(dateKey: string): string {
  const date = dateFromKey(dateKey);
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** A button that opens a native calendar picker, rather than a free-text date field. */
export function DatePickerField({ value, onChange }: { value: string; onChange: (dateKey: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(keyFromDate(selected));
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.button, { borderColor: theme.backgroundSelected }]}>
        <ThemedText>{formatDisplay(value)}</ThemedText>
      </Pressable>

      {open && (
        <View style={Platform.OS === 'ios' && styles.iosPickerWrapper}>
          <DateTimePicker
            value={dateFromKey(value)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={handleChange}
            themeVariant="dark"
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.doneButton, { backgroundColor: theme.primary }]}>
              <ThemedText style={{ color: '#fff' }}>Done</ThemedText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
  },
  iosPickerWrapper: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  doneButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
