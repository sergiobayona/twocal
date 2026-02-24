import type { PresetRange, TwoCalTranslations } from './types';
import { today, addDays, daysInMonth } from './calendar';
import { en } from './i18n';

export function defaultPresets(translations: TwoCalTranslations = en): PresetRange[] {
  return [
    {
      label: translations.today,
      range: () => {
        const t = today();
        return { start: t, end: t };
      },
    },
    {
      label: translations.yesterday,
      range: () => {
        const y = addDays(today(), -1);
        return { start: y, end: y };
      },
    },
    {
      label: translations.last7Days,
      range: () => ({ start: addDays(today(), -6), end: today() }),
    },
    {
      label: translations.last30Days,
      range: () => ({ start: addDays(today(), -29), end: today() }),
    },
    {
      label: translations.thisMonth,
      range: () => {
        const t = today();
        return { start: { year: t.year, month: t.month, day: 1 }, end: t };
      },
    },
    {
      label: translations.lastMonth,
      range: () => {
        const t = today();
        const prevMonth = t.month === 1 ? 12 : t.month - 1;
        const prevYear = t.month === 1 ? t.year - 1 : t.year;
        return {
          start: { year: prevYear, month: prevMonth, day: 1 },
          end: { year: prevYear, month: prevMonth, day: daysInMonth(prevYear, prevMonth) },
        };
      },
    },
  ];
}
