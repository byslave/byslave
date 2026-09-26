import { badgeBoard } from './badges';
import { crossedWith } from './paths';
import { partyScoreParts } from './scoring';
import { sustainedHighHeartRate } from './safety';
import { activityNotices } from './notices';
import type { ActivitySample, ActivitySummary } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const night = {
  id: '1',
  userId: 'me',
  eventId: 'evt',
  title: 'Gece',
  venue: 'Karaköy',
  startedAt: '2026-09-07T22:00:00Z',
  endedAt: '2026-09-08T04:00:00Z',
  activeSeconds: 6 * 60 * 60,
  calories: 400,
  calorieMethod: 'motion',
  assumedWeight: false,
  jumps: 120,
  distanceMeters: 1000,
  intensity: 0.5,
  peakIntensity: 0.8,
  peakOffsetSeconds: 10,
  avgHeartRate: null,
  peakHeartRate: null,
  heartRateOrigin: 'none',
  musicBpm: 130,
  nightKind: 'rave',
  note: null,
  respectIds: ['usr_ece'],
  partyScore: 40,
  route: [],
  intensitySeries: [],
  shared: true,
  locationShared: false,
} as ActivitySummary;

const badges = badgeBoard(
  [
    night,
    { ...night, id: '2', startedAt: '2026-09-14T22:00:00Z', endedAt: '2026-09-15T01:00:00Z', activeSeconds: 60, jumps: 1 },
    { ...night, id: '3', startedAt: '2026-09-21T22:00:00Z', endedAt: '2026-09-22T01:00:00Z', activeSeconds: 60, jumps: 1, venue: 'Beşiktaş' },
  ],
  'me',
);
assert(Boolean(badges.find((item) => item.key === 'first-night')?.earnedAt), 'ilk gece');
assert(Boolean(badges.find((item) => item.key === 'three-weeks')?.earnedAt), 'üç hafta');
assert(Boolean(badges.find((item) => item.key === 'hundred-jumps')?.earnedAt), '100 zıplama');
assert(Boolean(badges.find((item) => item.key === 'all-nighter')?.earnedAt), 'altı saat');
assert(!badges.find((item) => item.key === 'four-venues')?.earnedAt, 'iki mekân yetmez');

const other = { ...night, id: 'o', userId: 'ece', respectIds: [] };
assert(crossedWith([night, other], 'me')[0]?.times === 1, 'aynı gece bir kez');
assert(crossedWith([night, { ...other, eventId: 'baska', venue: 'Başka' }], 'me').length === 0, 'farklı gece sayılmaz');

const parts = partyScoreParts({ intensity: 0.8, jumps: 400, calories: 700, activeSeconds: 90 * 60, distanceMeters: 3000 });
assert(parts.reduce((sum, part) => sum + part.points, 0) === 100, 'dolu gece 100 puan dağılır');
assert(parts.map((part) => part.label).join(',') === 'Yoğunluk,Zıplama,Kalori,Süre,Mesafe', 'parça adları');

const samples: ActivitySample[] = [
  { t: 0, ax: 0, ay: 0, az: 1, heartRate: 180 },
  { t: 50_000, ax: 0, ay: 0, az: 1, heartRate: 180 },
];
assert(sustainedHighHeartRate(samples, 'measured'), 'uzun yüksek nabız su molası');
assert(!sustainedHighHeartRate(samples, 'none'), 'saat yoksa nabız uyarısı yok');
assert(!sustainedHighHeartRate([{ ...samples[0], t: 0 }, { ...samples[1], t: 1000 }], 'measured'), 'kısa sıçrama yetmez');

const notes = activityNotices({
  profileId: 'me',
  activities: [night],
  comments: [],
  events: [],
  users: [{ id: 'usr_ece', displayName: 'Ece', username: 'ece', avatarColor: '#111' }],
  followingIds: [],
  now: new Date('2026-09-08T05:00:00Z').getTime(),
});
assert(notes.some((item) => item.title.includes('Ece')), 'saygı bildirimi');

console.log('social tests ok');
