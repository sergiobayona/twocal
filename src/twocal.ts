import type {
  TwoCalOptions,
  TwoCalState,
  TwoCalTheme,
  DateRange,
  RenderConfig,
  StateAction,
} from './types';
import { createInitialState, reduce } from './state';
import { renderPopup } from './render';
import { bindPopupEvents, bindTriggerEvents, bindDocumentEvents } from './events';
import { computePosition } from './position';
import { generateStylePrefix, injectStyles, removeStyles, resolveTheme } from './styles';
import { defaultPresets } from './presets';
import { resolveTranslations, isRTL } from './i18n';
import { calendarDateToString, isSameDay, isBetween, ensureStartBeforeEnd } from './calendar';

export class TwoCal {
  private state: TwoCalState;
  private readonly container: HTMLElement;
  private readonly popupContainer: HTMLElement;
  private styleElement: HTMLStyleElement;
  private readonly stylePrefix: string;
  private readonly renderConfig: RenderConfig;
  private readonly options: TwoCalOptions;
  private appliedRange: DateRange | null;
  private previousState: TwoCalState | null = null;

  private cleanupTrigger: (() => void) | null = null;
  private cleanupPopup: (() => void) | null = null;
  private cleanupDocument: (() => void) | null = null;
  private cleanupResize: (() => void) | null = null;
  private destroyed = false;

  constructor(options: TwoCalOptions) {
    if (!options.trigger) {
      throw new Error('TwoCal: trigger element is required');
    }
    if (!options.onRangeSelect) {
      throw new Error('TwoCal: onRangeSelect callback is required');
    }

    this.options = options;
    this.container = options.container ?? document.body;
    this.stylePrefix = generateStylePrefix();
    this.appliedRange = options.initialRange ?? null;

    const theme = resolveTheme(options.theme);
    this.styleElement = injectStyles(theme, this.stylePrefix);

    const locale = options.locale ?? 'en-US';
    const translations = resolveTranslations(locale, options.translations);

    this.renderConfig = {
      locale,
      firstDayOfWeek: options.firstDayOfWeek ?? 0,
      presets: options.presets ?? defaultPresets(translations),
      minDate: options.minDate,
      maxDate: options.maxDate,
      stylePrefix: this.stylePrefix,
      translations,
      isRTL: isRTL(locale),
    };

    this.state = createInitialState(options);

    this.popupContainer = document.createElement('div');
    this.popupContainer.style.position = 'absolute';
    this.popupContainer.style.top = '0';
    this.popupContainer.style.left = '0';

    this.cleanupTrigger = bindTriggerEvents(options.trigger, (action) => this.dispatch(action));
  }

  open(): void {
    this.guardDestroyed();
    if (!this.state.isOpen) {
      this.dispatch({ type: 'OPEN' });
    }
  }

  close(): void {
    this.guardDestroyed();
    if (this.state.isOpen) {
      this.dispatch({ type: 'CANCEL' });
    }
  }

  getRange(): DateRange | null {
    this.guardDestroyed();
    return this.appliedRange;
  }

  setRange(range: DateRange): void {
    this.guardDestroyed();
    this.appliedRange = range;
    this.state = {
      ...this.state,
      rangeStart: range.start,
      rangeEnd: range.end,
      selectionPhase: 'range_complete',
      displayMonth: { year: range.start.year, month: range.start.month, day: 1 },
    };
  }

  setTheme(theme: TwoCalTheme): void {
    this.guardDestroyed();
    removeStyles(this.styleElement);
    const resolved = resolveTheme(theme);
    this.styleElement = injectStyles(resolved, this.stylePrefix);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.cleanupTrigger?.();
    this.cleanupPopup?.();
    this.cleanupDocument?.();
    this.cleanupResize?.();
    removeStyles(this.styleElement);

    if (this.popupContainer.parentNode) {
      this.popupContainer.remove();
    }
  }

  private dispatch(action: StateAction): void {
    if (this.destroyed) return;

    const previousState = this.state;
    this.state = reduce(this.state, action);

    if (this.state === previousState) return;

    // Handle special side effects before rerender
    if (action.type === 'OPEN' && !previousState.isOpen) {
      this.previousState = previousState;
      this.options.onOpen?.();
    }

    if (action.type === 'APPLY' && previousState.selectionPhase === 'range_complete') {
      this.applyRange();
    }

    if (action.type === 'CANCEL' && previousState.isOpen) {
      this.revertToPreviousRange();
    }

    this.handleVisibilityChange(previousState);
  }

  private handleVisibilityChange(previousState: TwoCalState): void {
    const wasOpen = previousState.isOpen;
    const isOpen = this.state.isOpen;

    if (!wasOpen && isOpen) {
      this.mountPopup();
    } else if (wasOpen && !isOpen) {
      this.unmountPopup();
      this.options.onClose?.();
    } else if (isOpen) {
      const onlyHoverChanged =
        previousState.hoveredDate !== this.state.hoveredDate &&
        previousState.selectionPhase === this.state.selectionPhase &&
        previousState.rangeStart === this.state.rangeStart &&
        previousState.rangeEnd === this.state.rangeEnd &&
        previousState.displayMonth === this.state.displayMonth &&
        previousState.activePreset === this.state.activePreset &&
        previousState.focusedDate === this.state.focusedDate;

      if (onlyHoverChanged) {
        this.updateHoverPreview();
      } else {
        this.rerender();
      }
    }
  }

