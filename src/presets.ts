import type { PresetRange } from './types';
import { today, addDays, daysInMonth } from './calendar';

export function defaultPresets(): PresetRange[] {
  return [
    {
      label: 'Today',
      range: () => {
        const t = today();
        return { start: t, end: t };
      },
    },
    {
      label: 'Yesterday',
      range: () => {
        const y = addDays(today(), -1);
        return { start: y, end: y };
      },
    },
    {
      label: 'Last 7 Days',
      range: () => ({ start: addDays(today(), -6), end: today() }),
    },
    {
      label: 'Last 30 Days',
      range: () => ({ start: addDays(today(), -29), end: today() }),
    },
    {
      label: 'This Month',
      range: () => {
        const t = today();
        return { start: { year: t.year, month: t.month, day: 1 }, end: t };
      },
    },
    {
      label: 'Last Month',
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
