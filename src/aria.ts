import type { CalendarDate, TwoCalState, TwoCalTranslations } from './types';
import { isSameDay } from './calendar';

export function gridCellAttributes(
  date: CalendarDate,
  state: TwoCalState,
  isDisabled: boolean,
): Record<string, string> {
  const isSelected =
    (state.rangeStart !== null && isSameDay(date, state.rangeStart)) ||
    (state.rangeEnd !== null && isSameDay(date, state.rangeEnd));

  const isFocused = state.focusedDate !== null && isSameDay(date, state.focusedDate);

  return {
    role: 'gridcell',
    ...(isSelected ? { 'aria-selected': 'true' } : {}),
    ...(isDisabled ? { 'aria-disabled': 'true' } : {}),
    tabindex: isFocused ? '0' : '-1',
  };
}

export function dialogAttributes(translations: TwoCalTranslations): Record<string, string> {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': translations.chooseDateRange,
  };
}

export function calendarGridAttributes(labelId: string): Record<string, string> {
  return {
    role: 'grid',
    'aria-labelledby': labelId,
  };
}
