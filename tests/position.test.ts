import { describe, it, expect } from 'vitest';
import { computePosition } from '../src/position';

function makeTriggerRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100,
    right: 200,
    bottom: 140,
    left: 100,
    width: 100,
    height: 40,
    x: 100,
    y: 100,
    toJSON: () => ({}),
    ...overrides,
  };
}

const popupSize = { width: 600, height: 400 };

describe('computePosition', () => {
  it('places below the trigger by default', () => {
    const result = computePosition(
      makeTriggerRect(),
      popupSize,
      'bottom',
      1000,  // viewportHeight
      1200,  // viewportWidth
      0,     // scrollX
      0,     // scrollY
    );
    expect(result.placement).toBe('bottom');
    expect(result.top).toBe(148); // bottom (140) + scrollY (0) + gap (8)
  });

  it('flips to top when not enough space below', () => {
    const result = computePosition(
      makeTriggerRect({ top: 550, bottom: 590 }),
      popupSize,
      'bottom',
      600,   // tight viewport
      1200,
      0,
      0,
    );
    expect(result.placement).toBe('top');
    expect(result.top).toBe(142); // top (550) + scrollY (0) - height (400) - gap (8)
  });

  it('respects preferred top placement', () => {
    const result = computePosition(
      makeTriggerRect(),
      popupSize,
      'top',
      1000,
      1200,
      0,
      0,
    );
    expect(result.placement).toBe('top');
    expect(result.top).toBe(8); // clamped to viewport padding
  });

  it('clamps top when flipped placement would overflow above viewport', () => {
    const result = computePosition(
      makeTriggerRect({ top: 50, bottom: 90 }),
      popupSize,
      'bottom',
      300, // not enough space below
      1200,
      0,
      0,
    );
    expect(result.placement).toBe('top');
    expect(result.top).toBe(8);
  });

  it('clamps left when popup would overflow right edge', () => {
    const result = computePosition(
      makeTriggerRect({ left: 700, right: 800 }),
      popupSize,
      'bottom',
      1000,
      1000, // viewport narrower than left + popup width
      0,
      0,
    );
    // maxRight = 1000 - 8 = 992, left = 992 - 600 = 392
    expect(result.left).toBe(392);
  });

  it('clamps to left edge when popup would go off-screen left', () => {
    const result = computePosition(
      makeTriggerRect({ left: 0, right: 50 }),
      popupSize,
      'bottom',
      1000,
      1200,
      0,
      0,
    );
    expect(result.left).toBe(8); // VIEWPORT_PADDING
  });

  it('accounts for scroll offset', () => {
    const result = computePosition(
      makeTriggerRect(),
      popupSize,
      'bottom',
      1000,
      1200,
      50,   // scrollX
      200,  // scrollY
    );
    expect(result.top).toBe(348); // bottom (140) + scrollY (200) + gap (8)
    expect(result.left).toBe(150); // left (100) + scrollX (50)
  });
});
