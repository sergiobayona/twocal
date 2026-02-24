import { describe, it, expect, vi, afterEach } from 'vitest';
import { defaultPresets } from '../src/presets';

describe('defaultPresets', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 6 presets', () => {
    expect(defaultPresets()).toHaveLength(6);
  });

  it('Today returns same start and end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'Today')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 2, day: 23 });
    expect(range.end).toEqual(range.start);
  });

  it('Yesterday returns the day before', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'Yesterday')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 2, day: 22 });
    expect(range.end).toEqual(range.start);
  });

  it('Last 7 Days spans 7 days inclusive', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'Last 7 Days')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 2, day: 17 });
    expect(range.end).toEqual({ year: 2026, month: 2, day: 23 });
  });

  it('Last 30 Days spans 30 days inclusive', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'Last 30 Days')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 1, day: 25 });
    expect(range.end).toEqual({ year: 2026, month: 2, day: 23 });
  });

  it('This Month starts at day 1', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'This Month')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 2, day: 1 });
    expect(range.end).toEqual({ year: 2026, month: 2, day: 23 });
  });

  it('Last Month returns full previous month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 23));
    const preset = defaultPresets().find((p) => p.label === 'Last Month')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2026, month: 1, day: 1 });
    expect(range.end).toEqual({ year: 2026, month: 1, day: 31 });
  });

  it('Last Month wraps year boundary in January', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // Jan 15, 2026
    const preset = defaultPresets().find((p) => p.label === 'Last Month')!;
    const range = preset.range();
    expect(range.start).toEqual({ year: 2025, month: 12, day: 1 });
    expect(range.end).toEqual({ year: 2025, month: 12, day: 31 });
  });
});
