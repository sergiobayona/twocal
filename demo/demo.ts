import { TwoCal, formatDate } from '../src/index';
import type { DateRange } from '../src/index';

function formatRangeDisplay(range: DateRange): string {
  return `${formatDate(range.start, 'en-US')} — ${formatDate(range.end, 'en-US')}`;
}

// --- Default picker ---

const defaultTrigger = document.getElementById('trigger-default')!;
const defaultText = document.getElementById('trigger-default-text')!;
const defaultOutput = document.getElementById('output-default')!;

new TwoCal({
  trigger: defaultTrigger,
  onRangeSelect: (range) => {
    const display = formatRangeDisplay(range);
    defaultText.textContent = display;
    defaultOutput.textContent = JSON.stringify(range, null, 2);
  },
});

// --- Custom themed picker ---

const themedTrigger = document.getElementById('trigger-themed')!;
const themedText = document.getElementById('trigger-themed-text')!;
const themedOutput = document.getElementById('output-themed')!;

new TwoCal({
  trigger: themedTrigger,
  onRangeSelect: (range) => {
    const display = formatRangeDisplay(range);
    themedText.textContent = display;
    themedOutput.textContent = JSON.stringify(range, null, 2);
  },
  theme: {
    primaryColor: '#e11d48',
    primaryHoverColor: '#be123c',
    rangeHighlightColor: '#fff1f2',
    borderRadius: '16px',
  },
  firstDayOfWeek: 1,
});
