import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfettiBurst, useCelebration } from '@/components/confetti-burst';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatDateHeader, formatTimer } from '@/lib/format';
import type { TimeOfDay } from '@/db/types';

import { CompleteModal } from '@/features/shared/complete-modal';
import { DeleteChoiceModal } from '@/features/shared/delete-choice-modal';
import { PieProgress } from '@/features/daily/pie-progress';
import { TaskFormModal } from '@/features/daily/task-form-modal';
import { TaskActionsModal } from '@/features/daily/task-actions-modal';
import { TaskRow } from '@/features/daily/task-row';
import { TimerModal } from '@/features/daily/timer-modal';
import { DAY_MODE_OPTIONS, DailyItem, TIME_OF_DAY_SECTIONS, effectiveExpectedMinutes } from '@/features/daily/types';
import { useDaily } from '@/features/daily/use-daily';
import { scheduleStateFor } from '@/features/todo/types';
import { useTodo } from '@/features/todo/use-todo';

export default function DailyScreen() {
  const theme = useTheme();
  const {
    loading,
    sections,
    now,
    dateKey,
    isToday,
    dayMode,
    setDayMode,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    addTask,
    toggleComplete,
    toggleRunning,
    bumpDuration,
    editTask,
    moveToTimeOfDay,
    removeTask,
    removeTaskOccurrence,
  } = useDaily();

  const { sections: todoSections, today: todoToday, toggleComplete: toggleTodoComplete } = useTodo();

  const todayTodos = useMemo(() => {
    if (!todoToday) return [];
    return Object.values(todoSections)
      .flat()
      .filter((item) => !item.instance?.completed && scheduleStateFor(item, todoToday) === 'today');
  }, [todoSections, todoToday]);

  const [activeTimerInstanceId, setActiveTimerInstanceId] = useState<string | null>(null);
  const [completingInstanceId, setCompletingInstanceId] = useState<string | null>(null);
  const [newTaskSection, setNewTaskSection] = useState<TimeOfDay | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [actionsInstanceId, setActionsInstanceId] = useState<string | null>(null);
  const [deleteChoiceInstanceId, setDeleteChoiceInstanceId] = useState<string | null>(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { burst, celebrate, clearBurst } = useCelebration();
  // Where the completing tap happened, so confetti after the CompleteModal bursts from the row.
  const [pendingBurstPos, setPendingBurstPos] = useState<{ x: number; y: number } | null>(null);

  const allItems: DailyItem[] = Object.values(sections).flat();
  const activeTimerItem = allItems.find((i) => i.instance.id === activeTimerInstanceId) ?? null;
  const completingItem = allItems.find((i) => i.instance.id === completingInstanceId) ?? null;
  const editingItem = allItems.find((i) => i.task.id === editingTaskId) ?? null;
  const actionsItem = allItems.find((i) => i.instance.id === actionsInstanceId) ?? null;
  const deleteChoiceItem = allItems.find((i) => i.instance.id === deleteChoiceInstanceId) ?? null;
  const runningItem = allItems.find((i) => i.instance.timerState === 'running') ?? null;

  const requestDelete = (item: DailyItem) => {
    if (item.task.recurring) {
      setDeleteChoiceInstanceId(item.instance.id);
    } else {
      removeTask(item.task.id);
    }
  };

  let runningBanner: { fraction: number; label: string; reached: boolean } | null = null;
  if (runningItem) {
    const liveSeconds = getLiveDurationSeconds(runningItem.instance, now);
    const expectedMinutes = effectiveExpectedMinutes(runningItem.task.expectedDuration, dayMode);
    const expectedSeconds = expectedMinutes ? expectedMinutes * 60 : null;
    const reached = expectedSeconds !== null && liveSeconds >= expectedSeconds;
    runningBanner = {
      fraction: expectedSeconds ? liveSeconds / expectedSeconds : 0,
      label: expectedSeconds === null
        ? formatTimer(liveSeconds)
        : reached
          ? `+${formatTimer(liveSeconds - expectedSeconds)}`
          : formatTimer(expectedSeconds - liveSeconds),
      reached,
    };
  }

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
          <View style={styles.dateRow}>
            <Pressable onPress={goToPreviousDay} hitSlop={Spacing.two}>
              <ThemedText type="title" themeColor="textSecondary">‹</ThemedText>
            </Pressable>
            <Pressable onPress={goToToday} style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText type="display">{isToday ? 'Today' : dateKey ? formatDateHeader(dateKey) : ''}</ThemedText>
            </Pressable>
            <Pressable onPress={goToNextDay} hitSlop={Spacing.two}>
              <ThemedText type="title" themeColor="textSecondary">›</ThemedText>
            </Pressable>
          </View>

          {runningItem && runningBanner && (
            <Pressable
              onPress={() => setActiveTimerInstanceId(runningItem.instance.id)}
              style={[styles.runningBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.today }]}>
              <PieProgress
                size={36}
                fraction={runningBanner.fraction}
                color={theme.today}
                trackColor={theme.backgroundSelected}
              />
              <View style={{ flex: 1 }}>
                <ThemedText type="small" themeColor="today">
                  ● Timer running
                </ThemedText>
                <ThemedText numberOfLines={1}>{runningItem.task.title}</ThemedText>
              </View>
              <ThemedText themeColor="today" style={styles.runningBannerTime}>
                {runningBanner.label}
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.modeRow}>
            {DAY_MODE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setDayMode(opt.key)}
                style={[styles.modePill, dayMode === opt.key && { backgroundColor: theme.pill }]}>
                <ThemedText type="small" style={dayMode === opt.key ? { color: theme.pillText } : undefined}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {todayTodos.length > 0 && (
            <View style={{ gap: Spacing.two }}>
              <ThemedText type="label">to-dos</ThemedText>
              {todayTodos.map((item) => (
                <Pressable
                  key={item.task.id}
                  onPress={(e) => {
                    toggleTodoComplete(item);
                    celebrate({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: theme.backgroundElement },
                    pressed && { opacity: 0.75 },
                  ]}>
                  {item.categoryColor && (
                    <View style={[styles.categoryStripe, { backgroundColor: item.categoryColor }]} />
                  )}
                  <View style={[styles.checkbox, { borderColor: theme.primary }]} />
                  <ThemedText style={{ flex: 1 }}>{item.task.title}</ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {TIME_OF_DAY_SECTIONS.map(({ key, label }) => (
            <View key={key} style={{ gap: Spacing.two }}>
              <View style={styles.sectionHeader}>
                <ThemedText type="label">{label}</ThemedText>
                <Pressable
                  onPress={() => setNewTaskSection(key)}
                  style={[styles.addButton, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText themeColor="primary">+</ThemedText>
                </Pressable>
              </View>

              {sections[key].map((item) => (
                <TaskRow
                  key={item.instance.id}
                  item={item}
                  now={now}
                  dayMode={dayMode}
                  onToggleComplete={(pos) => {
                    if (item.instance.completed) {
                      toggleComplete(item.instance.id, true);
                    } else if (item.task.tracksDuration) {
                      // Duration-tracked tasks confirm logged time first; confetti fires on confirm.
                      setPendingBurstPos(pos);
                      setCompletingInstanceId(item.instance.id);
                    } else {
                      toggleComplete(item.instance.id, false);
                      celebrate(pos);
                    }
                  }}
                  onToggleRunning={() => toggleRunning(item.instance.id, item.instance.timerState === 'running')}
                  onOpenTimer={() => setActiveTimerInstanceId(item.instance.id)}
                  onPress={() => setActionsInstanceId(item.instance.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {activeTimerItem && (
        <TimerModal
          item={activeTimerItem}
          now={now}
          dayMode={dayMode}
          onToggleRunning={() => toggleRunning(activeTimerItem.instance.id, activeTimerItem.instance.timerState === 'running')}
          onAdjust={(delta) => bumpDuration(activeTimerItem.instance.id, delta)}
          onChangeExpectedDuration={(minutes) =>
            editTask(activeTimerItem.task.id, { expectedDuration: minutes > 0 ? minutes : null })
          }
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
          onCancel={() => {
            setCompletingInstanceId(null);
            setPendingBurstPos(null);
          }}
          onConfirm={(opts) => {
            toggleComplete(completingItem.instance.id, false, opts);
            setCompletingInstanceId(null);
            celebrate(pendingBurstPos ?? { x: windowWidth / 2, y: windowHeight / 2 });
            setPendingBurstPos(null);
          }}
          onAddTime={(delta) => bumpDuration(completingItem.instance.id, delta)}
        />
      )}

      {newTaskSection && (
        <TaskFormModal
          initialTimeOfDay={newTaskSection}
          onCancel={() => setNewTaskSection(null)}
          onSubmit={(input, timeOfDay) => {
            addTask(input, timeOfDay);
            setNewTaskSection(null);
          }}
        />
      )}

      {editingItem && (
        <TaskFormModal
          task={editingItem.task}
          initialTimeOfDay={editingItem.instance.timeOfDay ?? 'anytime'}
          onCancel={() => setEditingTaskId(null)}
          onSubmit={(patch, timeOfDay) => {
            editTask(editingItem.task.id, patch);
            if (timeOfDay !== (editingItem.instance.timeOfDay ?? 'anytime')) {
              moveToTimeOfDay(editingItem.instance.id, timeOfDay);
            }
            setEditingTaskId(null);
          }}
          onDelete={() => {
            setEditingTaskId(null);
            requestDelete(editingItem);
          }}
        />
      )}

      {actionsItem && (
        <TaskActionsModal
          item={actionsItem}
          onClose={() => setActionsInstanceId(null)}
          onEdit={() => {
            setActionsInstanceId(null);
            setEditingTaskId(actionsItem.task.id);
          }}
          onStartTimer={() => {
            toggleRunning(actionsItem.instance.id, actionsItem.instance.timerState === 'running');
            setActionsInstanceId(null);
          }}
          onDelete={() => {
            setActionsInstanceId(null);
            requestDelete(actionsItem);
          }}
        />
      )}

      {deleteChoiceItem && (
        <DeleteChoiceModal
          title={deleteChoiceItem.task.title}
          onCancel={() => setDeleteChoiceInstanceId(null)}
          onDeleteToday={() => {
            removeTaskOccurrence(deleteChoiceItem.instance.id, deleteChoiceItem.task.id, deleteChoiceItem.instance.date);
            setDeleteChoiceInstanceId(null);
          }}
          onDeleteAll={() => {
            removeTask(deleteChoiceItem.task.id);
            setDeleteChoiceInstanceId(null);
          }}
        />
      )}

      {burst && <ConfettiBurst key={burst.id} x={burst.x} y={burst.y} onDone={clearBurst} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  runningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  runningBannerTime: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontWeight: '600',
  },
  modePill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  categoryStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
});
