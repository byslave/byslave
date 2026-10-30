export type DateFilter = { kind: 'tonight' } | { kind: 'weekend' } | { kind: 'day'; iso: string };

export function localISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Upcoming Saturday and Sunday. Sunday returns that Sunday only. */
export function weekendDates(now: Date): string[] {
  if (now.getDay() === 0) return [localISODate(now)];
  const saturday = new Date(now);
  const delta = (6 - now.getDay() + 7) % 7;
  saturday.setDate(now.getDate() + delta);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return [localISODate(saturday), localISODate(sunday)];
}

export function eventMatchesDate(eventDate: string, filter: DateFilter, now: Date): boolean {
  if (filter.kind === 'tonight') return eventDate === localISODate(now);
  if (filter.kind === 'day') return eventDate === filter.iso;
  return weekendDates(now).includes(eventDate);
}

export function activeDateISO(filter: DateFilter, now: Date): string {
  if (filter.kind === 'tonight') return localISODate(now);
  if (filter.kind === 'day') return filter.iso;
  return weekendDates(now)[0] ?? localISODate(now);
}

export function nearestEventDate(dates: string[], now: Date): string | null {
  if (dates.length === 0) return null;
  const today = localISODate(now);
  const upcoming = dates.filter((date) => date >= today).sort();
  if (upcoming[0]) return upcoming[0];
  return [...dates].sort().at(-1) ?? null;
}

/** Monday-start week, in the local calendar. */
export function isInCurrentWeek(iso: string, now: Date): boolean {
  const date = new Date(now);
  const day = date.getDay();
  const delta = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - delta);
  const start = localISODate(date);
  const end = new Date(date);
  end.setDate(date.getDate() + 6);
  return iso >= start && iso <= localISODate(end);
}

export function upcomingDates(now: Date, count: number): string[] {
  const dates: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    dates.push(localISODate(date));
  }
  return dates;
}
