import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TaskSize } from '@/db/types';

import { CompleteModal } from '@/features/shared/complete-modal';
import { ScheduleModal } from '@/features/todo/schedule-modal';
import { TodoFormModal } from '@/features/todo/todo-form-modal';
import { TodoRow } from '@/features/todo/todo-row';
import { SIZE_SECTIONS, TodoItem } from '@/features/todo/types';
import { useTodo } from '@/features/todo/use-todo';

export default function ToDoScreen() {
  const theme = useTheme();
  const { loading, sections, today, addTask, schedule, toggleComplete, addTime, editTask, removeTask } = useTodo();

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [newTodoSize, setNewTodoSize] = useState<TaskSize | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const allItems: TodoItem[] = Object.values(sections).flat();
  const finishedItems = allItems.filter((item) => item.instance?.completed);
  const completingItem = allItems.find((i) => i.task.id === completingTaskId) ?? null;
  const schedulingItem = allItems.find((i) => i.task.id === schedulingTaskId) ?? null;
  const editingItem = allItems.find((i) => i.task.id === editingTaskId) ?? null;

  if (loading || !today) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} />
      </ThemedView>
    );
  }

  const renderRow = (item: TodoItem) => (
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
      onEdit={() => setEditingTaskId(item.task.id)}
    />
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
          <ThemedText type="display" style={styles.headerTitle}>
            To-Dos
          </ThemedText>

          {SIZE_SECTIONS.map(({ key, label }) => {
            const items = sections[key].filter((item) => !item.instance?.completed);
            return (
              <View key={key} style={{ gap: Spacing.two }}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="label">{label}</ThemedText>
                  <Pressable
                    onPress={() => setNewTodoSize(key)}
                    style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
                    <ThemedText themeColor="primary">+</ThemedText>
                  </Pressable>
                </View>

                {items.map(renderRow)}
              </View>
            );
          })}

          {finishedItems.length > 0 && (
            <View style={{ gap: Spacing.two }}>
              <ThemedText type="label">finished</ThemedText>
              {finishedItems.map(renderRow)}
            </View>
          )}
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
          onAddTime={(delta) => addTime(completingItem, delta)}
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

      {newTodoSize && (
        <TodoFormModal
          defaultSize={newTodoSize}
          onCancel={() => setNewTodoSize(null)}
          onSubmit={(input) => {
            addTask(input);
            setNewTodoSize(null);
          }}
        />
      )}

      {editingItem && (
        <TodoFormModal
          task={editingItem.task}
          onCancel={() => setEditingTaskId(null)}
          onSubmit={(patch) => {
            editTask(editingItem.task.id, patch);
            setEditingTaskId(null);
          }}
          onDelete={() => {
            removeTask(editingItem.task.id);
            setEditingTaskId(null);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    textAlign: 'center',
  },
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
