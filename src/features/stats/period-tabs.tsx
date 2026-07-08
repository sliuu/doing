import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { StatsPeriod } from '@/db/stats';

const PERIOD_OPTIONS: { key: StatsPeriod; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All-time' },
];

export function PeriodTabs({ period, onChange }: { period: StatsPeriod; onChange: (period: StatsPeriod) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {PERIOD_OPTIONS.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onChange(opt.key)}
          style={[
            styles.chip,
            { borderColor: theme.backgroundSelected },
            period === opt.key && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}>
          <ThemedText style={period === opt.key ? { color: theme.onPrimary } : undefined} type="small">
            {opt.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
});
