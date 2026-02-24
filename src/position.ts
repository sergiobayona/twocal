import type { Placement, PositionResult } from './types';

const GAP = 8;
const VIEWPORT_PADDING = 8;

export function computePosition(
  triggerRect: DOMRect,
  popupSize: { width: number; height: number },
  preferredPlacement: Placement,
  viewportHeight: number,
  viewportWidth: number,
  scrollX: number,
  scrollY: number,
): PositionResult {
  const { top, left } = computeVerticalAndHorizontal(
    triggerRect,
    popupSize,
    preferredPlacement,
    viewportHeight,
    viewportWidth,
    scrollX,
    scrollY,
  );

  const placement = wouldOverflowBelow(triggerRect, popupSize.height, viewportHeight)
    && preferredPlacement === 'bottom'
    ? 'top'
    : preferredPlacement;

  return { top, left, placement };
}

function computeVerticalAndHorizontal(
  triggerRect: DOMRect,
  popupSize: { width: number; height: number },
  preferredPlacement: Placement,
  viewportHeight: number,
  viewportWidth: number,
  scrollX: number,
  scrollY: number,
): { top: number; left: number } {
  return {
    top: computeTop(triggerRect, popupSize.height, preferredPlacement, viewportHeight, scrollY),
    left: computeLeft(triggerRect, popupSize.width, viewportWidth, scrollX),
  };
}

function computeTop(
  triggerRect: DOMRect,
  popupHeight: number,
  preferredPlacement: Placement,
  viewportHeight: number,
  scrollY: number,
): number {
  const belowTop = triggerRect.bottom + scrollY + GAP;
  const aboveTop = triggerRect.top + scrollY - popupHeight - GAP;
  const minTop = scrollY + VIEWPORT_PADDING;
  const maxTop = scrollY + viewportHeight - VIEWPORT_PADDING - popupHeight;

  const rawTop = preferredPlacement === 'top' || wouldOverflowBelow(triggerRect, popupHeight, viewportHeight)
    ? aboveTop
    : belowTop;

  return clamp(rawTop, minTop, maxTop);
}

function computeLeft(
  triggerRect: DOMRect,
  popupWidth: number,
  viewportWidth: number,
  scrollX: number,
): number {
  let left = triggerRect.left + scrollX;

  // Clamp right edge
  const rightEdge = left + popupWidth;
  const maxRight = viewportWidth + scrollX - VIEWPORT_PADDING;
  if (rightEdge > maxRight) {
    left = maxRight - popupWidth;
  }

  // Clamp left edge
  const minLeft = scrollX + VIEWPORT_PADDING;
  if (left < minLeft) {
    left = minLeft;
  }

  return left;
}

function wouldOverflowBelow(
  triggerRect: DOMRect,
  popupHeight: number,
  viewportHeight: number,
): boolean {
  return triggerRect.bottom + GAP + popupHeight > viewportHeight;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
