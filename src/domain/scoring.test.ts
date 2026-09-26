import { makeDemoSample } from '../motion/demo';
import { leaderboard } from './leaderboard';
import { buildSummary, countJumps, estimateCalories, scoreParty } from './scoring';
import type { ActivitySummary, PublicUser } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const flat = [0, 1, 2].map((index) => ({ ...makeDemoSample(1), t: index, az: 1 }));
assert(countJumps(flat) === 0, 'düz hareket zıplama saymamalı');

const spike = [
  { ...makeDemoSample(1), az: 1 },
  { ...makeDemoSample(1), az: 3.2 },
  { ...makeDemoSample(1), az: 1 },
  { ...makeDemoSample(1), az: 3.4 },
];
assert(countJumps(spike) === 2, 'iki sıçrama sayılmalı');

const samples = Array.from({ length: 40 }, (_, index) => ({ ...makeDemoSample(index), heartRate: 140 }));
assert(makeDemoSample(2).heartRate == null, 'demo örnek nabız taşımaz');
assert(countJumps(samples) > 0, 'demo akış zıplama üretmeli');

const summary = buildSummary({
  id: 't',
  userId: 'u',
  event: null,
  activeSeconds: 16,
  samples,
  body: { age: 28, heightCm: 175, weightKg: 70, sex: 'male', fitnessLevel: 'medium' },
  shared: true,
  heartRateOrigin: 'measured',
});
assert(summary.jumps > 0, 'özette zıplama olmalı');
assert(summary.distanceMeters > 0, 'özette mesafe olmalı');
assert(summary.calories > 0, 'özette kalori olmalı');
assert(summary.partyScore >= 0 && summary.partyScore <= 100, 'skor 0-100');
assert(summary.calorieMethod === 'heart-rate', 'yaş, kilo ve cinsiyet varsa nabız formülü');

const motionOnly = estimateCalories({
  intensity: 0.5,
  activeSeconds: 3600,
  body: { age: null, heightCm: null, weightKg: null, sex: null, fitnessLevel: 'medium' },
  avgHeartRate: 140,
  heartRateOrigin: 'estimated',
});
assert(motionOnly.method === 'motion', 'eksik beden ölçüsünde hareket formülü');
assert(motionOnly.assumedWeight, 'kilo yoksa varsayılan kilo işaretlenmeli');

assert(scoreParty({ intensity: 0, jumps: 0, calories: 0, activeSeconds: 0, distanceMeters: 0 }) === 0, 'boş gece 0');

const user: PublicUser = { id: 'a', displayName: 'A', username: 'a', avatarColor: '#111' };
const other: PublicUser = { id: 'b', displayName: 'B', username: 'b', avatarColor: '#222' };
const base = summary;
const rows = leaderboard(
  [
    { ...base, id: '1', userId: 'a', eventId: 'e', partyScore: 40, shared: true },
    { ...base, id: '2', userId: 'b', eventId: 'e', partyScore: 70, shared: true },
    { ...base, id: '3', userId: 'a', eventId: 'e', partyScore: 90, shared: false },
  ] as ActivitySummary[],
  'e',
  [user, other],
);
assert(rows[0]?.user?.id === 'b', 'paylaşılmayan kayıt liderliği geçmemeli');
assert(rows.length === 2, 'iki kişi');

console.log('scoring tests ok', { jumps: summary.jumps, kcal: summary.calories, score: summary.partyScore });
