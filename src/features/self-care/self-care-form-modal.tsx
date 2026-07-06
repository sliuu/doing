import { useState } from 'react';

import type { NewTaskInput } from '@/db/tasks';
import type { Task } from '@/db/types';
import { ThemedText } from '@/components/themed-text';
import { ChipRow, FormActions, FormField, FormSheet, FormTextInput } from '@/features/shared/form-sheet';
import { draftFromTask, isDraftValid, RecurrencePicker, ruleFromDraft } from '@/features/shared/recurrence-picker';

import { SELF_CARE_SECTIONS, SelfCareSection, sectionFromValue } from '@/features/self-care/types';

/** Create/edit form for a self-care item. Pass `task` to edit, omit it to create. */
export function SelfCareFormModal({
  task,
  defaultSection = 'fun',
  onCancel,
  onSubmit,
  onDelete,
}: {
  task?: Task;
  defaultSection?: SelfCareSection;
  onCancel: () => void;
  onSubmit: (input: NewTaskInput) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [section, setSection] = useState<SelfCareSection>(
    task ? sectionFromValue(task.selfCareSection) : defaultSection
  );
  const [recurrence, setRecurrence] = useState(draftFromTask(task));

  const canSubmit = title.trim() !== '' && isDraftValid(recurrence);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      category: 'self-care',
      selfCareSection: section,
      recurring: recurrence.freq !== 'once',
      recurrenceRule: ruleFromDraft(recurrence),
    });
  };

  return (
    <FormSheet onClose={onCancel}>
      <ThemedText type="subtitle">{task ? 'Edit self-care' : 'New self-care'}</ThemedText>

      <FormField label="Title">
        <FormTextInput value={title} onChangeText={setTitle} placeholder="A small kind thing to do" />
      </FormField>

      <FormField label="Section">
        <ChipRow options={SELF_CARE_SECTIONS} selected={section} onSelect={setSection} />
      </FormField>

      <RecurrencePicker draft={recurrence} onChange={setRecurrence} onceLabel="Just today" />

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
