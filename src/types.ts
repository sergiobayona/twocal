// ---- Core Value Types ----

export interface CalendarDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

export interface DateRange {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

// ---- State Types ----

export type SelectionPhase = 'idle' | 'start_selected' | 'range_complete';

export interface TwoCalState {
  readonly isOpen: boolean;
  readonly displayMonth: CalendarDate; // year+month of left calendar (day ignored)
  readonly selectionPhase: SelectionPhase;
  readonly rangeStart: CalendarDate | null;
  readonly rangeEnd: CalendarDate | null;
  readonly hoveredDate: CalendarDate | null;
  readonly activePreset: string | null;
  readonly focusedDate: CalendarDate | null;
}

// ---- Configuration Types ----

export interface PresetRange {
  readonly label: string;
  readonly range: () => DateRange;
}

export interface TwoCalTheme {
  readonly primaryColor?: string;
  readonly primaryHoverColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly textMutedColor?: string;
  readonly borderColor?: string;
  readonly borderRadius?: string;
  readonly rangeHighlightColor?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly zIndex?: string;
}

export type ResolvedTheme = Required<TwoCalTheme>;

export type Placement = 'bottom' | 'top';

export interface TwoCalOptions {
  readonly trigger: HTMLElement;
  readonly onRangeSelect: (range: DateRange) => void;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly presets?: PresetRange[];
  readonly theme?: TwoCalTheme;
  readonly initialRange?: DateRange;
  readonly minDate?: CalendarDate;
  readonly maxDate?: CalendarDate;
  readonly placement?: Placement;
  readonly firstDayOfWeek?: 0 | 1;
  readonly locale?: string;
  readonly container?: HTMLElement;
}

// ---- Rendering Types ----

export interface CalendarMonth {
  readonly year: number;
  readonly month: number;
  readonly weeks: ReadonlyArray<ReadonlyArray<CalendarDate | null>>;
}

export interface RenderConfig {
  readonly locale: string;
  readonly firstDayOfWeek: 0 | 1;
  readonly presets: ReadonlyArray<PresetRange>;
  readonly minDate?: CalendarDate | undefined;
  readonly maxDate?: CalendarDate | undefined;
  readonly stylePrefix: string;
}

// ---- State Actions ----

export type StateAction =
  | { readonly type: 'OPEN' }
  | { readonly type: 'CLOSE' }
  | { readonly type: 'SELECT_DATE'; readonly date: CalendarDate }
  | { readonly type: 'HOVER_DATE'; readonly date: CalendarDate }
  | { readonly type: 'CLEAR_HOVER' }
  | { readonly type: 'NAVIGATE_MONTH'; readonly delta: number }
  | { readonly type: 'SELECT_PRESET'; readonly preset: string; readonly range: DateRange }
  | { readonly type: 'FOCUS_DATE'; readonly date: CalendarDate }
  | { readonly type: 'APPLY' }
  | { readonly type: 'CANCEL' };

// ---- Event Types ----

export type EventDispatcher = (action: StateAction) => void;

export interface EventConfig {
  readonly stylePrefix: string;
  readonly presets: ReadonlyArray<PresetRange>;
}

// ---- Position Types ----

export interface PositionResult {
  readonly top: number;
  readonly left: number;
  readonly placement: Placement;
}
