import type { TwoCalTheme, ResolvedTheme } from './types';

export const DEFAULT_THEME: ResolvedTheme = {
  primaryColor: '#4f46e5',
  primaryHoverColor: '#4338ca',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  textMutedColor: '#9ca3af',
  borderColor: '#e5e7eb',
  borderRadius: '12px',
  rangeHighlightColor: '#eef2ff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  zIndex: '9999',
};

let prefixCounter = 0;

export function generateStylePrefix(): string {
  prefixCounter += 1;
  return `tc-${prefixCounter.toString(36)}`;
}

export function resolveTheme(partial?: TwoCalTheme): ResolvedTheme {
  if (!partial) return DEFAULT_THEME;
  const entries = Object.entries(partial).filter(([, v]) => v !== undefined);
  return { ...DEFAULT_THEME, ...Object.fromEntries(entries) } as ResolvedTheme;
}

export function injectStyles(theme: ResolvedTheme, prefix: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('data-twocal', prefix);
  style.textContent = buildStylesheet(theme, prefix);
  document.head.appendChild(style);
  return style;
}

export function removeStyles(styleElement: HTMLStyleElement): void {
  styleElement.remove();
}

export function buildStylesheet(theme: ResolvedTheme, p: string): string {
  return `
.${p}-popup {
  --tc-primary: ${theme.primaryColor};
  --tc-primary-hover: ${theme.primaryHoverColor};
  --tc-bg: ${theme.backgroundColor};
  --tc-text: ${theme.textColor};
  --tc-text-muted: ${theme.textMutedColor};
  --tc-border: ${theme.borderColor};
  --tc-radius: ${theme.borderRadius};
  --tc-range-bg: ${theme.rangeHighlightColor};
  --tc-font: ${theme.fontFamily};
  --tc-font-size: ${theme.fontSize};

  position: fixed;
  z-index: ${theme.zIndex};
  display: flex;
  background: var(--tc-bg);
  border: 1px solid var(--tc-border);
  border-radius: var(--tc-radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08);
  font-family: var(--tc-font);
  font-size: var(--tc-font-size);
  color: var(--tc-text);
  user-select: none;
}

.${p}-popup--entering {
  animation: ${p}-fadeIn 0.15s ease-out;
}

@keyframes ${p}-fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.${p}-presets {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px;
  border-right: 1px solid var(--tc-border);
  min-width: 150px;
}

.${p}-preset {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--tc-text);
  font-family: var(--tc-font);
  font-size: var(--tc-font-size);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
}

.${p}-preset:hover {
  background: var(--tc-range-bg);
}

.${p}-preset--active {
  background: var(--tc-primary);
  color: #fff;
}

.${p}-preset--active:hover {
  background: var(--tc-primary-hover);
}

.${p}-body {
  display: flex;
  flex-direction: column;
}

.${p}-calendars {
  display: flex;
  gap: 16px;
  padding: 16px 16px 8px;
}

.${p}-calendar {
  width: 280px;
}

.${p}-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;
}

.${p}-header-title {
  font-weight: 600;
  font-size: 15px;
}

.${p}-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--tc-text);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.1s;
}

.${p}-nav-btn:hover {
  background: var(--tc-range-bg);
}

.${p}-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 4px;
}

.${p}-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--tc-text-muted);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.${p}-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
}

.${p}-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--tc-text);
  font-family: var(--tc-font);
  font-size: var(--tc-font-size);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  position: relative;
}

.${p}-day:hover:not(.${p}-day--disabled):not(.${p}-day--empty) {
  background: var(--tc-range-bg);
}

.${p}-day--today {
  font-weight: 700;
}

.${p}-day--today::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--tc-primary);
}

.${p}-day--in-range {
  background: var(--tc-range-bg);
}

.${p}-day--preview {
  background: var(--tc-range-bg);
  opacity: 0.7;
}

.${p}-day--start,
.${p}-day--end {
  background: var(--tc-primary);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
}

.${p}-day--start:hover,
.${p}-day--end:hover {
  background: var(--tc-primary-hover);
}

.${p}-day--start.${p}-day--today::after,
.${p}-day--end.${p}-day--today::after {
  background: #fff;
}

.${p}-day--disabled {
  color: var(--tc-text-muted);
  opacity: 0.4;
  cursor: not-allowed;
}

.${p}-day--empty {
  cursor: default;
}

.${p}-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--tc-border);
}

.${p}-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-family: var(--tc-font);
  font-size: var(--tc-font-size);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.${p}-btn--primary {
  background: var(--tc-primary);
  color: #fff;
}

.${p}-btn--primary:hover {
  background: var(--tc-primary-hover);
}

.${p}-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.${p}-btn--secondary {
  background: transparent;
  color: var(--tc-text);
  border: 1px solid var(--tc-border);
}

.${p}-btn--secondary:hover {
  background: var(--tc-range-bg);
}

.${p}-hidden {
  display: none;
}

.${p}-popup[dir="rtl"] .${p}-presets {
  border-right: none;
  border-left: 1px solid var(--tc-border);
}

.${p}-popup[dir="rtl"] .${p}-preset {
  text-align: right;
}

.${p}-popup[dir="rtl"] .${p}-footer {
  justify-content: flex-start;
}
`.trim();
}
