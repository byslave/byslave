import type { ActivitySummary } from './types';

export type PathCross = { userId: string; times: number; venue: string };

function sameNight(a: ActivitySummary, b: ActivitySummary): boolean {
  const sameEvent = Boolean(a.eventId && a.eventId === b.eventId);
  const sameVenue = a.venue.trim().toLocaleLowerCase('tr-TR') === b.venue.trim().toLocaleLowerCase('tr-TR');
  if (!sameEvent && !sameVenue) return false;
  const a0 = new Date(a.startedAt).getTime();
  const a1 = new Date(a.endedAt).getTime();
  const b0 = new Date(b.startedAt).getTime();
  const b1 = new Date(b.endedAt).getTime();
  return a0 < b1 && b0 < a1;
}

export function crossedWith(activities: ActivitySummary[], userId: string): PathCross[] {
  const mine = activities.filter((item) => item.userId === userId);
  const counts = new Map<string, PathCross>();
  for (const night of mine) {
    const hit = new Set<string>();
    for (const other of activities) {
      if (other.userId === userId || !other.shared || hit.has(other.userId)) continue;
      if (!sameNight(night, other)) continue;
      hit.add(other.userId);
      const current = counts.get(other.userId) ?? { userId: other.userId, times: 0, venue: other.venue };
      current.times += 1;
      current.venue = other.venue;
      counts.set(other.userId, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.times - a.times);
}
