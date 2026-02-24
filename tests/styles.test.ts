import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_THEME,
  resolveTheme,
  buildStylesheet,
  injectStyles,
  removeStyles,
  generateStylePrefix,
} from '../src/styles';

describe('resolveTheme', () => {
  it('returns DEFAULT_THEME when no partial is given', () => {
    expect(resolveTheme()).toEqual(DEFAULT_THEME);
  });

  it('merges partial overrides', () => {
    const theme = resolveTheme({ primaryColor: '#e11d48' });
    expect(theme.primaryColor).toBe('#e11d48');
    expect(theme.backgroundColor).toBe(DEFAULT_THEME.backgroundColor);
  });

  it('ignores undefined values in partial', () => {
    // Simulate a partial with an undefined value (e.g. from user spreading)
    const partial = { primaryColor: undefined } as unknown as { primaryColor?: string };
    const theme = resolveTheme(partial);
    expect(theme.primaryColor).toBe(DEFAULT_THEME.primaryColor);
  });
});

describe('generateStylePrefix', () => {
  it('returns unique prefixes on each call', () => {
    const a = generateStylePrefix();
    const b = generateStylePrefix();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^tc-/);
  });
});

describe('buildStylesheet', () => {
  it('produces CSS with the given prefix', () => {
    const css = buildStylesheet(DEFAULT_THEME, 'tc-test');
    expect(css).toContain('.tc-test-popup');
    expect(css).toContain('.tc-test-day');
    expect(css).toContain('.tc-test-preset');
    expect(css).toContain('.tc-test-btn--primary');
  });

  it('includes theme values as CSS custom properties', () => {
    const css = buildStylesheet(DEFAULT_THEME, 'tc-x');
    expect(css).toContain(`--tc-primary: ${DEFAULT_THEME.primaryColor}`);
    expect(css).toContain(`--tc-bg: ${DEFAULT_THEME.backgroundColor}`);
  });
});

describe('injectStyles / removeStyles', () => {
  let styleEl: HTMLStyleElement;

  beforeEach(() => {
    styleEl = injectStyles(DEFAULT_THEME, 'tc-inject');
  });

  afterEach(() => {
    if (styleEl.parentNode) {
      removeStyles(styleEl);
    }
  });

  it('injects a style element into document.head', () => {
    expect(styleEl.parentNode).toBe(document.head);
    expect(styleEl.getAttribute('data-twocal')).toBe('tc-inject');
    expect(styleEl.textContent).toContain('.tc-inject-popup');
  });

  it('removes the style element', () => {
    removeStyles(styleEl);
    expect(styleEl.parentNode).toBeNull();
  });
});
