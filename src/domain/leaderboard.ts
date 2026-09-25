import type { ActivitySummary, PublicUser } from './types';

export type LeaderboardRow = {
  activity: ActivitySummary;
  user: PublicUser | null;
};

export function leaderboard(
  activities: ActivitySummary[],
  eventId: string,
  users: PublicUser[],
): LeaderboardRow[] {
  const best = new Map<string, ActivitySummary>();
  for (const activity of activities) {
    if (activity.eventId !== eventId || !activity.shared) continue;
    const previous = best.get(activity.userId);
    if (!previous || activity.partyScore > previous.partyScore) best.set(activity.userId, activity);
  }
  return [...best.values()]
    .map((activity) => ({
      activity,
      user: users.find((user) => user.id === activity.userId) ?? null,
    }))
    .sort((a, b) => b.activity.partyScore - a.activity.partyScore);
}

export function rankOf(rows: LeaderboardRow[], userId: string): { rank: number; total: number } | null {
  const index = rows.findIndex((row) => row.activity.userId === userId);
  if (index < 0) return null;
  return { rank: index + 1, total: rows.length };
}
