import type {
  CalendarDate,
  CalendarMonth,
  TwoCalState,
  TwoCalTranslations,
  PresetRange,
  RenderConfig,
} from './types';
import {
  addMonths,
  buildCalendarMonth,
  calendarDateToString,
  dayNames,
  formatMonthYear,
  isBetween,
  isSameDay,
  isWithinBounds,
  today as getToday,
  ensureStartBeforeEnd,
} from './calendar';
import { gridCellAttributes, dialogAttributes, calendarGridAttributes } from './aria';

// --- Public API ---

export function renderPopup(state: TwoCalState, config: RenderConfig): HTMLElement {
  const p = config.stylePrefix;
  const popup = el('div', {
    class: `${p}-popup`,
    ...(config.isRTL ? { dir: 'rtl' } : {}),
    ...dialogAttributes(config.translations),
  });

  if (config.presets.length > 0) {
    popup.appendChild(renderPresetsSidebar(config.presets, state.activePreset, p));
  }

  const body = el('div', { class: `${p}-body` });
  body.appendChild(renderCalendars(state, config));
  body.appendChild(renderFooter(state.selectionPhase === 'range_complete', p, config.translations));
  popup.appendChild(body);

  return popup;
}

// --- Sections ---

function renderCalendars(state: TwoCalState, config: RenderConfig): HTMLElement {
  const p = config.stylePrefix;
  const container = el('div', { class: `${p}-calendars` });

  const leftMonth = buildCalendarMonth(
    state.displayMonth.year,
    state.displayMonth.month,
    config.firstDayOfWeek,
  );

  const rightDisplay = addMonths(state.displayMonth, 1);
  const rightMonth = buildCalendarMonth(
    rightDisplay.year,
    rightDisplay.month,
    config.firstDayOfWeek,
  );

  container.appendChild(renderCalendar(leftMonth, state, config, 'left'));
  container.appendChild(renderCalendar(rightMonth, state, config, 'right'));

  return container;
}

function renderCalendar(
  month: CalendarMonth,
  state: TwoCalState,
  config: RenderConfig,
  side: 'left' | 'right',
): HTMLElement {
  const p = config.stylePrefix;
  const calendar = el('div', { class: `${p}-calendar` });

  calendar.appendChild(renderHeader(month, side, config));
  calendar.appendChild(renderWeekdays(config));
  calendar.appendChild(renderGrid(month, state, config, side));

  return calendar;
}

function renderHeader(
  month: CalendarMonth,
  side: 'left' | 'right',
  config: RenderConfig,
): HTMLElement {
  const p = config.stylePrefix;
  const labelId = `${p}-label-${side}`;
  const header = el('div', { class: `${p}-header` });

  const prevBtn = side === 'left'
    ? el('button', { class: `${p}-nav-btn`, 'data-tc-action': 'prev-month', 'aria-label': config.translations.previousMonth }, ['\u2039'])
    : el('span');

  const title = el('span', { class: `${p}-header-title`, id: labelId, 'aria-live': 'polite' }, [
    formatMonthYear(month.year, month.month, config.locale),
  ]);

  const nextBtn = side === 'right'
    ? el('button', { class: `${p}-nav-btn`, 'data-tc-action': 'next-month', 'aria-label': config.translations.nextMonth }, ['\u203A'])
    : el('span');

  header.append(prevBtn, title, nextBtn);
  return header;
}

function renderWeekdays(config: RenderConfig): HTMLElement {
  const p = config.stylePrefix;
  const row = el('div', { class: `${p}-weekdays` });

  for (const name of dayNames(config.locale, config.firstDayOfWeek)) {
    row.appendChild(el('div', { class: `${p}-weekday` }, [name]));
  }

  return row;
}

function renderGrid(
  month: CalendarMonth,
  state: TwoCalState,
  config: RenderConfig,
  side: 'left' | 'right',
): HTMLElement {
  const p = config.stylePrefix;
  const grid = el('div', {
    class: `${p}-grid`,
    ...calendarGridAttributes(`${p}-label-${side}`),
  });

  for (const week of month.weeks) {
    for (const date of week) {
      grid.appendChild(renderDayCell(date, state, config));
    }
  }

  return grid;
}

