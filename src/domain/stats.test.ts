import { nightlifeStats, weekRhythm } from './stats';
import type { ActivitySummary } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date('2026-09-25T12:00:00Z').getTime();
const activity = {
  userId: 'me',
  partyScore: 40,
  jumps: 10,
  calories: 20,
  distanceMeters: 100,
  activeSeconds: 60,
  startedAt: '2026-09-10T20:00:00Z',
  title: 'Rave',
  id: 'a',
} as ActivitySummary;
const older = { ...activity, id: 'b', partyScore: 90, jumps: 4, startedAt: '2026-08-01T20:00:00Z', activeSeconds: 600 };

const stats = nightlifeStats([activity, older, { ...activity, id: 'c', userId: 'other', partyScore: 99 }], 'me', now);
assert(stats.nights === 2, 'iki gece');
assert(stats.monthNights === 1, 'bu ay bir gece');
assert(stats.bestScore?.id === 'b', 'rekor eski gecede');
assert(stats.jumps === 14, 'zıplama toplamı');
const weeks = weekRhythm([activity], 'me', now);
assert(weeks.length === 8, 'sekiz hafta');
assert(weeks.some((week) => week.nights === 1), 'eylül gecesi bir haftada');
console.log('stats ok');
