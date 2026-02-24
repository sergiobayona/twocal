import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createCalendarDate,
  today,
  calendarDateToNative,
  nativeToCalendarDate,
  addDays,
  addMonths,
  daysInMonth,
  isSameDay,
  compareDates,
  isBefore,
  isAfter,
  isBetween,
  isWithinBounds,
  ensureStartBeforeEnd,
  buildCalendarMonth,
  formatMonthYear,
  formatDate,
  dayNames,
  calendarDateToString,
  parseCalendarDateString,
} from '../src/calendar';

describe('createCalendarDate', () => {
  it('creates an immutable date object', () => {
    const date = createCalendarDate(2026, 3, 15);
    expect(date).toEqual({ year: 2026, month: 3, day: 15 });
  });
});

describe('today', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23)); // Feb 23, 2026
    expect(today()).toEqual({ year: 2026, month: 2, day: 23 });
  });
});

describe('calendarDateToNative / nativeToCalendarDate', () => {
  it('round-trips correctly', () => {
    const date = createCalendarDate(2026, 12, 31);
    const native = calendarDateToNative(date);
    expect(native.getFullYear()).toBe(2026);
    expect(native.getMonth()).toBe(11);
    expect(native.getDate()).toBe(31);
    expect(nativeToCalendarDate(native)).toEqual(date);
  });
});

