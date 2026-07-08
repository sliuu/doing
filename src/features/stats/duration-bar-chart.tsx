import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDurationShort, truncateName } from '@/lib/format';

import { TaskStat } from '@/db/stats';

const MAX_BARS = 6;
const MAX_NAME_LENGTH = 25;

/** Horizontal bar chart of total time spent, limited to tasks that actually track duration. */
export function DurationBarChart({ stats }: { stats: TaskStat[] }) {
  const theme = useTheme();

  const bars = stats
    .filter((stat) => stat.task.tracksDuration && stat.totalDurationSeconds > 0)
    .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds)
    .slice(0, MAX_BARS);

  if (bars.length === 0) return null;

  const maxDuration = Math.max(...bars.map((b) => b.totalDurationSeconds));

  return (
    <View style={{ gap: Spacing.three }}>
      {bars.map((stat) => (
        <View key={stat.task.id} style={{ gap: Spacing.one }}>
          <ThemedText type="small" numberOfLines={2}>
            {truncateName(stat.task.title, MAX_NAME_LENGTH)}
          </ThemedText>
          <View style={styles.trackRow}>
            <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: stat.categoryColor ?? theme.primary,
                    width: `${(stat.totalDurationSeconds / maxDuration) * 100}%`,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.durationLabel}>
              {formatDurationShort(stat.totalDurationSeconds)}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Spacing.one,
  },
  durationLabel: {
    width: 64,
    textAlign: 'right',
  },
});
