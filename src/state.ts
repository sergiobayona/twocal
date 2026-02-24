import type {
  CalendarDate,
  TwoCalOptions,
  TwoCalState,
  DateRange,
  StateAction,
} from './types';
import { addMonths, ensureStartBeforeEnd, isSameDay, today } from './calendar';

export function createInitialState(options: Pick<TwoCalOptions, 'initialRange'>): TwoCalState {
  const now = today();
  const displayMonth = options.initialRange?.start ?? now;

  return {
    isOpen: false,
    displayMonth: { year: displayMonth.year, month: displayMonth.month, day: 1 },
    selectionPhase: options.initialRange ? 'range_complete' : 'idle',
    rangeStart: options.initialRange?.start ?? null,
    rangeEnd: options.initialRange?.end ?? null,
    hoveredDate: null,
    activePreset: null,
    focusedDate: null,
  };
}

export function reduce(state: TwoCalState, action: StateAction): TwoCalState {
  switch (action.type) {
    case 'OPEN':
      return openPopup(state);
    case 'CLOSE':
      return closePopup(state);
    case 'SELECT_DATE':
      return selectDate(state, action.date);
    case 'HOVER_DATE':
      return hoveredDateMatches(state, action.date) ? state : { ...state, hoveredDate: action.date };
    case 'CLEAR_HOVER':
      return state.hoveredDate === null ? state : { ...state, hoveredDate: null };
    case 'NAVIGATE_MONTH':
      return navigateMonth(state, action.delta);
    case 'SELECT_PRESET':
      return selectPreset(state, action.preset, action.range);
    case 'FOCUS_DATE':
      return { ...state, focusedDate: action.date };
    case 'APPLY':
      return state.selectionPhase === 'range_complete' ? closePopup(state) : state;
    case 'CANCEL':
      return closePopup(state);
  }
}

function openPopup(state: TwoCalState): TwoCalState {
  const displayMonth = state.rangeStart
    ? { year: state.rangeStart.year, month: state.rangeStart.month, day: 1 }
    : state.displayMonth;
  const focusedDate = state.focusedDate ?? state.rangeStart ?? today();

  return { ...state, isOpen: true, displayMonth, focusedDate };
}

function closePopup(state: TwoCalState): TwoCalState {
  return { ...state, isOpen: false, hoveredDate: null, focusedDate: null };
}

function selectDate(state: TwoCalState, date: CalendarDate): TwoCalState {
  switch (state.selectionPhase) {
    case 'idle':
      return {
        ...state,
        rangeStart: date,
        rangeEnd: null,
        selectionPhase: 'start_selected',
        activePreset: null,
        hoveredDate: null,
      };

    case 'start_selected': {
      const range = ensureStartBeforeEnd(state.rangeStart!, date);
      return {
        ...state,
        rangeStart: range.start,
        rangeEnd: range.end,
        selectionPhase: 'range_complete',
        hoveredDate: null,
      };
    }

    case 'range_complete': {
      // Clicking on start or end date deselects
      if (
        (state.rangeStart && isSameDay(date, state.rangeStart)) ||
        (state.rangeEnd && isSameDay(date, state.rangeEnd))
      ) {
        return {
          ...state,
          rangeStart: null,
          rangeEnd: null,
          selectionPhase: 'idle',
          activePreset: null,
          hoveredDate: null,
        };
      }

      // Otherwise start a new selection
      return {
        ...state,
        rangeStart: date,
        rangeEnd: null,
        selectionPhase: 'start_selected',
        activePreset: null,
        hoveredDate: null,
      };
    }
  }
}

function hoveredDateMatches(state: TwoCalState, date: CalendarDate): boolean {
  if (!state.hoveredDate) return false;
  return isSameDay(state.hoveredDate, date);
}

function navigateMonth(state: TwoCalState, delta: number): TwoCalState {
  const newDisplay = addMonths(state.displayMonth, delta);
  return {
    ...state,
    displayMonth: { year: newDisplay.year, month: newDisplay.month, day: 1 },
  };
}

function selectPreset(state: TwoCalState, preset: string, range: DateRange): TwoCalState {
  return {
    ...state,
    rangeStart: range.start,
    rangeEnd: range.end,
    selectionPhase: 'range_complete',
    activePreset: preset,
    hoveredDate: null,
    displayMonth: { year: range.start.year, month: range.start.month, day: 1 },
  };
}
