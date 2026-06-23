import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CompleteModal } from '@/features/shared/complete-modal';
import { NewTodoModal } from '@/features/todo/new-todo-modal';
import { ScheduleModal } from '@/features/todo/schedule-modal';
import { TodoRow } from '@/features/todo/todo-row';
import { SIZE_SECTIONS, TodoItem } from '@/features/todo/types';
import { useTodo } from '@/features/todo/use-todo';

export default function ToDoScreen() {
  const theme = useTheme();
  const { loading, sections, today, addTask, schedule, toggleComplete } = useTodo();

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [showNewTodo, setShowNewTodo] = useState(false);

  const allItems: TodoItem[] = Object.values(sections).flat();
  const completingItem = allItems.find((i) => i.task.id === completingTaskId) ?? null;
  const schedulingItem = allItems.find((i) => i.task.id === schedulingTaskId) ?? null;

  if (loading || !today) {
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
          <View style={styles.header}>
            <ThemedText type="title">To-Do</ThemedText>
            <Pressable
              onPress={() => setShowNewTodo(true)}
              style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
              <ThemedText themeColor="primary">+ Add</ThemedText>
            </Pressable>
          </View>

          {SIZE_SECTIONS.map(({ key, label }) => (
            <View key={key} style={{ gap: Spacing.two }}>
              <ThemedText type="subtitle">{label}</ThemedText>

              {sections[key].length === 0 ? (
                <ThemedText themeColor="textSecondary">Nothing here yet.</ThemedText>
              ) : (
                sections[key].map((item) => (
                  <TodoRow
                    key={item.task.id}
                    item={item}
                    todayKey={today}
                    onToggleComplete={() => {
                      if (item.instance?.completed) {
                        toggleComplete(item, undefined);
                      } else {
                        setCompletingTaskId(item.task.id);
                      }
                    }}
                    onSchedule={() => setSchedulingTaskId(item.task.id)}
                  />
                ))
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {completingItem && (
        <CompleteModal
          task={completingItem.task}
          instance={completingItem.instance}
          defaultDateKey={today}
          allowDateSelection
          onCancel={() => setCompletingTaskId(null)}
          onConfirm={(opts) => {
            toggleComplete(completingItem, opts);
            setCompletingTaskId(null);
          }}
        />
      )}

      {schedulingItem && (
        <ScheduleModal
          item={schedulingItem}
          todayKey={today}
          onCancel={() => setSchedulingTaskId(null)}
          onSchedule={(dateKey) => {
            schedule(schedulingItem, dateKey);
            setSchedulingTaskId(null);
          }}
        />
      )}

      {showNewTodo && (
        <NewTodoModal
          onCancel={() => setShowNewTodo(false)}
          onSubmit={(input) => {
            addTask(input);
            setShowNewTodo(false);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
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
