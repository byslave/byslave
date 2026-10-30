export function formatNumber(value: number, language: string): string {
  const locale = language.startsWith('en') ? 'en-US' : 'tr-TR';
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDayLabel(iso: string, language: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  const locale = language.startsWith('en') ? 'en-GB' : 'tr-TR';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

export function formatClockRange(start: string, end: string): string {
  return `${start}–${end}`;
}
