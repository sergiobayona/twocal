import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from '../src/state';
import { createCalendarDate } from '../src/calendar';
import type { TwoCalState } from '../src/types';

function stateWith(overrides: Partial<TwoCalState>): TwoCalState {
  return {
    isOpen: false,
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

describe('createInitialState', () => {
  it('starts closed with idle selection', () => {
    const state = createInitialState({});
    expect(state.isOpen).toBe(false);
    expect(state.selectionPhase).toBe('idle');
    expect(state.rangeStart).toBeNull();
    expect(state.rangeEnd).toBeNull();
  });

  it('uses initial range when provided', () => {
    const start = createCalendarDate(2026, 3, 1);
    const end = createCalendarDate(2026, 3, 15);
    const state = createInitialState({ initialRange: { start, end } });
    expect(state.rangeStart).toEqual(start);
    expect(state.rangeEnd).toEqual(end);
    expect(state.selectionPhase).toBe('range_complete');
    expect(state.displayMonth.month).toBe(3);
  });
});

describe('reduce OPEN / CLOSE', () => {
  it('opens the popup', () => {
    const state = stateWith({ isOpen: false });
    const next = reduce(state, { type: 'OPEN' });
    expect(next.isOpen).toBe(true);
  });

  it('shows the range start month when opening with a range', () => {
    const state = stateWith({
      rangeStart: createCalendarDate(2026, 5, 10),
      displayMonth: createCalendarDate(2026, 2, 1),
    });
    const next = reduce(state, { type: 'OPEN' });
    expect(next.displayMonth.month).toBe(5);
  });

  it('closes and clears transient state', () => {
    const state = stateWith({
      isOpen: true,
      hoveredDate: createCalendarDate(2026, 2, 10),
      focusedDate: createCalendarDate(2026, 2, 10),
    });
    const next = reduce(state, { type: 'CLOSE' });
    expect(next.isOpen).toBe(false);
    expect(next.hoveredDate).toBeNull();
    expect(next.focusedDate).toBeNull();
  });
});

describe('reduce SELECT_DATE — two-click flow', () => {
  it('selects a start date from idle', () => {
    const state = stateWith({ isOpen: true });
    const date = createCalendarDate(2026, 2, 10);
    const next = reduce(state, { type: 'SELECT_DATE', date });
    expect(next.selectionPhase).toBe('start_selected');
    expect(next.rangeStart).toEqual(date);
    expect(next.rangeEnd).toBeNull();
  });

  it('completes range on second click', () => {
    const start = createCalendarDate(2026, 2, 10);
    const state = stateWith({
      isOpen: true,
      selectionPhase: 'start_selected',
      rangeStart: start,
    });
    const end = createCalendarDate(2026, 2, 20);
    const next = reduce(state, { type: 'SELECT_DATE', date: end });
    expect(next.selectionPhase).toBe('range_complete');
    expect(next.rangeStart).toEqual(start);
    expect(next.rangeEnd).toEqual(end);
  });

  it('normalizes order when end is before start', () => {
    const start = createCalendarDate(2026, 2, 20);
    const state = stateWith({
      isOpen: true,
      selectionPhase: 'start_selected',
      rangeStart: start,
    });
    const earlier = createCalendarDate(2026, 2, 5);
    const next = reduce(state, { type: 'SELECT_DATE', date: earlier });
    expect(next.rangeStart).toEqual(earlier);
    expect(next.rangeEnd).toEqual(start);
  });

  it('starts new selection when clicking after range is complete', () => {
    const state = stateWith({
      isOpen: true,
      selectionPhase: 'range_complete',
      rangeStart: createCalendarDate(2026, 2, 10),
      rangeEnd: createCalendarDate(2026, 2, 20),
    });
    const newDate = createCalendarDate(2026, 3, 5);
    const next = reduce(state, { type: 'SELECT_DATE', date: newDate });
    expect(next.selectionPhase).toBe('start_selected');
    expect(next.rangeStart).toEqual(newDate);
    expect(next.rangeEnd).toBeNull();
  });

  it('deselects when clicking start date of completed range', () => {
    const start = createCalendarDate(2026, 2, 10);
    const state = stateWith({
      isOpen: true,
      selectionPhase: 'range_complete',
      rangeStart: start,
      rangeEnd: createCalendarDate(2026, 2, 20),
    });
    const next = reduce(state, { type: 'SELECT_DATE', date: start });
    expect(next.selectionPhase).toBe('idle');
    expect(next.rangeStart).toBeNull();
    expect(next.rangeEnd).toBeNull();
  });
});

describe('reduce HOVER_DATE / CLEAR_HOVER', () => {
  it('sets hovered date', () => {
    const state = stateWith({ isOpen: true });
    const date = createCalendarDate(2026, 2, 15);
    const next = reduce(state, { type: 'HOVER_DATE', date });
    expect(next.hoveredDate).toEqual(date);
  });

  it('clears hovered date', () => {
    const state = stateWith({
      isOpen: true,
      hoveredDate: createCalendarDate(2026, 2, 15),
    });
    const next = reduce(state, { type: 'CLEAR_HOVER' });
    expect(next.hoveredDate).toBeNull();
  });
});

describe('reduce NAVIGATE_MONTH', () => {
  it('advances display month', () => {
    const state = stateWith({ displayMonth: createCalendarDate(2026, 2, 1) });
    const next = reduce(state, { type: 'NAVIGATE_MONTH', delta: 1 });
    expect(next.displayMonth.month).toBe(3);
  });

  it('goes back across year boundary', () => {
    const state = stateWith({ displayMonth: createCalendarDate(2026, 1, 1) });
    const next = reduce(state, { type: 'NAVIGATE_MONTH', delta: -1 });
    expect(next.displayMonth.year).toBe(2025);
    expect(next.displayMonth.month).toBe(12);
  });
});

describe('reduce SELECT_PRESET', () => {
  it('sets range from preset and shows start month', () => {
    const state = stateWith({ isOpen: true });
    const range = {
      start: createCalendarDate(2026, 1, 24),
      end: createCalendarDate(2026, 2, 23),
    };
    const next = reduce(state, { type: 'SELECT_PRESET', preset: 'Last 30 Days', range });
    expect(next.rangeStart).toEqual(range.start);
    expect(next.rangeEnd).toEqual(range.end);
    expect(next.selectionPhase).toBe('range_complete');
    expect(next.activePreset).toBe('Last 30 Days');
    expect(next.displayMonth.month).toBe(1);
  });
});

describe('reduce APPLY', () => {
  it('closes when range is complete', () => {
    const state = stateWith({
      isOpen: true,
      selectionPhase: 'range_complete',
      rangeStart: createCalendarDate(2026, 2, 1),
      rangeEnd: createCalendarDate(2026, 2, 28),
    });
    const next = reduce(state, { type: 'APPLY' });
    expect(next.isOpen).toBe(false);
  });

  it('does nothing when range is incomplete', () => {
    const state = stateWith({ isOpen: true, selectionPhase: 'start_selected' });
    const next = reduce(state, { type: 'APPLY' });
    expect(next).toBe(state); // same reference = no change
  });
});

describe('reduce CANCEL', () => {
  it('closes the popup', () => {
    const state = stateWith({ isOpen: true });
    const next = reduce(state, { type: 'CANCEL' });
    expect(next.isOpen).toBe(false);
  });
});

describe('reduce FOCUS_DATE', () => {
  it('sets focused date', () => {
    const state = stateWith({ isOpen: true });
    const date = createCalendarDate(2026, 2, 15);
    const next = reduce(state, { type: 'FOCUS_DATE', date });
    expect(next.focusedDate).toEqual(date);
  });

  it('auto-advances displayMonth when focus moves before left calendar', () => {
    const state = stateWith({
      isOpen: true,
      displayMonth: createCalendarDate(2026, 2, 1),
    });
    const jan15 = createCalendarDate(2026, 1, 15);
    const next = reduce(state, { type: 'FOCUS_DATE', date: jan15 });
    expect(next.displayMonth).toEqual(createCalendarDate(2026, 1, 1));
  });

  it('auto-advances displayMonth when focus moves past right calendar', () => {
    const state = stateWith({
      isOpen: true,
      displayMonth: createCalendarDate(2026, 2, 1),
    });
    // Right calendar shows March; April is past it
    const apr5 = createCalendarDate(2026, 4, 5);
    const next = reduce(state, { type: 'FOCUS_DATE', date: apr5 });
    expect(next.displayMonth).toEqual(createCalendarDate(2026, 4, 1));
  });

  it('does not advance displayMonth when focus stays within visible months', () => {
    const state = stateWith({
      isOpen: true,
      displayMonth: createCalendarDate(2026, 2, 1),
    });
    // March is the right calendar — should stay
    const mar15 = createCalendarDate(2026, 3, 15);
    const next = reduce(state, { type: 'FOCUS_DATE', date: mar15 });
    expect(next.displayMonth).toEqual(state.displayMonth);
  });

  it('handles year boundary when advancing backward', () => {
    const state = stateWith({
      isOpen: true,
      displayMonth: createCalendarDate(2026, 1, 1),
    });
    const dec25 = createCalendarDate(2025, 12, 25);
    const next = reduce(state, { type: 'FOCUS_DATE', date: dec25 });
    expect(next.displayMonth).toEqual(createCalendarDate(2025, 12, 1));
  });
});
