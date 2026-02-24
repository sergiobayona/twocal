import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TwoCal } from '../src/twocal';
import { createCalendarDate } from '../src/calendar';
import type { DateRange } from '../src/types';

let trigger: HTMLElement;
let onRangeSelect: ReturnType<typeof vi.fn>;
let picker: TwoCal;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 1, 23)); // Feb 23, 2026

  trigger = document.createElement('button');
  trigger.textContent = 'Pick dates';
  document.body.appendChild(trigger);

  onRangeSelect = vi.fn();
});

afterEach(() => {
  picker?.destroy();
  trigger?.remove();
  vi.useRealTimers();
});

function createPicker(overrides = {}) {
  picker = new TwoCal({
    trigger,
    onRangeSelect,
    ...overrides,
  });
  return picker;
}

describe('construction', () => {
  it('throws if trigger is missing', () => {
    expect(() => new TwoCal({ trigger: null as never, onRangeSelect })).toThrow(
      'trigger element is required',
    );
  });

  it('throws if onRangeSelect is missing', () => {
    expect(() => new TwoCal({ trigger, onRangeSelect: null as never })).toThrow(
      'onRangeSelect callback is required',
    );
  });

  it('creates an instance without errors', () => {
    createPicker();
    expect(picker).toBeDefined();
  });

  it('injects styles into document head', () => {
    createPicker();
    const styles = document.querySelectorAll('style[data-twocal]');
    expect(styles.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back safely for invalid locale strings', () => {
    expect(() => createPicker({ locale: 'en_US' })).not.toThrow();
  });
});

describe('open / close', () => {
  it('opens popup on trigger click', () => {
    createPicker();
    trigger.click();
    const popup = document.querySelector('[role="dialog"]');
    expect(popup).not.toBeNull();
  });

  it('opens popup via open() method', () => {
    createPicker();
    picker.open();
    const popup = document.querySelector('[role="dialog"]');
    expect(popup).not.toBeNull();
  });

  it('closes popup via close() method', () => {
    createPicker();
    picker.open();
    picker.close();
    const popup = document.querySelector('[role="dialog"]');
    expect(popup).toBeNull();
  });

  it('calls onOpen callback', () => {
    const onOpen = vi.fn();
    createPicker({ onOpen });
    picker.open();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('calls onClose callback', () => {
    const onClose = vi.fn();
    createPicker({ onClose });
    picker.open();
    picker.close();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets exactly one focused day for keyboard navigation', () => {
    createPicker();
    picker.open();
    const focusedDays = document.querySelectorAll('[data-tc-date][tabindex="0"]');
    expect(focusedDays).toHaveLength(1);
  });
});

describe('range selection', () => {
  it('selects a date range by clicking two dates and applying', () => {
    createPicker();
    picker.open();

    // Click first date
    const firstDay = document.querySelector('[data-tc-date="2026-02-10"]') as HTMLElement;
    expect(firstDay).not.toBeNull();
    firstDay.click();

    // Click second date
    const secondDay = document.querySelector('[data-tc-date="2026-02-20"]') as HTMLElement;
    expect(secondDay).not.toBeNull();
    secondDay.click();

    // Click apply
    const applyBtn = document.querySelector('[data-tc-action="apply"]') as HTMLElement;
    applyBtn.click();

    expect(onRangeSelect).toHaveBeenCalledOnce();
    const range: DateRange = onRangeSelect.mock.calls[0]![0];
    expect(range.start).toEqual({ year: 2026, month: 2, day: 10 });
    expect(range.end).toEqual({ year: 2026, month: 2, day: 20 });
  });

  it('highlights range between start and end', () => {
    createPicker();
    picker.open();

    const startDay = document.querySelector('[data-tc-date="2026-02-10"]') as HTMLElement;
    startDay.click();

    const endDay = document.querySelector('[data-tc-date="2026-02-15"]') as HTMLElement;
    endDay.click();

    const midDay = document.querySelector('[data-tc-date="2026-02-12"]') as HTMLElement;
    expect(midDay.className).toContain('in-range');
  });

  it('reverts range on cancel', () => {
    const start = createCalendarDate(2026, 2, 1);
    const end = createCalendarDate(2026, 2, 5);
    createPicker({ initialRange: { start, end } });

    picker.open();

    // Start new selection
    const day = document.querySelector('[data-tc-date="2026-02-20"]') as HTMLElement;
    day.click();

    // Cancel
    const cancelBtn = document.querySelector('[data-tc-action="cancel"]') as HTMLElement;
    cancelBtn.click();

    expect(onRangeSelect).not.toHaveBeenCalled();
    expect(picker.getRange()).toEqual({ start, end });
  });
});

describe('presets', () => {
  it('selects a preset and applies', () => {
    createPicker();
    picker.open();

    const todayPreset = document.querySelector('[data-tc-preset="Today"]') as HTMLElement;
    expect(todayPreset).not.toBeNull();
    todayPreset.click();

    const applyBtn = document.querySelector('[data-tc-action="apply"]') as HTMLElement;
    applyBtn.click();

    expect(onRangeSelect).toHaveBeenCalledOnce();
    const range: DateRange = onRangeSelect.mock.calls[0]![0];
    expect(range.start).toEqual({ year: 2026, month: 2, day: 23 });
    expect(range.end).toEqual({ year: 2026, month: 2, day: 23 });
  });

  it('clamps preset selection to maxDate bounds', () => {
    createPicker({ maxDate: createCalendarDate(2026, 2, 20) });
    picker.open();

    const todayPreset = document.querySelector('[data-tc-preset="Today"]') as HTMLElement;
    todayPreset.click();

    const applyBtn = document.querySelector('[data-tc-action="apply"]') as HTMLElement;
    applyBtn.click();

    expect(onRangeSelect).toHaveBeenCalledOnce();
    const range: DateRange = onRangeSelect.mock.calls[0]![0];
    expect(range).toEqual({
      start: createCalendarDate(2026, 2, 20),
      end: createCalendarDate(2026, 2, 20),
    });
  });
});

describe('month navigation', () => {
  it('navigates to next month', () => {
    createPicker();
    picker.open();

    const nextBtn = document.querySelector('[data-tc-action="next-month"]') as HTMLElement;
    nextBtn.click();

    const titles = document.querySelectorAll('[aria-live="polite"]');
    // After navigation: left should be March, right should be April
    expect(titles[0]?.textContent).toContain('March');
    expect(titles[1]?.textContent).toContain('April');
  });

  it('navigates to previous month', () => {
    createPicker();
    picker.open();

    const prevBtn = document.querySelector('[data-tc-action="prev-month"]') as HTMLElement;
    prevBtn.click();

    const titles = document.querySelectorAll('[aria-live="polite"]');
    expect(titles[0]?.textContent).toContain('January');
    expect(titles[1]?.textContent).toContain('February');
  });
});

describe('outside click', () => {
  it('closes popup on outside click', () => {
    createPicker();
    picker.open();

    document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));

    const popup = document.querySelector('[role="dialog"]');
    expect(popup).toBeNull();
  });
});

describe('getRange / setRange', () => {
  it('returns null before any selection', () => {
    createPicker();
    expect(picker.getRange()).toBeNull();
  });

  it('returns initial range when provided', () => {
    const range = {
      start: createCalendarDate(2026, 2, 1),
      end: createCalendarDate(2026, 2, 10),
    };
    createPicker({ initialRange: range });
    expect(picker.getRange()).toEqual(range);
  });

  it('updates range imperatively', () => {
    createPicker();
    const range = {
      start: createCalendarDate(2026, 3, 1),
      end: createCalendarDate(2026, 3, 15),
    };
    picker.setRange(range);
    expect(picker.getRange()).toEqual(range);
  });

  it('normalizes reversed ranges in setRange', () => {
    createPicker();
    picker.setRange({
      start: createCalendarDate(2026, 3, 15),
      end: createCalendarDate(2026, 3, 1),
    });
    expect(picker.getRange()).toEqual({
      start: createCalendarDate(2026, 3, 1),
      end: createCalendarDate(2026, 3, 15),
    });
  });

  it('clamps setRange to min/max bounds', () => {
    createPicker({
      minDate: createCalendarDate(2026, 2, 10),
      maxDate: createCalendarDate(2026, 2, 20),
    });
    picker.setRange({
      start: createCalendarDate(2026, 2, 1),
      end: createCalendarDate(2026, 2, 28),
    });
    expect(picker.getRange()).toEqual({
      start: createCalendarDate(2026, 2, 10),
      end: createCalendarDate(2026, 2, 20),
    });
  });

  it('rerenders popup when setRange is called while open', () => {
    createPicker();
    picker.open();
    picker.setRange({
      start: createCalendarDate(2026, 3, 1),
      end: createCalendarDate(2026, 3, 15),
    });
    const startDay = document.querySelector('[data-tc-date="2026-03-01"]') as HTMLElement;
    const endDay = document.querySelector('[data-tc-date="2026-03-15"]') as HTMLElement;
    expect(startDay.className).toContain('start');
    expect(endDay.className).toContain('end');
  });
});

describe('destroy', () => {
  it('removes styles and popup from DOM', () => {
    createPicker();
    picker.open();
    picker.destroy();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('throws on method calls after destroy', () => {
    createPicker();
    picker.destroy();
    expect(() => picker.open()).toThrow('instance has been destroyed');
    expect(() => picker.getRange()).toThrow('instance has been destroyed');
  });

  it('is safe to call destroy multiple times', () => {
    createPicker();
    picker.destroy();
    expect(() => picker.destroy()).not.toThrow();
  });
});
