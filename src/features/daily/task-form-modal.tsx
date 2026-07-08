import { useState } from 'react';

import type { NewTaskInput } from '@/db/tasks';
import type { Task, TimeOfDay } from '@/db/types';
import { ThemedText } from '@/components/themed-text';
import { CategoryPicker } from '@/features/shared/category-picker';
import { DurationPicker } from '@/features/shared/duration-picker';
import { ChipRow, FormActions, FormField, FormSheet, FormTextInput, SwitchRow } from '@/features/shared/form-sheet';
import { draftFromTask, isDraftValid, RecurrencePicker, ruleFromDraft } from '@/features/shared/recurrence-picker';
import { TIME_OF_DAY_SECTIONS } from '@/features/daily/types';

/** Create/edit form for a Today-page task. Pass `task` to edit, omit it to create. */
export function TaskFormModal({
  task,
  initialTimeOfDay,
  onCancel,
  onSubmit,
  onDelete,
}: {
  task?: Task;
  initialTimeOfDay: TimeOfDay;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput, timeOfDay: TimeOfDay) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [category, setCategory] = useState(task?.category ?? 'uncategorized');
  const [recurrence, setRecurrence] = useState(draftFromTask(task));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialTimeOfDay);
  const [tracksDuration, setTracksDuration] = useState(task?.tracksDuration ?? false);
  const [expectedMinutes, setExpectedMinutes] = useState(task?.expectedDuration ?? 0);
  const [hideOnNoWorkDays, setHideOnNoWorkDays] = useState(task?.hideOnNoWorkDays ?? false);
  const [hideOnLowEnergyDays, setHideOnLowEnergyDays] = useState(task?.hideOnLowEnergyDays ?? false);

  const recurring = recurrence.freq !== 'once';
  const canSubmit = title.trim() !== '' && isDraftValid(recurrence);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(
      {
        title: title.trim(),
        category,
        recurring,
        recurrenceRule: ruleFromDraft(recurrence),
        tracksDuration,
        expectedDuration: tracksDuration && expectedMinutes > 0 ? expectedMinutes : null,
        hideOnNoWorkDays: recurring ? hideOnNoWorkDays : false,
        hideOnLowEnergyDays: recurring ? hideOnLowEnergyDays : false,
      },
      timeOfDay
    );
  };

  return (
    <FormSheet onClose={onCancel}>
      <ThemedText type="subtitle">{task ? 'Edit task' : 'New task'}</ThemedText>

      <FormField label="Title">
        <FormTextInput value={title} onChangeText={setTitle} placeholder="What do you need to do?" />
      </FormField>

      <FormField label="Category">
        <CategoryPicker value={category} onChange={setCategory} />
      </FormField>

      <RecurrencePicker draft={recurrence} onChange={setRecurrence} />

      <FormField label="Section">
        <ChipRow options={TIME_OF_DAY_SECTIONS} selected={timeOfDay} onSelect={setTimeOfDay} />
      </FormField>

      <SwitchRow label="Track duration / timer" value={tracksDuration} onValueChange={setTracksDuration} />

      {tracksDuration && (
        <FormField label="Expected duration (optional)">
          <DurationPicker totalMinutes={expectedMinutes} onChange={setExpectedMinutes} />
        </FormField>
      )}

      {recurring && (
        <>
          <SwitchRow label="Hide on no-work days" value={hideOnNoWorkDays} onValueChange={setHideOnNoWorkDays} />
          <SwitchRow
            label="Hide on low-energy days"
            value={hideOnLowEnergyDays}
            onValueChange={setHideOnLowEnergyDays}
          />
        </>
      )}

      <FormActions
        submitLabel={task ? 'Save' : 'Create'}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </FormSheet>
  );
}