  private mountPopup(): void {
    this.container.appendChild(this.popupContainer);
    this.rerender();
    this.addEntryAnimation();
    this.updatePosition();
    this.bindPopupAndDocumentEvents();

    const resizeHandler = () => {
      requestAnimationFrame(() => this.updatePosition());
    };
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', resizeHandler, true);
    this.cleanupResize = () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('scroll', resizeHandler, true);
    };
  }

  private unmountPopup(): void {
    this.cleanupPopup?.();
    this.cleanupPopup = null;
    this.cleanupDocument?.();
    this.cleanupDocument = null;
    this.cleanupResize?.();
    this.cleanupResize = null;

    if (this.popupContainer.parentNode) {
      this.popupContainer.remove();
    }

    this.options.trigger.focus();
  }

  private rerender(): void {
    const content = renderPopup(this.state, this.renderConfig);

    // Clear previous popup event listeners before replacing DOM
    this.cleanupPopup?.();

    this.popupContainer.replaceChildren(content);

    this.cleanupPopup = bindPopupEvents(
      this.popupContainer,
      (action) => this.dispatch(action),
      {
        stylePrefix: this.stylePrefix,
        presets: this.renderConfig.presets,
      },
    );

    this.restoreFocus();
  }

  private bindPopupAndDocumentEvents(): void {
    this.cleanupDocument?.();
    this.cleanupDocument = bindDocumentEvents(
      this.popupContainer,
      this.options.trigger,
      (action) => this.dispatch(action),
    );
  }

  private updatePosition(): void {
    if (!this.state.isOpen) return;

    const triggerRect = this.options.trigger.getBoundingClientRect();
    const popupEl = this.popupContainer.firstElementChild as HTMLElement | null;
    if (!popupEl) return;

    const popupRect = popupEl.getBoundingClientRect();
    const result = computePosition(
      triggerRect,
      { width: popupRect.width, height: popupRect.height },
      this.options.placement ?? 'bottom',
      window.innerHeight,
      window.innerWidth,
      window.scrollX,
      window.scrollY,
    );

    this.popupContainer.style.position = 'absolute';
    this.popupContainer.style.top = `${result.top}px`;
    this.popupContainer.style.left = `${result.left}px`;
  }

  private updateHoverPreview(): void {
    const p = this.stylePrefix;
    const previewClass = `${p}-day--preview`;

    // Remove old preview classes
    const oldPreviews = this.popupContainer.querySelectorAll(`.${previewClass}`);
    for (const el of oldPreviews) {
      el.classList.remove(previewClass);
    }

    // Add new preview classes when we have a start date and a hovered date
    if (this.state.selectionPhase !== 'start_selected') return;
    if (!this.state.rangeStart || !this.state.hoveredDate) return;

    const preview = ensureStartBeforeEnd(this.state.rangeStart, this.state.hoveredDate);
    const dayCells = this.popupContainer.querySelectorAll(`[data-tc-date]`);

    for (const cell of dayCells) {
      const dateStr = cell.getAttribute('data-tc-date');
      if (!dateStr) continue;

      const parts = dateStr.split('-');
      if (parts.length !== 3) continue;
      const [yStr, mStr, dStr] = parts;
      if (!yStr || !mStr || !dStr) continue;
      const cellDate = { year: parseInt(yStr, 10), month: parseInt(mStr, 10), day: parseInt(dStr, 10) };

      const isStart = isSameDay(cellDate, this.state.rangeStart!);
      if (!isStart && isBetween(cellDate, preview.start, preview.end)) {
        cell.classList.add(previewClass);
      }
    }
  }

  private addEntryAnimation(): void {
    const popup = this.popupContainer.firstElementChild as HTMLElement | null;
    if (!popup) return;
    const enteringClass = `${this.stylePrefix}-popup--entering`;
    popup.classList.add(enteringClass);
    popup.addEventListener('animationend', () => popup.classList.remove(enteringClass), { once: true });
  }

  private restoreFocus(): void {
    if (!this.state.focusedDate) return;

    const dateStr = calendarDateToString(this.state.focusedDate);
    const focusTarget = this.popupContainer.querySelector(
      `[data-tc-date="${dateStr}"]`,
    ) as HTMLElement | null;
    focusTarget?.focus();
  }

  private applyRange(): void {
    if (!this.state.rangeStart || !this.state.rangeEnd) return;
    this.appliedRange = { start: this.state.rangeStart, end: this.state.rangeEnd };
    this.options.onRangeSelect(this.appliedRange);
  }

  private revertToPreviousRange(): void {
    if (this.previousState) {
      this.state = {
        ...this.state,
        rangeStart: this.previousState.rangeStart,
        rangeEnd: this.previousState.rangeEnd,
        selectionPhase: this.previousState.selectionPhase,
        activePreset: this.previousState.activePreset,
      };
    }
  }

  private guardDestroyed(): void {
    if (this.destroyed) {
      throw new Error('TwoCal: instance has been destroyed');
    }
  }
}
