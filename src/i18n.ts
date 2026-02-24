import type { TwoCalTranslations } from './types';

export const en: TwoCalTranslations = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 Days',
  last30Days: 'Last 30 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  cancel: 'Cancel',
  apply: 'Apply',
  chooseDateRange: 'Choose date range',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
};

const zh: TwoCalTranslations = {
  today: '今天',
  yesterday: '昨天',
  last7Days: '最近7天',
  last30Days: '最近30天',
  thisMonth: '本月',
  lastMonth: '上月',
  cancel: '取消',
  apply: '确定',
  chooseDateRange: '选择日期范围',
  previousMonth: '上个月',
  nextMonth: '下个月',
};

const hi: TwoCalTranslations = {
  today: 'आज',
  yesterday: 'कल',
  last7Days: 'पिछले 7 दिन',
  last30Days: 'पिछले 30 दिन',
  thisMonth: 'इस महीने',
  lastMonth: 'पिछला महीना',
  cancel: 'रद्द करें',
  apply: 'लागू करें',
  chooseDateRange: 'तारीख सीमा चुनें',
  previousMonth: 'पिछला महीना',
  nextMonth: 'अगला महीना',
};

const es: TwoCalTranslations = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7Days: 'Últimos 7 días',
  last30Days: 'Últimos 30 días',
  thisMonth: 'Este mes',
  lastMonth: 'Mes anterior',
  cancel: 'Cancelar',
  apply: 'Aplicar',
  chooseDateRange: 'Elegir rango de fechas',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
};

const fr: TwoCalTranslations = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  last7Days: '7 derniers jours',
  last30Days: '30 derniers jours',
  thisMonth: 'Ce mois-ci',
  lastMonth: 'Mois dernier',
  cancel: 'Annuler',
  apply: 'Appliquer',
  chooseDateRange: 'Choisir une plage de dates',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
};

const ar: TwoCalTranslations = {
  today: 'اليوم',
  yesterday: 'أمس',
  last7Days: 'آخر 7 أيام',
  last30Days: 'آخر 30 يوم',
  thisMonth: 'هذا الشهر',
  lastMonth: 'الشهر الماضي',
  cancel: 'إلغاء',
  apply: 'تطبيق',
  chooseDateRange: 'اختر نطاق التاريخ',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
};

const pt: TwoCalTranslations = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last7Days: 'Últimos 7 dias',
  last30Days: 'Últimos 30 dias',
  thisMonth: 'Este mês',
  lastMonth: 'Mês anterior',
  cancel: 'Cancelar',
  apply: 'Aplicar',
  chooseDateRange: 'Escolher intervalo de datas',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
};

const de: TwoCalTranslations = {
  today: 'Heute',
  yesterday: 'Gestern',
  last7Days: 'Letzte 7 Tage',
  last30Days: 'Letzte 30 Tage',
  thisMonth: 'Dieser Monat',
  lastMonth: 'Letzter Monat',
  cancel: 'Abbrechen',
  apply: 'Übernehmen',
  chooseDateRange: 'Datumsbereich wählen',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
};

const ru: TwoCalTranslations = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  last7Days: 'Последние 7 дней',
  last30Days: 'Последние 30 дней',
  thisMonth: 'Этот месяц',
  lastMonth: 'Прошлый месяц',
  cancel: 'Отмена',
  apply: 'Применить',
  chooseDateRange: 'Выберите диапазон дат',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
};

const ja: TwoCalTranslations = {
  today: '今日',
  yesterday: '昨日',
  last7Days: '過去7日間',
  last30Days: '過去30日間',
  thisMonth: '今月',
  lastMonth: '先月',
  cancel: 'キャンセル',
  apply: '適用',
  chooseDateRange: '日付範囲を選択',
  previousMonth: '前月',
  nextMonth: '翌月',
};

export const translationMap: Record<string, TwoCalTranslations> = {
  en, zh, hi, es, fr, ar, pt, de, ru, ja,
};

export function resolveTranslations(
  locale: string,
  overrides?: Partial<TwoCalTranslations>,
): TwoCalTranslations {
  const language = new Intl.Locale(locale).language;
  const base = translationMap[language] ?? en;

  if (!overrides) return base;

  const entries = Object.entries(overrides).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return base;

  return { ...base, ...Object.fromEntries(entries) } as TwoCalTranslations;
}

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTL(locale: string): boolean {
  const language = new Intl.Locale(locale).language;
  return RTL_LANGUAGES.has(language);
}
