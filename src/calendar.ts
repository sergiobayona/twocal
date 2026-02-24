import type { CalendarDate, CalendarMonth, DateRange } from './types';

export function createCalendarDate(year: number, month: number, day: number): CalendarDate {
  return { year, month, day };
}

export function today(): CalendarDate {
  const now = new Date();
  return createCalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function calendarDateToNative(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}

export function nativeToCalendarDate(date: Date): CalendarDate {
  return createCalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const native = calendarDateToNative(date);
  native.setDate(native.getDate() + days);
  return nativeToCalendarDate(native);
}

export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const targetMonth = date.month - 1 + months;
  const targetYear = date.year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12; // handle negatives
  const maxDay = daysInMonth(targetYear, normalizedMonth + 1);
  const clampedDay = Math.min(date.day, maxDay);
  return createCalendarDate(targetYear, normalizedMonth + 1, clampedDay);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isSameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isBefore(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) < 0;
}

export function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) > 0;
}

export function isBetween(date: CalendarDate, start: CalendarDate, end: CalendarDate): boolean {
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0;
}

export function isWithinBounds(
  date: CalendarDate,
  min?: CalendarDate,
  max?: CalendarDate,
): boolean {
  if (min && isBefore(date, min)) return false;
  if (max && isAfter(date, max)) return false;
  return true;
}

export function ensureStartBeforeEnd(a: CalendarDate, b: CalendarDate): DateRange {
  if (isAfter(a, b)) return { start: b, end: a };
  return { start: a, end: b };
}

export function buildCalendarMonth(
  year: number,
  month: number,
  firstDayOfWeek: 0 | 1,
): CalendarMonth {
  const totalDays = daysInMonth(year, month);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDow = firstOfMonth.getDay(); // 0=Sunday

  // How many blank cells before the 1st
  const leadingBlanks = (startDow - firstDayOfWeek + 7) % 7;

  const weeks: (CalendarDate | null)[][] = [];
  let currentWeek: (CalendarDate | null)[] = [];

  for (let i = 0; i < leadingBlanks; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(createCalendarDate(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing blanks
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Ensure exactly 6 rows for consistent layout
  while (weeks.length < 6) {
    weeks.push([null, null, null, null, null, null, null]);
  }

  return { year, month, weeks };
}

export function formatMonthYear(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

export function formatDate(date: CalendarDate, locale: string): string {
  const native = calendarDateToNative(date);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(native);
}

export function dayNames(locale: string, firstDayOfWeek: 0 | 1): string[] {
  const names: string[] = [];
  // Jan 4, 2024 is a Thursday; Jan 7 is Sunday, Jan 8 is Monday
  const baseSunday = new Date(2024, 0, 7); // known Sunday
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseSunday);
    d.setDate(baseSunday.getDate() + ((i + firstDayOfWeek) % 7));
    names.push(formatter.format(d));
  }

  return names;
}

export function calendarDateToString(date: CalendarDate): string {
  const y = String(date.year);
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseCalendarDateString(str: string): CalendarDate | null {
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const [yearStr, monthStr, dayStr] = parts;
  if (!yearStr || !monthStr || !dayStr) return null;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return createCalendarDate(year, month, day);
}
