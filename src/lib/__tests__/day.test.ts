import { addDaysToKey, dateKeyFor, todayKey, weekdayForKey } from '@/lib/day';

describe('dateKeyFor', () => {
  const dayStartHour = 4;

  it('keeps the calendar date for times after the day-start hour', () => {
    expect(dateKeyFor(new Date(2026, 0, 15, 10, 0), dayStartHour)).toBe('2026-01-15');
  });

  it('rolls a time before the day-start hour back to the previous day', () => {
    expect(dateKeyFor(new Date(2026, 0, 15, 2, 0), dayStartHour)).toBe('2026-01-14');
  });

  it('treats exactly the day-start hour as the new day', () => {
    expect(dateKeyFor(new Date(2026, 0, 15, 4, 0), dayStartHour)).toBe('2026-01-15');
  });

  it('respects a custom day-start hour', () => {
    expect(dateKeyFor(new Date(2026, 0, 15, 1, 0), 0)).toBe('2026-01-15');
    expect(dateKeyFor(new Date(2026, 0, 15, 23, 0), 0)).toBe('2026-01-15');
  });
});

describe('todayKey', () => {
  it('matches dateKeyFor(new Date(), dayStartHour)', () => {
    expect(todayKey(4)).toBe(dateKeyFor(new Date(), 4));
  });
});

describe('weekdayForKey', () => {
  it('returns the correct day of week (0 = Sunday)', () => {
    expect(weekdayForKey('2026-06-21')).toBe(0); // Sunday
    expect(weekdayForKey('2026-06-22')).toBe(1); // Monday
  });
});

describe('addDaysToKey', () => {
  it('advances within a month', () => {
    expect(addDaysToKey('2026-06-19', 1)).toBe('2026-06-20');
  });

  it('rolls over a month boundary', () => {
    expect(addDaysToKey('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('rolls over a year boundary', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('supports going backwards', () => {
    expect(addDaysToKey('2026-06-01', -1)).toBe('2026-05-31');
  });
});