describe('addDays', () => {
  it('adds days forward', () => {
    expect(addDays(createCalendarDate(2026, 1, 30), 3)).toEqual({ year: 2026, month: 2, day: 2 });
  });

  it('subtracts days', () => {
    expect(addDays(createCalendarDate(2026, 3, 1), -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });
});

describe('addMonths', () => {
  it('advances months', () => {
    expect(addMonths(createCalendarDate(2026, 11, 15), 3)).toEqual({ year: 2027, month: 2, day: 15 });
  });

  it('handles month-end clamping', () => {
    // Jan 31 + 1 month = Feb 28 (2026 is not a leap year)
    const result = addMonths(createCalendarDate(2026, 1, 31), 1);
    expect(result.month).toBe(2);
    expect(result.day).toBe(28);
  });
});

describe('daysInMonth', () => {
  it('returns 28 for Feb 2026', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it('returns 29 for Feb 2024 (leap year)', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
  });
});

describe('comparison functions', () => {
  const jan1 = createCalendarDate(2026, 1, 1);
  const jan15 = createCalendarDate(2026, 1, 15);
  const feb1 = createCalendarDate(2026, 2, 1);

  it('isSameDay detects identical dates', () => {
    expect(isSameDay(jan1, createCalendarDate(2026, 1, 1))).toBe(true);
    expect(isSameDay(jan1, jan15)).toBe(false);
  });

  it('compareDates returns negative/zero/positive', () => {
    expect(compareDates(jan1, jan15)).toBeLessThan(0);
    expect(compareDates(jan1, jan1)).toBe(0);
    expect(compareDates(feb1, jan1)).toBeGreaterThan(0);
  });

  it('isBefore / isAfter', () => {
    expect(isBefore(jan1, jan15)).toBe(true);
    expect(isBefore(jan15, jan1)).toBe(false);
    expect(isAfter(feb1, jan15)).toBe(true);
  });

  it('isBetween is inclusive', () => {
    expect(isBetween(jan15, jan1, feb1)).toBe(true);
    expect(isBetween(jan1, jan1, feb1)).toBe(true);
    expect(isBetween(feb1, jan1, feb1)).toBe(true);
  });
});

describe('isWithinBounds', () => {
  const date = createCalendarDate(2026, 6, 15);

  it('returns true when no bounds', () => {
    expect(isWithinBounds(date)).toBe(true);
  });

  it('respects min bound', () => {
    expect(isWithinBounds(date, createCalendarDate(2026, 7, 1))).toBe(false);
    expect(isWithinBounds(date, createCalendarDate(2026, 6, 1))).toBe(true);
  });

  it('respects max bound', () => {
    expect(isWithinBounds(date, undefined, createCalendarDate(2026, 5, 1))).toBe(false);
    expect(isWithinBounds(date, undefined, createCalendarDate(2026, 12, 31))).toBe(true);
  });
});

describe('ensureStartBeforeEnd', () => {
  it('keeps order when already correct', () => {
    const jan = createCalendarDate(2026, 1, 1);
    const feb = createCalendarDate(2026, 2, 1);
    expect(ensureStartBeforeEnd(jan, feb)).toEqual({ start: jan, end: feb });
  });

  it('swaps when reversed', () => {
    const jan = createCalendarDate(2026, 1, 1);
    const feb = createCalendarDate(2026, 2, 1);
    expect(ensureStartBeforeEnd(feb, jan)).toEqual({ start: jan, end: feb });
  });
});

describe('buildCalendarMonth', () => {
  it('builds February 2026 starting Sunday', () => {
    const month = buildCalendarMonth(2026, 2, 0);
    expect(month.year).toBe(2026);
    expect(month.month).toBe(2);
    expect(month.weeks.length).toBe(6); // always 6 rows

    // Feb 1, 2026 is a Sunday -> first cell should be Feb 1
    const firstWeek = month.weeks[0]!;
    expect(firstWeek[0]).toEqual({ year: 2026, month: 2, day: 1 });

    // Feb 28 is the last day
    const allDays = month.weeks.flat().filter(Boolean);
    expect(allDays.length).toBe(28);
  });

  it('builds March 2026 starting Monday', () => {
    const month = buildCalendarMonth(2026, 3, 1);
    expect(month.weeks.length).toBe(6);

    // March 1, 2026 is a Sunday. With Monday start, Sunday is the 7th column.
    // So there should be 6 leading blanks before March 1.
    const firstWeek = month.weeks[0]!;
    expect(firstWeek[0]).toBeNull();
    expect(firstWeek[6]).toEqual({ year: 2026, month: 3, day: 1 });
  });
});

describe('formatMonthYear', () => {
  it('formats in English', () => {
    const result = formatMonthYear(2026, 2, 'en-US');
    expect(result).toContain('February');
    expect(result).toContain('2026');
  });

  it('falls back for invalid locale strings', () => {
    const result = formatMonthYear(2026, 2, 'en_US');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDate', () => {
  it('formats a specific date', () => {
    const result = formatDate(createCalendarDate(2026, 2, 23), 'en-US');
    expect(result).toContain('Feb');
    expect(result).toContain('23');
    expect(result).toContain('2026');
  });

  it('falls back for invalid locale strings', () => {
    expect(() => formatDate(createCalendarDate(2026, 2, 23), 'en_US')).not.toThrow();
  });
});

describe('dayNames', () => {
  it('returns 7 names starting from Sunday', () => {
    const names = dayNames('en-US', 0);
    expect(names.length).toBe(7);
    expect(names[0]).toContain('Sun');
  });

  it('returns 7 names starting from Monday', () => {
    const names = dayNames('en-US', 1);
    expect(names.length).toBe(7);
    expect(names[0]).toContain('Mon');
  });

  it('falls back for invalid locale strings', () => {
    const names = dayNames('en_US', 0);
    expect(names.length).toBe(7);
  });
});

describe('calendarDateToString / parseCalendarDateString', () => {
  it('round-trips correctly', () => {
    const date = createCalendarDate(2026, 2, 5);
    const str = calendarDateToString(date);
    expect(str).toBe('2026-02-05');
    expect(parseCalendarDateString(str)).toEqual(date);
  });

  it('returns null for invalid strings', () => {
    expect(parseCalendarDateString('invalid')).toBeNull();
    expect(parseCalendarDateString('2026-13')).toBeNull();
    expect(parseCalendarDateString('abc-de-fg')).toBeNull();
  });
});
