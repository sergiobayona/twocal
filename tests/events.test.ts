import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bindPopupEvents, bindTriggerEvents, bindDocumentEvents } from '../src/events';
import { defaultPresets } from '../src/presets';
import type { EventConfig, StateAction } from '../src/types';

const config: EventConfig = {
  stylePrefix: 'tc-t',
  presets: defaultPresets(),
};

describe('bindPopupEvents', () => {
  let popup: HTMLElement;
  let dispatched: StateAction[];
  let cleanup: () => void;

  beforeEach(() => {
    dispatched = [];
    popup = document.createElement('div');
    document.body.appendChild(popup);
    cleanup = bindPopupEvents(popup, (a) => dispatched.push(a), config);
  });

  afterEach(() => {
    cleanup();
    popup.remove();
  });

  it('dispatches SELECT_DATE on day click', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'select-date');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({
      type: 'SELECT_DATE',
      date: { year: 2026, month: 2, day: 15 },
    });
  });

  it('dispatches NAVIGATE_MONTH on prev-month click', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'prev-month');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched[0]).toEqual({ type: 'NAVIGATE_MONTH', delta: -1 });
  });

  it('dispatches NAVIGATE_MONTH on next-month click', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'next-month');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched[0]).toEqual({ type: 'NAVIGATE_MONTH', delta: 1 });
  });

  it('dispatches APPLY on apply click', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'apply');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched[0]).toEqual({ type: 'APPLY' });
  });

  it('dispatches CANCEL on cancel click', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'cancel');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched[0]).toEqual({ type: 'CANCEL' });
  });

  it('dispatches SELECT_PRESET on preset click', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));

    const btn = document.createElement('button');
    btn.setAttribute('data-tc-action', 'select-preset');
    btn.setAttribute('data-tc-preset', 'Today');
    popup.appendChild(btn);

    btn.click();
    expect(dispatched[0]?.type).toBe('SELECT_PRESET');

    vi.useRealTimers();
  });

  it('ignores clicks on elements without data-tc-action', () => {
    const div = document.createElement('div');
    popup.appendChild(div);

    div.click();
    expect(dispatched).toHaveLength(0);
  });

  it('dispatches HOVER_DATE on day mouseover', () => {
    const btn = document.createElement('button');
    btn.className = 'tc-t-day';
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'HOVER_DATE',
      date: { year: 2026, month: 2, day: 15 },
    });
  });

  it('dispatches keyboard navigation on arrow keys', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 2, day: 16 },
    });
  });

  it('dispatches SELECT_DATE on Enter key', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'SELECT_DATE',
      date: { year: 2026, month: 2, day: 15 },
    });
  });

  it('dispatches FOCUS_DATE with first of month on Home key', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 2, day: 1 },
    });
  });

  it('dispatches FOCUS_DATE with last of month on End key', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 2, day: 28 },
    });
  });

  it('dispatches FOCUS_DATE with previous month on PageUp', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 1, day: 15 },
    });
  });

  it('dispatches FOCUS_DATE with next month on PageDown', () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-15');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 3, day: 15 },
    });
  });

  it('skips disabled dates when arrowing past minDate', () => {
    cleanup();
    const restrictedConfig: EventConfig = {
      ...config,
      minDate: { year: 2026, month: 2, day: 10 },
    };
    cleanup = bindPopupEvents(popup, (a) => dispatched.push(a), restrictedConfig);

    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-11');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 2, day: 10 },
    });
  });

  it('skips disabled dates when arrowing past maxDate', () => {
    cleanup();
    const restrictedConfig: EventConfig = {
      ...config,
      maxDate: { year: 2026, month: 2, day: 20 },
    };
    cleanup = bindPopupEvents(popup, (a) => dispatched.push(a), restrictedConfig);

    const btn = document.createElement('button');
    btn.setAttribute('data-tc-date', '2026-02-19');
    popup.appendChild(btn);

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(dispatched[0]).toEqual({
      type: 'FOCUS_DATE',
      date: { year: 2026, month: 2, day: 20 },
    });
  });

  it('traps Tab at the end of the popup', () => {
    const first = document.createElement('button');
    first.setAttribute('data-tc-date', '2026-02-01');
    const last = document.createElement('button');
    last.setAttribute('data-tc-action', 'apply');
    popup.append(first, last);

    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const spy = vi.spyOn(event, 'preventDefault');
    popup.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('traps Shift+Tab at the start of the popup', () => {
    const first = document.createElement('button');
    first.setAttribute('data-tc-date', '2026-02-01');
    first.setAttribute('tabindex', '0');
    const last = document.createElement('button');
    last.setAttribute('data-tc-action', 'apply');
    popup.append(first, last);

    first.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    const spy = vi.spyOn(event, 'preventDefault');
    popup.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });
});

describe('bindTriggerEvents', () => {
  it('dispatches OPEN on trigger click', () => {
    const trigger = document.createElement('button');
    const dispatched: StateAction[] = [];
    const cleanup = bindTriggerEvents(trigger, (a) => dispatched.push(a));

    trigger.click();
    expect(dispatched[0]).toEqual({ type: 'OPEN' });
    cleanup();
  });
});

describe('bindDocumentEvents', () => {
  it('dispatches CANCEL on outside mousedown', () => {
    const popup = document.createElement('div');
    const trigger = document.createElement('button');
    const dispatched: StateAction[] = [];
    document.body.appendChild(popup);
    document.body.appendChild(trigger);

    const cleanup = bindDocumentEvents(popup, trigger, (a) => dispatched.push(a));

    // Click outside both
    document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));
    expect(dispatched[0]).toEqual({ type: 'CANCEL' });

    cleanup();
    popup.remove();
    trigger.remove();
  });

  it('does not dispatch CANCEL when clicking inside popup', () => {
    const popup = document.createElement('div');
    const inner = document.createElement('span');
    popup.appendChild(inner);
    const trigger = document.createElement('button');
    const dispatched: StateAction[] = [];
    document.body.appendChild(popup);
    document.body.appendChild(trigger);

    const cleanup = bindDocumentEvents(popup, trigger, (a) => dispatched.push(a));

    inner.dispatchEvent(new Event('mousedown', { bubbles: true }));
    expect(dispatched).toHaveLength(0);

    cleanup();
    popup.remove();
    trigger.remove();
  });

  it('dispatches CANCEL on Escape key', () => {
    const popup = document.createElement('div');
    const trigger = document.createElement('button');
    const dispatched: StateAction[] = [];

    const cleanup = bindDocumentEvents(popup, trigger, (a) => dispatched.push(a));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dispatched[0]).toEqual({ type: 'CANCEL' });

    cleanup();
  });
});
