import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';

import { DurationBarChart } from '@/features/stats/duration-bar-chart';
import { PeriodTabs } from '@/features/stats/period-tabs';
import { StatsRow } from '@/features/stats/stats-row';
import { useStats } from '@/features/stats/use-stats';

const SELF_CARE_LIMIT = 5;

export default function StatsScreen() {
  const { loading, streak, tasks, selfCare, period, setPeriod } = useStats();

  if (loading) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
          <ThemedText type="title" style={{ fontFamily: Fonts.serif }}>
            Me
          </ThemedText>

          <View style={styles.streak}>
            <ThemedText style={styles.streakNumber}>{streak}</ThemedText>
            <ThemedText themeColor="textSecondary">day streak</ThemedText>
          </View>

          <PeriodTabs period={period} onChange={setPeriod} />

          <View style={{ gap: Spacing.three }}>
            <ThemedText type="subtitle">Tasks</ThemedText>
            <DurationBarChart stats={tasks} />
          </View>

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">Self-Care</ThemedText>
            {selfCare.slice(0, SELF_CARE_LIMIT).map((stat) => <StatsRow key={stat.task.id} stat={stat} showDuration={false} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  streak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  streakNumber: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
});
