import { useState } from 'react';

import type { NewTaskInput } from '@/db/tasks';
import type { Task, TaskSize } from '@/db/types';
import { ThemedText } from '@/components/themed-text';
import { CategoryPicker } from '@/features/shared/category-picker';
import { DurationPicker } from '@/features/shared/duration-picker';
import { ChipRow, FormActions, FormField, FormSheet, FormTextInput, SwitchRow } from '@/features/shared/form-sheet';
import { useCategories } from '@/features/shared/use-categories';
import { SIZE_SECTIONS } from '@/features/todo/types';

/** Create/edit form for a one-off to-do. Pass `task` to edit, omit it to create. */
export function TodoFormModal({
  task,
  defaultSize = 'medium',
  onCancel,
  onSubmit,
  onDelete,
}: {
  task?: Task;
  defaultSize?: TaskSize;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
  onDelete?: () => void;
}) {
  const categories = useCategories();
  const [title, setTitle] = useState(task?.title ?? '');
  const [category, setCategory] = useState(task?.category ?? 'uncategorized');
  const [size, setSize] = useState<TaskSize>(task?.size ?? defaultSize);
  const [tracksDuration, setTracksDuration] = useState(task?.tracksDuration ?? false);
  const [expectedMinutes, setExpectedMinutes] = useState(task?.expectedDuration ?? 0);

  const canSubmit = title.trim() !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      category,
      size,
      recurring: false,
      recurrenceRule: null,
      tracksDuration,
      expectedDuration: tracksDuration && expectedMinutes > 0 ? expectedMinutes : null,
    });
  };

  return (
    <FormSheet onClose={onCancel}>
      <ThemedText type="subtitle">{task ? 'Edit to-do' : 'New to-do'}</ThemedText>

      <FormField label="Title">
        <FormTextInput value={title} onChangeText={setTitle} placeholder="What do you need to do?" />
      </FormField>

      <FormField label="Category">
        <CategoryPicker value={category} categories={categories} onChange={setCategory} />
      </FormField>

      <FormField label="Size">
        <ChipRow options={SIZE_SECTIONS} selected={size} onSelect={setSize} />
      </FormField>

      <SwitchRow label="Track duration / timer" value={tracksDuration} onValueChange={setTracksDuration} />

      {tracksDuration && (
        <FormField label="Expected duration (optional)">
          <DurationPicker totalMinutes={expectedMinutes} onChange={setExpectedMinutes} />
        </FormField>
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
