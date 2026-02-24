import { describe, it, expect } from 'vitest';
import { resolveTranslations, isRTL, en } from '../src/i18n';
import type { TwoCalTranslations } from '../src/types';

const expectedKeys: (keyof TwoCalTranslations)[] = [
  'today', 'yesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth',
  'cancel', 'apply', 'chooseDateRange', 'previousMonth', 'nextMonth',
];

describe('resolveTranslations', () => {
  it('returns English for en-US', () => {
    const t = resolveTranslations('en-US');
    expect(t.today).toBe('Today');
    expect(t.apply).toBe('Apply');
  });

  it('returns Chinese for zh-CN', () => {
    const t = resolveTranslations('zh-CN');
    expect(t.today).toBe('今天');
    expect(t.apply).toBe('确定');
  });

  it('returns Hindi for hi-IN', () => {
    const t = resolveTranslations('hi-IN');
    expect(t.today).toBe('आज');
  });

  it('returns Spanish for es', () => {
    const t = resolveTranslations('es');
    expect(t.today).toBe('Hoy');
    expect(t.cancel).toBe('Cancelar');
  });

  it('returns Spanish for es-MX variant', () => {
    const t = resolveTranslations('es-MX');
    expect(t.today).toBe('Hoy');
  });

  it('returns French for fr', () => {
    const t = resolveTranslations('fr');
    expect(t.today).toBe("Aujourd'hui");
    expect(t.apply).toBe('Appliquer');
  });

  it('returns Arabic for ar', () => {
    const t = resolveTranslations('ar');
    expect(t.today).toBe('اليوم');
    expect(t.apply).toBe('تطبيق');
  });

  it('falls back to English for unsupported locales', () => {
    const t = resolveTranslations('ko-KR');
    expect(t).toEqual(en);
  });

  it('merges partial overrides', () => {
    const t = resolveTranslations('es', { apply: 'Confirmar' });
    expect(t.apply).toBe('Confirmar');
    expect(t.cancel).toBe('Cancelar');
  });

  it('ignores undefined values in overrides', () => {
    const overrides = { apply: undefined } as unknown as Partial<TwoCalTranslations>;
    const t = resolveTranslations('en-US', overrides);
    expect(t.apply).toBe('Apply');
  });

  it('returns base translations when overrides is empty', () => {
    const t = resolveTranslations('en-US', {});
    expect(t).toEqual(en);
  });
});

describe('all translation bundles', () => {
  const locales = ['en', 'zh', 'hi', 'es', 'fr', 'ar'];

  for (const locale of locales) {
    it(`${locale} has all required keys`, () => {
      const t = resolveTranslations(locale);
      for (const key of expectedKeys) {
        expect(t[key], `missing key "${key}" in ${locale}`).toBeDefined();
        expect(typeof t[key], `key "${key}" in ${locale} should be string`).toBe('string');
        expect(t[key].length, `key "${key}" in ${locale} should not be empty`).toBeGreaterThan(0);
      }
    });
  }
});

describe('isRTL', () => {
  it('returns true for Arabic', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('ar-SA')).toBe(true);
  });

  it('returns false for English', () => {
    expect(isRTL('en-US')).toBe(false);
  });

  it('returns false for Chinese', () => {
    expect(isRTL('zh-CN')).toBe(false);
  });

  it('returns false for Spanish', () => {
    expect(isRTL('es')).toBe(false);
  });
});