export function renderDayCell(
  date: CalendarDate | null,
  state: TwoCalState,
  config: RenderConfig,
): HTMLElement {
  const p = config.stylePrefix;

  if (date === null) {
    return el('div', { class: `${p}-day ${p}-day--empty` });
  }

  const isDisabled = !isWithinBounds(date, config.minDate, config.maxDate);
  const classes = buildDayCellClasses(date, state, config, isDisabled);
  const ariaAttrs = gridCellAttributes(date, state, isDisabled);

  return el('button', {
    class: classes,
    'data-tc-action': 'select-date',
    'data-tc-date': calendarDateToString(date),
    type: 'button',
    ...(isDisabled ? { disabled: '' } : {}),
    ...ariaAttrs,
  }, [String(date.day)]);
}

function buildDayCellClasses(
  date: CalendarDate,
  state: TwoCalState,
  config: RenderConfig,
  isDisabled: boolean,
): string {
  const p = config.stylePrefix;
  const parts = [`${p}-day`];

  const isToday = isSameDay(date, getToday());
  const isStart = state.rangeStart !== null && isSameDay(date, state.rangeStart);
  const isEnd = state.rangeEnd !== null && isSameDay(date, state.rangeEnd);
  const isInRange = isInSelectedRange(date, state);
  const isInPreview = isInPreviewRange(date, state);

  if (isToday) parts.push(`${p}-day--today`);
  if (isStart) parts.push(`${p}-day--start`);
  if (isEnd) parts.push(`${p}-day--end`);
  if (isInRange && !isStart && !isEnd) parts.push(`${p}-day--in-range`);
  if (isInPreview && !isStart) parts.push(`${p}-day--preview`);
  if (isDisabled) parts.push(`${p}-day--disabled`);

  return parts.join(' ');
}

function isInSelectedRange(date: CalendarDate, state: TwoCalState): boolean {
  if (state.selectionPhase !== 'range_complete') return false;
  if (!state.rangeStart || !state.rangeEnd) return false;
  return isBetween(date, state.rangeStart, state.rangeEnd);
}

function isInPreviewRange(date: CalendarDate, state: TwoCalState): boolean {
  if (state.selectionPhase !== 'start_selected') return false;
  if (!state.rangeStart || !state.hoveredDate) return false;
  const preview = ensureStartBeforeEnd(state.rangeStart, state.hoveredDate);
  return isBetween(date, preview.start, preview.end);
}

export function renderPresetsSidebar(
  presets: ReadonlyArray<PresetRange>,
  activePreset: string | null,
  stylePrefix: string,
): HTMLElement {
  const p = stylePrefix;
  const sidebar = el('div', { class: `${p}-presets` });

  for (const preset of presets) {
    const isActive = activePreset === preset.label;
    const classes = isActive ? `${p}-preset ${p}-preset--active` : `${p}-preset`;
    sidebar.appendChild(
      el('button', {
        class: classes,
        'data-tc-action': 'select-preset',
        'data-tc-preset': preset.label,
        type: 'button',
      }, [preset.label]),
    );
  }

  return sidebar;
}

export function renderFooter(
  canApply: boolean,
  stylePrefix: string,
  translations: TwoCalTranslations,
): HTMLElement {
  const p = stylePrefix;
  const footer = el('div', { class: `${p}-footer` });

  const cancelBtn = el('button', {
    class: `${p}-btn ${p}-btn--secondary`,
    'data-tc-action': 'cancel',
    type: 'button',
  }, [translations.cancel]);

  const applyBtn = el('button', {
    class: `${p}-btn ${p}-btn--primary`,
    'data-tc-action': 'apply',
    type: 'button',
    ...(canApply ? {} : { disabled: '' }),
  }, [translations.apply]);

  footer.append(cancelBtn, applyBtn);
  return footer;
}

// --- DOM Helper ---

function el(
  tag: string,
  attrs?: Record<string, string>,
  children?: (Node | string)[],
): HTMLElement {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
  }
  if (children) {
    element.append(...children);
  }
  return element;
}
