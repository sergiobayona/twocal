import type { CalendarDate, EventConfig, EventDispatcher, StateAction } from './types';
import {
  addDays,
  addMonths,
  endOfMonth,
  isWithinBounds,
  normalizeAndClampRange,
  parseCalendarDateString,
  startOfMonth,
} from './calendar';

export function bindPopupEvents(
  popupElement: HTMLElement,
  dispatch: EventDispatcher,
  config: EventConfig,
): () => void {
  const handleClick = createClickHandler(dispatch, config);
  const handleMouseover = createHoverHandler(dispatch, config);
  const handleMouseleave = createMouseleaveHandler(dispatch, config);
  const handleKeydown = createKeydownHandler(dispatch, config, popupElement);

  popupElement.addEventListener('click', handleClick);
  popupElement.addEventListener('mouseover', handleMouseover);
  popupElement.addEventListener('mouseleave', handleMouseleave, true);
  popupElement.addEventListener('keydown', handleKeydown);

  return () => {
    popupElement.removeEventListener('click', handleClick);
    popupElement.removeEventListener('mouseover', handleMouseover);
    popupElement.removeEventListener('mouseleave', handleMouseleave, true);
    popupElement.removeEventListener('keydown', handleKeydown);
  };
}

export function bindTriggerEvents(
  triggerElement: HTMLElement,
  dispatch: EventDispatcher,
): () => void {
  const handleClick = (event: Event) => {
    event.stopPropagation();
    dispatch({ type: 'OPEN' });
  };

  triggerElement.addEventListener('click', handleClick);
  return () => triggerElement.removeEventListener('click', handleClick);
}

export function bindDocumentEvents(
  popupElement: HTMLElement,
  triggerElement: HTMLElement,
  dispatch: EventDispatcher,
): () => void {
  const handleMousedown = (event: Event) => {
    const target = event.target as Node;
    if (!popupElement.contains(target) && !triggerElement.contains(target)) {
      dispatch({ type: 'CANCEL' });
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      dispatch({ type: 'CANCEL' });
    }
  };

  document.addEventListener('mousedown', handleMousedown);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('mousedown', handleMousedown);
    document.removeEventListener('keydown', handleEscape);
  };
}

// --- Click Delegation ---

function createClickHandler(dispatch: EventDispatcher, config: EventConfig) {
  return (event: Event) => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest('[data-tc-action]') as HTMLElement | null;
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-tc-action');
    const stateAction = resolveClickAction(action, actionEl, config);
    if (stateAction) dispatch(stateAction);
  };
}

function resolveClickAction(
  action: string | null,
  element: HTMLElement,
  config: EventConfig,
): StateAction | null {
  switch (action) {
    case 'select-date': {
      const dateStr = element.getAttribute('data-tc-date');
      if (!dateStr) return null;
      const date = parseCalendarDateString(dateStr);
      if (!date) return null;
      return { type: 'SELECT_DATE', date };
    }
    case 'select-preset': {
      const presetLabel = element.getAttribute('data-tc-preset');
      if (!presetLabel) return null;
      const preset = config.presets.find((p) => p.label === presetLabel);
      if (!preset) return null;
      const range = normalizeAndClampRange(preset.range(), config.minDate, config.maxDate);
      return { type: 'SELECT_PRESET', preset: presetLabel, range };
    }
    case 'prev-month':
      return { type: 'NAVIGATE_MONTH', delta: -1 };
    case 'next-month':
      return { type: 'NAVIGATE_MONTH', delta: 1 };
    case 'apply':
      return { type: 'APPLY' };
    case 'cancel':
      return { type: 'CANCEL' };
    default:
      return null;
  }
}

// --- Hover Delegation ---

function createHoverHandler(dispatch: EventDispatcher, config: EventConfig) {
  return (event: Event) => {
    const target = event.target as HTMLElement;
    const dayEl = target.closest(`.${config.stylePrefix}-day[data-tc-date]`) as HTMLElement | null;
    if (!dayEl) return;

    const dateStr = dayEl.getAttribute('data-tc-date');
    if (!dateStr) return;
    const date = parseCalendarDateString(dateStr);
    if (!date) return;

    dispatch({ type: 'HOVER_DATE', date });
  };
}

function createMouseleaveHandler(dispatch: EventDispatcher, config: EventConfig) {
  return (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains(`${config.stylePrefix}-grid`)) {
      dispatch({ type: 'CLEAR_HOVER' });
    }
  };
}

// --- Keyboard Navigation ---

function createKeydownHandler(dispatch: EventDispatcher, config: EventConfig, popupElement: HTMLElement) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      handleTabTrap(event, popupElement);
      return;
    }

    const target = event.target as HTMLElement;
    const dateStr = target.getAttribute('data-tc-date');
    if (!dateStr) return;

    const currentDate = parseCalendarDateString(dateStr);
    if (!currentDate) return;

    const keyAction = resolveKeyAction(event.key, currentDate, config);
    if (!keyAction) return;

    event.preventDefault();
    dispatch(keyAction);
  };
}

function resolveKeyAction(key: string, currentDate: CalendarDate, config: EventConfig): StateAction | null {
  switch (key) {
    case 'ArrowLeft':
      return focusDateAction(addDays(currentDate, -1), -1, config);
    case 'ArrowRight':
      return focusDateAction(addDays(currentDate, 1), 1, config);
    case 'ArrowUp':
      return focusDateAction(addDays(currentDate, -7), -1, config);
    case 'ArrowDown':
      return focusDateAction(addDays(currentDate, 7), 1, config);
    case 'Home':
      return focusDateAction(startOfMonth(currentDate), 1, config);
    case 'End':
      return focusDateAction(endOfMonth(currentDate), -1, config);
    case 'PageUp':
      return focusDateAction(addMonths(currentDate, -1), -1, config);
    case 'PageDown':
      return focusDateAction(addMonths(currentDate, 1), 1, config);
    case 'Enter':
    case ' ':
      return { type: 'SELECT_DATE', date: currentDate };
    default:
      return null;
  }
}

function focusDateAction(date: CalendarDate, direction: 1 | -1, config: EventConfig): StateAction {
  return { type: 'FOCUS_DATE', date: skipDisabledDates(date, direction, config) };
}

/** Advance past disabled dates in the given direction, up to 31 steps. */
function skipDisabledDates(date: CalendarDate, direction: 1 | -1, config: EventConfig): CalendarDate {
  let candidate = date;
  for (let i = 0; i < 31; i++) {
    if (isWithinBounds(candidate, config.minDate, config.maxDate)) return candidate;
    candidate = addDays(candidate, direction);
  }
  return date;
}

// --- Tab Trapping ---

function handleTabTrap(event: KeyboardEvent, popupElement: HTMLElement): void {
  const focusable = popupElement.querySelectorAll<HTMLElement>(
    'button:not(:disabled), [tabindex="0"]',
  );
  if (focusable.length === 0) return;

  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
