import type { RecurrenceRule } from '@/lib/recurrence';
import type { Task } from '@/db/types';

import { ChipRow, FormField, FormTextInput } from '@/features/shared/form-sheet';

export type RecurrenceFreq = 'once' | 'daily' | 'weekly' | 'monthly';

/** The in-progress form state for a recurrence choice, before it's turned into a rule. */
export interface RecurrenceDraft {
  freq: RecurrenceFreq;
  weekDays: number[]; // 0 = Sunday .. 6 = Saturday
  monthDay: string; // kept as text while editing
}

const WEEKDAYS = [
  { key: 0, label: 'Sun' },
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
];

export function draftFromTask(task?: Task): RecurrenceDraft {
  const rule = task?.recurrenceRule ?? null;
  return {
    freq: !task || !task.recurring || !rule ? 'once' : rule.freq,
    weekDays: rule?.freq === 'weekly' ? rule.daysOfWeek : [],
    monthDay: rule?.freq === 'monthly' ? String(rule.dayOfMonth) : '1',
  };
}

export function ruleFromDraft(draft: RecurrenceDraft): RecurrenceRule | null {
  switch (draft.freq) {
    case 'once':
      return null;
    case 'daily':
      return { freq: 'daily' };
    case 'weekly':
      return { freq: 'weekly', daysOfWeek: draft.weekDays };
    case 'monthly':
      return { freq: 'monthly', dayOfMonth: Number(draft.monthDay) || 1 };
  }
}

export function isDraftValid(draft: RecurrenceDraft): boolean {
  return draft.freq !== 'weekly' || draft.weekDays.length > 0;
}

/** Frequency chips plus the weekday/day-of-month follow-ups when relevant. */
export function RecurrencePicker({
  draft,
  onChange,
  onceLabel = 'One-time',
}: {
  draft: RecurrenceDraft;
  onChange: (draft: RecurrenceDraft) => void;
  onceLabel?: string;
}) {
  const freqOptions = [
    { key: 'once' as const, label: onceLabel },
    { key: 'daily' as const, label: 'Daily' },
    { key: 'weekly' as const, label: 'Weekly' },
    { key: 'monthly' as const, label: 'Monthly' },
  ];

  const toggleWeekDay = (day: number) => {
    const weekDays = draft.weekDays.includes(day)
      ? draft.weekDays.filter((d) => d !== day)
      : [...draft.weekDays, day];
    onChange({ ...draft, weekDays });
  };

  return (
    <>
      <FormField label="Repeats">
        <ChipRow options={freqOptions} selected={draft.freq} onSelect={(freq) => onChange({ ...draft, freq })} />
      </FormField>

      {draft.freq === 'weekly' && (
        <ChipRow options={WEEKDAYS} selected={(day) => draft.weekDays.includes(day)} onSelect={toggleWeekDay} />
      )}

      {draft.freq === 'monthly' && (
        <FormField label="Day of month">
          <FormTextInput
            value={draft.monthDay}
            onChangeText={(monthDay) => onChange({ ...draft, monthDay })}
            keyboardType="number-pad"
          />
        </FormField>
      )}
    </>
  );
}
