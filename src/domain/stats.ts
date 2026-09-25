import type { ActivitySummary } from './types';

export type NightlifeStats = {
  nights: number;
  monthNights: number;
  jumps: number;
  calories: number;
  distanceMeters: number;
  bestScore: ActivitySummary | null;
  bestJumps: ActivitySummary | null;
  longest: ActivitySummary | null;
};

function pickMax(items: ActivitySummary[], value: (item: ActivitySummary) => number): ActivitySummary | null {
  return items.reduce<ActivitySummary | null>((best, item) => {
    if (!best || value(item) > value(best)) return item;
    return best;
  }, null);
}

export function nightlifeStats(activities: ActivitySummary[], userId: string, now = Date.now()): NightlifeStats {
  const mine = activities.filter((item) => item.userId === userId);
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const month = mine.filter((item) => new Date(item.startedAt).getTime() >= monthStart.getTime());
  return {
    nights: mine.length,
    monthNights: month.length,
    jumps: mine.reduce((sum, item) => sum + item.jumps, 0),
    calories: mine.reduce((sum, item) => sum + item.calories, 0),
    distanceMeters: mine.reduce((sum, item) => sum + item.distanceMeters, 0),
    bestScore: pickMax(mine, (item) => item.partyScore),
    bestJumps: pickMax(mine, (item) => item.jumps),
    longest: pickMax(mine, (item) => item.activeSeconds),
  };
}

export function isSameMonth(iso: string, now = Date.now()): boolean {
  const date = new Date(iso);
  const current = new Date(now);
  return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
}
