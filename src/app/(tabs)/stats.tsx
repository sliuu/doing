import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PeriodTabs } from '@/features/stats/period-tabs';
import { StatsRow } from '@/features/stats/stats-row';
import { useStats } from '@/features/stats/use-stats';

export default function StatsScreen() {
  const { loading, streak, tasks, easyWins, period, setPeriod } = useStats();

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
          <ThemedText type="title">Stats</ThemedText>

          <View style={styles.streak}>
            <ThemedText style={styles.streakNumber}>🔥 {streak}</ThemedText>
            <ThemedText themeColor="textSecondary">day streak</ThemedText>
          </View>

          <PeriodTabs period={period} onChange={setPeriod} />

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">Tasks</ThemedText>
            {tasks.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing completed yet.</ThemedText>
            ) : (
              tasks.map((stat) => <StatsRow key={stat.task.id} stat={stat} showDuration />)
            )}
          </View>

          <View style={{ gap: Spacing.two }}>
            <ThemedText type="subtitle">Easy Wins</ThemedText>
            {easyWins.length === 0 ? (
              <ThemedText themeColor="textSecondary">Nothing completed yet.</ThemedText>
            ) : (
              easyWins.map((stat) => <StatsRow key={stat.task.id} stat={stat} showDuration={false} />)
            )}
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
    fontWeight: '700',
  },
});
