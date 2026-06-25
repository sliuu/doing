import type { Task, TaskInstance } from '@/db/types';

export interface SelfCareItem {
  task: Task;
  instance: TaskInstance;
}

export type SelfCareSection = 'fun' | 'calming' | 'gratitude' | 'cleaning' | 'energizing';

export const SELF_CARE_SECTIONS: { key: SelfCareSection; label: string }[] = [
  { key: 'fun', label: 'fun' },
  { key: 'calming', label: 'calming' },
  { key: 'gratitude', label: 'gratitude' },
  { key: 'cleaning', label: 'cleaning' },
  { key: 'energizing', label: 'energizing' },
];

/** Falls back to "fun" for any item missing or predating sections. */
export function sectionFromValue(section: string | null): SelfCareSection {
  return SELF_CARE_SECTIONS.some((s) => s.key === section) ? (section as SelfCareSection) : 'fun';
}

export function sectionForItem(item: SelfCareItem): SelfCareSection {
  return sectionFromValue(item.task.selfCareSection);
}
