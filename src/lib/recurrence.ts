import { weekdayForKey } from '@/lib/day';

export type RecurrenceRule =
  | { freq: 'daily' }
  | { freq: 'weekly'; daysOfWeek: number[] } // 0 = Sunday .. 6 = Saturday
  | { freq: 'monthly'; dayOfMonth: number }; // 1-31

export function matchesRecurrence(rule: RecurrenceRule, dateKey: string): boolean {
  switch (rule.freq) {
    case 'daily':
      return true;
    case 'weekly':
      return rule.daysOfWeek.includes(weekdayForKey(dateKey));
    case 'monthly':
      return Number(dateKey.split('-')[2]) === rule.dayOfMonth;
  }
}
