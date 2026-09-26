import type { ActivitySummary, NightEvent } from './types';

export function eventPulse(event: NightEvent, activities: ActivitySummary[]) {
  const nights = activities.filter((item) => item.eventId === event.id && item.shared);
  const top = [...nights].sort((a, b) => b.respectIds.length - a.respectIds.length)[0] ?? null;
  const avgScore = nights.length ? Math.round(nights.reduce((sum, item) => sum + item.partyScore, 0) / nights.length) : null;
  return {
    nights: nights.length,
    avgBpm: event.musicBpm,
    attendees: event.attendeeIds.length,
    topRespects: top?.respectIds.length ?? 0,
    avgScore,
  };
}

export function averageMusicBpm(activities: ActivitySummary[], userId: string): number | null {
  const values = activities.flatMap((item) => (item.userId === userId && item.musicBpm != null ? [item.musicBpm] : []));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function similarByBpm(events: NightEvent[], average: number | null): NightEvent[] {
  if (average == null) return [];
  return events.filter((event) => event.musicBpm != null && Math.abs(event.musicBpm - average) <= 8);
}
