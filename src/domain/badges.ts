import type { ActivitySummary } from './types';

export type BadgeView = {
  key: string;
  title: string;
  description: string;
  earnedAt: string | null;
};

const weekMs = 7 * 24 * 60 * 60 * 1000;

function weekStart(time: number): number {
  const monday = new Date(time);
  monday.setHours(0, 0, 0, 0);
  const weekday = monday.getDay();
  monday.setDate(monday.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return monday.getTime();
}

function longestStreak(activities: ActivitySummary[]): { length: number; earnedAt: string | null } {
  const weeks = [...new Set(activities.map((item) => weekStart(new Date(item.startedAt).getTime())))].sort((a, b) => a - b);
  let streak = 0;
  let best = 0;
  let earnedAt: string | null = null;
  for (const week of weeks) {
    const previous = weeks[weeks.indexOf(week) - 1];
    streak = previous != null && week - previous === weekMs ? streak + 1 : 1;
    if (streak > best) {
      best = streak;
      const inWeek = activities
        .filter((item) => weekStart(new Date(item.startedAt).getTime()) === week)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
      earnedAt = inWeek[0]?.startedAt ?? null;
    }
  }
  return { length: best, earnedAt };
}

export function badgeBoard(activities: ActivitySummary[], userId: string): BadgeView[] {
  const mine = activities.filter((item) => item.userId === userId).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const first = mine[0] ?? null;
  const streak = longestStreak(mine);
  const venues: string[] = [];
  let fourthVenueAt: string | null = null;
  for (const item of mine) {
    if (!venues.includes(item.venue)) venues.push(item.venue);
    if (venues.length === 4 && !fourthVenueAt) fourthVenueAt = item.startedAt;
  }
  const venueCounts = new Map<string, { count: number; at: string }>();
  for (const item of mine) {
    const current = venueCounts.get(item.venue) ?? { count: 0, at: item.startedAt };
    current.count += 1;
    current.at = item.startedAt;
    venueCounts.set(item.venue, current);
  }
  const regular = [...venueCounts.values()].find((item) => item.count >= 5) ?? null;
  const allNighter = mine.find((item) => item.activeSeconds >= 6 * 60 * 60) ?? null;
  const jumps = mine.find((item) => item.jumps >= 100) ?? null;
  const after = mine.find((item) => item.nightKind === 'after') ?? null;
  return [
    { key: 'first-night', title: 'İlk gece', description: 'Bir geceyi bitir.', earnedAt: first?.startedAt ?? null },
    { key: 'three-weeks', title: '3 hafta', description: 'Üst üste üç hafta gece.', earnedAt: streak.length >= 3 ? streak.earnedAt : null },
    { key: 'four-venues', title: '4 mekân', description: 'Dört farklı mekân.', earnedAt: fourthVenueAt },
    { key: 'all-nighter', title: 'Sabah', description: 'Altı saat ve üzeri.', earnedAt: allNighter?.startedAt ?? null },
    { key: 'hundred-jumps', title: '100 zıplama', description: 'Tek gecede 100 zıplama.', earnedAt: jumps?.startedAt ?? null },
    { key: 'first-after', title: 'İlk after', description: 'Bir after gecesi.', earnedAt: after?.startedAt ?? null },
    { key: 'venue-regular', title: '5. gidiş', description: 'Aynı mekâna beş kez.', earnedAt: regular?.at ?? null },
  ];
}
