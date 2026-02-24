import { describe, it, expect } from 'vitest';
import { gridCellAttributes, dialogAttributes, calendarGridAttributes } from '../src/aria';
import { createCalendarDate } from '../src/calendar';
import { resolveTranslations } from '../src/i18n';
import type { TwoCalState } from '../src/types';

function stateWith(overrides: Partial<TwoCalState>): TwoCalState {
  return {
    isOpen: true,
    displayMonth: createCalendarDate(2026, 2, 1),
    selectionPhase: 'idle',
    rangeStart: null,
    rangeEnd: null,
    hoveredDate: null,
    activePreset: null,
    focusedDate: null,
    ...overrides,
  };
}

describe('gridCellAttributes', () => {
  const date = createCalendarDate(2026, 2, 15);

  it('returns role=gridcell', () => {
    const attrs = gridCellAttributes(date, stateWith({}), false);
    expect(attrs.role).toBe('gridcell');
  });

  it('marks selected when date matches rangeStart', () => {
    const state = stateWith({ rangeStart: date });
    const attrs = gridCellAttributes(date, state, false);
    expect(attrs['aria-selected']).toBe('true');
  });

  it('marks selected when date matches rangeEnd', () => {
    const state = stateWith({ rangeEnd: date });
    const attrs = gridCellAttributes(date, state, false);
    expect(attrs['aria-selected']).toBe('true');
  });

  it('does not mark selected for non-matching dates', () => {
    const attrs = gridCellAttributes(date, stateWith({}), false);
    expect(attrs['aria-selected']).toBeUndefined();
  });

  it('marks disabled', () => {
    const attrs = gridCellAttributes(date, stateWith({}), true);
    expect(attrs['aria-disabled']).toBe('true');
  });

  it('sets tabindex 0 for focused date', () => {
    const state = stateWith({ focusedDate: date });
    const attrs = gridCellAttributes(date, state, false);
    expect(attrs.tabindex).toBe('0');
  });

  it('sets tabindex -1 for non-focused date', () => {
    const attrs = gridCellAttributes(date, stateWith({}), false);
    expect(attrs.tabindex).toBe('-1');
  });
});

describe('dialogAttributes', () => {
  it('returns dialog role with aria-modal', () => {
    const attrs = dialogAttributes(resolveTranslations('en-US'));
    expect(attrs.role).toBe('dialog');
    expect(attrs['aria-modal']).toBe('true');
    expect(attrs['aria-label']).toBe('Choose date range');
  });

  it('returns translated aria-label for Spanish', () => {
    const attrs = dialogAttributes(resolveTranslations('es'));
    expect(attrs['aria-label']).toBe('Elegir rango de fechas');
  });
});

describe('calendarGridAttributes', () => {
  it('returns grid role with labelledby', () => {
    const attrs = calendarGridAttributes('month-label-1');
    expect(attrs.role).toBe('grid');
    expect(attrs['aria-labelledby']).toBe('month-label-1');
  });
});
