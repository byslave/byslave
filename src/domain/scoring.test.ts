import { makeDemoSample } from '../motion/demo';
import { leaderboard } from './leaderboard';
import { buildSummary, countJumps, estimateCalories, movingCalorieWindow, routeSpanMeters, sampleIntensity, scoreParty } from './scoring';
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

const still = [
  { t: 0, ax: 0.02, ay: 0.99, az: 0.04 },
  { t: 400, ax: 0, ay: 1.01, az: 0 },
  { t: 800, ax: 0.98, ay: 0.05, az: 0.02 },
];
assert(countJumps(still) === 0, 'elde duran telefon zıplama saymamalı');
assert(sampleIntensity(still[0]!) === 0, 'elde duran telefonun yoğunluğu 0');
assert(
  sampleIntensity({ t: 0, ax: 0.12, ay: 1.08, az: 0.1 }) === 0,
  'hafif titreme duruyor sayılmalı',
);
assert(
  countJumps([
    { t: 0, ax: 0, ay: 1, az: 0 },
    { t: 1, ax: 0, ay: 3.1, az: 0.1 },
    { t: 2, ax: 0, ay: 1, az: 0 },
  ]) === 1,
  'dik tutulan telefonda sıçrama y ekseninden sayılmalı',
);
const sitting = estimateCalories({
  intensity: 0,
  activeSeconds: 600,
  body: { age: null, heightCm: null, weightKg: 70, sex: null, fitnessLevel: 'medium' },
  avgHeartRate: null,
  heartRateOrigin: 'none',
});
assert(sitting.calories === 0, 'hareketsiz kayıt kalori yazmamalı');

const stillWithHr = estimateCalories({
  intensity: 0,
  activeSeconds: 600,
  body: { age: 28, heightCm: 175, weightKg: 70, sex: 'male', fitnessLevel: 'medium' },
  avgHeartRate: 145,
  heartRateOrigin: 'measured',
});
assert(stillWithHr.calories === 0, 'dururken nabız da kalori yazmamalı');

const windowStill = movingCalorieWindow({ movingCount: 0, sampleCount: 300, intensitySum: 0, elapsedSeconds: 600 });
assert(windowStill.activeSeconds === 0 && windowStill.intensity === 0, 'hareketsiz pencerede süre 0');
const windowMix = movingCalorieWindow({
  movingCount: 10,
  sampleCount: 100,
  intensitySum: 5,
  elapsedSeconds: 200,
});
assert(windowMix.intensity === 0.5, 'kalori yoğunluğu yalnız hareketli örneklerden');
assert(windowMix.activeSeconds === 20, 'kalori süresi hareket payı kadar');

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
assert(summary.photoUris.length === 0, 'yeni gece fotosuz başlar');
assert(routeSpanMeters([{ lat: 41, lng: 29, t: 0 }]) === 0, 'tek nokta yayılmaz');
assert(routeSpanMeters([{ lat: 41.0255, lng: 28.9742, t: 0 }, { lat: 41.02552, lng: 28.97422, t: 1 }]) < 40, 'salon içi çizgi rota sayılmaz');
assert(summary.calorieMethod === 'heart-rate', 'yaş, kilo ve cinsiyet varsa nabız formülü');

const idle = { t: 0, ax: 0.02, ay: 0.99, az: 0.03 };
const dance = { t: 0, ax: 0.45, ay: 0.35, az: 1.85 };
const body = { age: 28, heightCm: 175, weightKg: 70, sex: 'male' as const, fitnessLevel: 'medium' as const };
const standing = buildSummary({
  id: 'still',
  userId: 'u',
  event: null,
  activeSeconds: 600,
  samples: Array.from({ length: 200 }, (_, index) => ({ ...idle, t: index, heartRate: 140 })),
  body,
  shared: false,
  heartRateOrigin: 'measured',
});
assert(standing.calories === 0, '600 sn duruş kalori basmamalı');
assert(standing.jumps === 0, 'duruş zıplama saymamalı');

const burstThenIdle = buildSummary({
  id: 'mix',
  userId: 'u',
  event: null,
  activeSeconds: 600,
  samples: [
    ...Array.from({ length: 10 }, (_, index) => ({ ...dance, t: index })),
    ...Array.from({ length: 190 }, (_, index) => ({ ...idle, t: 10 + index })),
  ],
  body,
  shared: false,
  heartRateOrigin: 'none',
});
const dancingWhole = buildSummary({
  id: 'all',
  userId: 'u',
  event: null,
  activeSeconds: 600,
  samples: Array.from({ length: 200 }, (_, index) => ({ ...dance, t: index })),
  body,
  shared: false,
  heartRateOrigin: 'none',
});
assert(burstThenIdle.calories > 0, 'kısa hareket biraz kalori yazar');
assert(
  burstThenIdle.calories < dancingWhole.calories * 0.12,
  'duruş süresi kaloriyi şişirmemeli',
);

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
