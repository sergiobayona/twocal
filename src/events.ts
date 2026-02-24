import type { EventConfig, EventDispatcher, StateAction } from './types';
import { addDays, parseCalendarDateString } from './calendar';

export function bindPopupEvents(
  popupElement: HTMLElement,
  dispatch: EventDispatcher,
  config: EventConfig,
): () => void {
  const handleClick = createClickHandler(dispatch, config);
  const handleMouseover = createHoverHandler(dispatch, config);
  const handleMouseleave = createMouseleaveHandler(dispatch, config);
  const handleKeydown = createKeydownHandler(dispatch);

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
      return { type: 'SELECT_PRESET', preset: presetLabel, range: preset.range() };
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

function createKeydownHandler(dispatch: EventDispatcher) {
  return (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const dateStr = target.getAttribute('data-tc-date');
    if (!dateStr) return;

    const currentDate = parseCalendarDateString(dateStr);
    if (!currentDate) return;

    const keyAction = resolveKeyAction(event.key, currentDate);
    if (!keyAction) return;

    event.preventDefault();
    dispatch(keyAction);
  };
}

function resolveKeyAction(key: string, currentDate: { year: number; month: number; day: number }): StateAction | null {
  switch (key) {
    case 'ArrowLeft':
      return { type: 'FOCUS_DATE', date: addDays(currentDate, -1) };
    case 'ArrowRight':
      return { type: 'FOCUS_DATE', date: addDays(currentDate, 1) };
    case 'ArrowUp':
      return { type: 'FOCUS_DATE', date: addDays(currentDate, -7) };
    case 'ArrowDown':
      return { type: 'FOCUS_DATE', date: addDays(currentDate, 7) };
    case 'Enter':
    case ' ':
      return { type: 'SELECT_DATE', date: currentDate };
    default:
      return null;
  }
}
