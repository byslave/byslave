import type { ActivitySummary } from './types';

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export type YearWrapped = {
  year: number;
  nights: number;
  hours: number;
  jumps: number;
  topVenue: string | null;
  best: ActivitySummary | null;
  months: { label: string; nights: number }[];
};

export function yearWrapped(activities: ActivitySummary[], userId: string, year = new Date().getFullYear()): YearWrapped {
  const mine = activities.filter((item) => item.userId === userId && new Date(item.startedAt).getFullYear() === year);
  const venues = new Map<string, number>();
  for (const item of mine) venues.set(item.venue, (venues.get(item.venue) ?? 0) + 1);
  const topVenue = [...venues.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const best = mine.reduce<ActivitySummary | null>((chosen, item) => (!chosen || item.partyScore > chosen.partyScore ? item : chosen), null);
  return {
    year,
    nights: mine.length,
    hours: mine.reduce((sum, item) => sum + item.activeSeconds, 0) / 3600,
    jumps: mine.reduce((sum, item) => sum + item.jumps, 0),
    topVenue,
    best,
    months: months.map((label, index) => ({
      label,
      nights: mine.filter((item) => new Date(item.startedAt).getMonth() === index).length,
    })),
  };
}
