import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderPopup, renderDayCell, renderPresetsSidebar, renderFooter } from '../src/render';
import { createCalendarDate } from '../src/calendar';
import { defaultPresets } from '../src/presets';
import type { TwoCalState, RenderConfig } from '../src/types';

const config: RenderConfig = {
  locale: 'en-US',
  firstDayOfWeek: 0,
  presets: defaultPresets(),
  stylePrefix: 'tc-t',
};

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

afterEach(() => {
  vi.useRealTimers();
});

describe('renderPopup', () => {
  it('creates a dialog element with correct ARIA attributes', () => {
    const popup = renderPopup(stateWith({}), config);
    expect(popup.getAttribute('role')).toBe('dialog');
    expect(popup.getAttribute('aria-modal')).toBe('true');
  });

  it('contains presets sidebar, calendars, and footer', () => {
    const popup = renderPopup(stateWith({}), config);
    expect(popup.querySelector('.tc-t-presets')).not.toBeNull();
    expect(popup.querySelector('.tc-t-calendars')).not.toBeNull();
    expect(popup.querySelector('.tc-t-footer')).not.toBeNull();
  });

  it('renders two calendar grids', () => {
    const popup = renderPopup(stateWith({}), config);
    const grids = popup.querySelectorAll('.tc-t-grid');
    expect(grids.length).toBe(2);
  });

  it('shows left calendar for display month and right for next month', () => {
    const popup = renderPopup(
      stateWith({ displayMonth: createCalendarDate(2026, 2, 1) }),
      config,
    );
    const titles = popup.querySelectorAll('.tc-t-header-title');
    expect(titles[0]?.textContent).toContain('February');
    expect(titles[1]?.textContent).toContain('March');
  });

  it('only shows prev nav on left calendar and next nav on right', () => {
    const popup = renderPopup(stateWith({}), config);
    const prevBtns = popup.querySelectorAll('[data-tc-action="prev-month"]');
    const nextBtns = popup.querySelectorAll('[data-tc-action="next-month"]');
    expect(prevBtns.length).toBe(1);
    expect(nextBtns.length).toBe(1);
  });

  it('renders without presets sidebar when presets are empty', () => {
    const noPresetsConfig = { ...config, presets: [] };
    const popup = renderPopup(stateWith({}), noPresetsConfig);
    expect(popup.querySelector('.tc-t-presets')).toBeNull();
  });
});

describe('renderDayCell', () => {
  it('renders null as empty div', () => {
    const cell = renderDayCell(null, stateWith({}), config);
    expect(cell.tagName).toBe('DIV');
    expect(cell.classList.contains('tc-t-day--empty')).toBe(true);
  });

  it('renders a date as a button with data attributes', () => {
    const date = createCalendarDate(2026, 2, 15);
    const cell = renderDayCell(date, stateWith({}), config);
    expect(cell.tagName).toBe('BUTTON');
    expect(cell.getAttribute('data-tc-action')).toBe('select-date');
    expect(cell.getAttribute('data-tc-date')).toBe('2026-02-15');
    expect(cell.textContent).toBe('15');
  });

  it('marks the start date', () => {
    const date = createCalendarDate(2026, 2, 10);
    const state = stateWith({ rangeStart: date, selectionPhase: 'start_selected' });
    const cell = renderDayCell(date, state, config);
    expect(cell.classList.contains('tc-t-day--start')).toBe(true);
  });

  it('marks the end date', () => {
    const start = createCalendarDate(2026, 2, 10);
    const end = createCalendarDate(2026, 2, 20);
    const state = stateWith({ rangeStart: start, rangeEnd: end, selectionPhase: 'range_complete' });
    const cell = renderDayCell(end, state, config);
    expect(cell.classList.contains('tc-t-day--end')).toBe(true);
  });

  it('marks days in the selected range', () => {
    const start = createCalendarDate(2026, 2, 10);
    const end = createCalendarDate(2026, 2, 20);
    const state = stateWith({ rangeStart: start, rangeEnd: end, selectionPhase: 'range_complete' });
    const mid = createCalendarDate(2026, 2, 15);
    const cell = renderDayCell(mid, state, config);
    expect(cell.classList.contains('tc-t-day--in-range')).toBe(true);
  });

  it('marks days in the hover preview range', () => {
    const start = createCalendarDate(2026, 2, 10);
    const hovered = createCalendarDate(2026, 2, 15);
    const state = stateWith({
      rangeStart: start,
      hoveredDate: hovered,
      selectionPhase: 'start_selected',
    });
    const mid = createCalendarDate(2026, 2, 12);
    const cell = renderDayCell(mid, state, config);
    expect(cell.classList.contains('tc-t-day--preview')).toBe(true);
  });

  it('marks disabled dates', () => {
    const date = createCalendarDate(2026, 2, 15);
    const restrictedConfig = { ...config, minDate: createCalendarDate(2026, 2, 20) };
    const cell = renderDayCell(date, stateWith({}), restrictedConfig);
    expect(cell.classList.contains('tc-t-day--disabled')).toBe(true);
    expect(cell.hasAttribute('disabled')).toBe(true);
  });

  it('marks today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15));
    const date = createCalendarDate(2026, 2, 15);
    const cell = renderDayCell(date, stateWith({}), config);
    expect(cell.classList.contains('tc-t-day--today')).toBe(true);
  });
});

describe('renderPresetsSidebar', () => {
  it('renders all preset buttons', () => {
    const presets = defaultPresets();
    const sidebar = renderPresetsSidebar(presets, null, 'tc-t');
    const buttons = sidebar.querySelectorAll('button');
    expect(buttons.length).toBe(presets.length);
  });

  it('marks the active preset', () => {
    const presets = defaultPresets();
    const sidebar = renderPresetsSidebar(presets, 'Today', 'tc-t');
    const active = sidebar.querySelector('.tc-t-preset--active');
    expect(active?.textContent).toBe('Today');
  });

  it('sets data-tc-preset attribute', () => {
    const presets = defaultPresets();
    const sidebar = renderPresetsSidebar(presets, null, 'tc-t');
    const firstBtn = sidebar.querySelector('button')!;
    expect(firstBtn.getAttribute('data-tc-preset')).toBe(presets[0]!.label);
  });
});

describe('renderFooter', () => {
  it('renders cancel and apply buttons', () => {
    const footer = renderFooter(true, 'tc-t');
    expect(footer.querySelector('[data-tc-action="cancel"]')).not.toBeNull();
    expect(footer.querySelector('[data-tc-action="apply"]')).not.toBeNull();
  });

  it('disables apply when canApply is false', () => {
    const footer = renderFooter(false, 'tc-t');
    const apply = footer.querySelector('[data-tc-action="apply"]') as HTMLButtonElement;
    expect(apply.hasAttribute('disabled')).toBe(true);
  });

  it('enables apply when canApply is true', () => {
    const footer = renderFooter(true, 'tc-t');
    const apply = footer.querySelector('[data-tc-action="apply"]') as HTMLButtonElement;
    expect(apply.hasAttribute('disabled')).toBe(false);
  });
});
