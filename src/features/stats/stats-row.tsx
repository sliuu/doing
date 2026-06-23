import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDurationShort } from '@/lib/format';

import { TaskStat } from '@/db/stats';

export function StatsRow({ stat, showDuration }: { stat: TaskStat; showDuration: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.emoji}>{stat.task.emoji ?? '✅'}</ThemedText>
      <ThemedText style={{ flex: 1 }}>{stat.task.title}</ThemedText>
      <ThemedText themeColor="textSecondary" type="small">
        {stat.completions}x{showDuration && stat.totalDurationSeconds > 0 ? ` · ${formatDurationShort(stat.totalDurationSeconds)}` : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  emoji: {
    fontSize: 20,
  },
});
