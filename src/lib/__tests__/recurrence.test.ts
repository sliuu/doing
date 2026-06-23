import { matchesRecurrence } from '@/lib/recurrence';

describe('matchesRecurrence', () => {
  it('daily matches every date', () => {
    expect(matchesRecurrence({ freq: 'daily' }, '2026-06-19')).toBe(true);
    expect(matchesRecurrence({ freq: 'daily' }, '2026-12-25')).toBe(true);
  });

  describe('weekly', () => {
    it('matches a date that falls on one of the configured weekdays', () => {
      // 2026-06-19 is a Friday (5)
      expect(matchesRecurrence({ freq: 'weekly', daysOfWeek: [5] }, '2026-06-19')).toBe(true);
    });

    it('does not match a date on a different weekday', () => {
      expect(matchesRecurrence({ freq: 'weekly', daysOfWeek: [1] }, '2026-06-19')).toBe(false);
    });

    it('supports multiple days of the week', () => {
      const rule = { freq: 'weekly' as const, daysOfWeek: [0, 5] };
      expect(matchesRecurrence(rule, '2026-06-19')).toBe(true); // Fri
      expect(matchesRecurrence(rule, '2026-06-21')).toBe(true); // Sun
      expect(matchesRecurrence(rule, '2026-06-22')).toBe(false); // Mon
    });
  });

  describe('monthly', () => {
    it('matches only the configured day of month', () => {
      expect(matchesRecurrence({ freq: 'monthly', dayOfMonth: 19 }, '2026-06-19')).toBe(true);
      expect(matchesRecurrence({ freq: 'monthly', dayOfMonth: 19 }, '2026-06-20')).toBe(false);
    });

    it('matches that day of month across different months', () => {
      const rule = { freq: 'monthly' as const, dayOfMonth: 1 };
      expect(matchesRecurrence(rule, '2026-01-01')).toBe(true);
      expect(matchesRecurrence(rule, '2026-07-01')).toBe(true);
    });
  });
});
