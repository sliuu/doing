import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TimeOfDay } from '@/db/types';

import { CompleteModal } from '@/features/shared/complete-modal';
import { NewTaskModal } from '@/features/daily/new-task-modal';
import { TaskRow } from '@/features/daily/task-row';
import { TimerModal } from '@/features/daily/timer-modal';
import { DailyItem, TIME_OF_DAY_SECTIONS } from '@/features/daily/types';
import { useDaily } from '@/features/daily/use-daily';

export default function DailyScreen() {
  const theme = useTheme();
  const { loading, sections, now, dateKey, addTask, toggleComplete, toggleRunning, bumpDuration, toggleSubtask } =
    useDaily();

  const [activeTimerInstanceId, setActiveTimerInstanceId] = useState<string | null>(null);
  const [completingInstanceId, setCompletingInstanceId] = useState<string | null>(null);
  const [newTaskSection, setNewTaskSection] = useState<TimeOfDay | null>(null);

  const allItems: DailyItem[] = Object.values(sections).flat();
  const activeTimerItem = allItems.find((i) => i.instance.id === activeTimerInstanceId) ?? null;
  const completingItem = allItems.find((i) => i.instance.id === completingInstanceId) ?? null;

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
          <ThemedText type="title">Daily</ThemedText>

          {TIME_OF_DAY_SECTIONS.map(({ key, label }) => (
            <View key={key} style={{ gap: Spacing.two }}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle">{label}</ThemedText>
                <Pressable
                  onPress={() => setNewTaskSection(key)}
                  style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText themeColor="primary">+ Add</ThemedText>
                </Pressable>
              </View>

              {sections[key].length === 0 ? (
                <ThemedText themeColor="textSecondary">Nothing here yet.</ThemedText>
              ) : (
                sections[key].map((item) => (
                  <TaskRow
                    key={item.instance.id}
                    item={item}
                    now={now}
                    onToggleComplete={() => {
                      if (item.instance.completed) {
                        toggleComplete(item.instance.id, true);
                      } else {
                        setCompletingInstanceId(item.instance.id);
                      }
                    }}
                    onStartTimer={() => setActiveTimerInstanceId(item.instance.id)}
                  />
                ))
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {activeTimerItem && (
        <TimerModal
          item={activeTimerItem}
          now={now}
          onToggleRunning={() => toggleRunning(activeTimerItem.instance.id, activeTimerItem.instance.timerState === 'running')}
          onAdjust={(delta) => bumpDuration(activeTimerItem.instance.id, delta)}
          onToggleSubtask={(subtaskId, done) => toggleSubtask(activeTimerItem.instance.id, subtaskId, done)}
          onComplete={() => {
            setActiveTimerInstanceId(null);
            setCompletingInstanceId(activeTimerItem.instance.id);
          }}
          onClose={() => setActiveTimerInstanceId(null)}
        />
      )}

      {completingItem && dateKey && (
        <CompleteModal
          task={completingItem.task}
          instance={completingItem.instance}
          defaultDateKey={dateKey}
          onCancel={() => setCompletingInstanceId(null)}
          onConfirm={(opts) => {
            toggleComplete(completingItem.instance.id, false, opts);
            setCompletingInstanceId(null);
          }}
        />
      )}

      {newTaskSection && (
        <NewTaskModal
          defaultTimeOfDay={newTaskSection}
          onCancel={() => setNewTaskSection(null)}
          onSubmit={(input, timeOfDay) => {
            addTask(input, timeOfDay);
            setNewTaskSection(null);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
