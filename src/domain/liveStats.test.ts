import { addSample, emptyTotals, intensitySeries, liveStats, needsWaterBreak, summaryFromTotals } from './liveStats';
import { buildSummary } from './scoring';
import type { ActivitySample, BodyProfile } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function close(a: number, b: number, tolerance = 1e-9) {
  return Math.abs(a - b) <= tolerance;
}

const body: BodyProfile = { age: 28, heightCm: 175, weightKg: 70, sex: 'male', fitnessLevel: 'medium' };

function stream(count: number, withHeartRate: boolean): ActivitySample[] {
  return Array.from({ length: count }, (_, i) => {
    const jumping = i % 7 === 0 && i > 0;
    const sample: ActivitySample = {
      t: i * 200,
      ax: Math.sin(i / 3) * 0.4,
      ay: Math.cos(i / 5) * 0.3,
      az: jumping ? 2.6 : 1 + Math.sin(i / 2) * 0.2,
      lat: 41.0255 + Math.sin(i / 40) * 0.0004,
      lng: 28.9742 + Math.cos(i / 40) * 0.0004,
    };
    if (withHeartRate) sample.heartRate = 120 + (i % 30);
    return sample;
  });
}

function fold(samples: ActivitySample[]) {
  const totals = emptyTotals();
  for (const sample of samples) addSample(totals, sample);
  return totals;
}

for (const withHeartRate of [false, true]) {
  const origin = withHeartRate ? ('measured' as const) : ('none' as const);
  const samples = stream(900, withHeartRate);
  const activeSeconds = (samples.length * 200) / 1000;
  const totals = fold(samples);
  const live = liveStats({ totals, activeSeconds, body, heartRateOrigin: origin });
  const full = buildSummary({
    id: 'x',
    userId: 'u',
    event: null,
    activeSeconds,
    samples,
    body,
    shared: true,
    locationShared: true,
    heartRateOrigin: origin,
  });
  const label = withHeartRate ? 'nabızlı' : 'nabızsız';
  assert(live.jumps === full.jumps, `${label}: zıplama aynı olmalı`);
  assert(close(live.intensity, full.intensity), `${label}: yoğunluk aynı olmalı`);
  assert(close(live.peakIntensity, full.peakIntensity), `${label}: zirve yoğunluk aynı olmalı`);
  assert(close(live.peakOffsetSeconds, full.peakOffsetSeconds), `${label}: zirve dakikası aynı olmalı`);
  assert(close(live.distanceMeters, full.distanceMeters, 1e-6), `${label}: mesafe aynı olmalı`);
  assert(close(live.calories, full.calories, 1e-9), `${label}: kalori aynı olmalı`);
  assert(live.partyScore === full.partyScore, `${label}: skor aynı olmalı`);
  assert(live.calorieMethod === full.calorieMethod, `${label}: kalori yöntemi aynı olmalı`);
  assert(
    live.avgHeartRate == null ? full.avgHeartRate == null : close(live.avgHeartRate, full.avgHeartRate ?? 0),
    `${label}: ortalama nabız aynı olmalı`,
  );

  const summary = summaryFromTotals({
    id: 'x',
    userId: 'u',
    event: null,
    totals,
    activeSeconds,
    body,
    shared: true,
    locationShared: true,
    heartRateOrigin: origin,
    now: Date.parse('2026-01-02T03:00:00.000Z'),
  });
  assert(summary.partyScore === full.partyScore, `${label}: özet skoru aynı olmalı`);
  assert(summary.route.length === full.route.length, `${label}: rota uzunluğu aynı olmalı`);
  assert(summary.intensitySeries.length === full.intensitySeries.length, `${label}: yoğunluk serisi aynı uzunlukta`);
  assert(
    summary.intensitySeries.every((value) => value >= 0 && value <= 1),
    `${label}: yoğunluk serisi 0-1 arasında`,
  );
}

const noLocation = summaryFromTotals({
  id: 'x',
  userId: 'u',
  event: null,
  totals: fold(stream(120, false)),
  activeSeconds: 24,
  body,
  shared: true,
  heartRateOrigin: 'none',
});
assert(noLocation.route.length === 0, 'konum paylaşılmadıysa rota boş kalmalı');
assert(noLocation.photoUris.length === 0, 'yeni gece fotosuz başlar');

const still = fold(
  Array.from({ length: 300 }, (_, i) => ({ t: i * 200, ax: 0.02, ay: 0.99, az: 0.03 })),
);
const stillStats = liveStats({ totals: still, activeSeconds: 60, body, heartRateOrigin: 'none' });
assert(stillStats.jumps === 0, 'elde duran telefon zıplama saymamalı');
assert(stillStats.calories === 0, 'hareketsiz gece kalori yazmamalı');
assert(stillStats.partyScore === 0 || stillStats.partyScore === 1, 'hareketsiz gecede skor süre payından öteye geçmemeli');

// Uzun gecede bellek sabit kalmalı: seri ve rota sınırlı.
const long = fold(stream(20000, false));
assert(long.series.length <= 128, 'yoğunluk serisi sınırlı kalmalı');
assert(long.route.length <= 100, 'rota sınırlı kalmalı');
assert(intensitySeries(long).length === 32, 'kaydedilen seri 32 kova');

const hot = emptyTotals();
for (let i = 0; i < 400; i += 1) addSample(hot, { t: i * 1000, ax: 0, ay: 1, az: 0, heartRate: 175 });
assert(needsWaterBreak(hot, 'measured'), 'uzun süre yüksek nabız su molası vermeli');
assert(!needsWaterBreak(hot, 'none'), 'saat yoksa su molası çıkmamalı');
addSample(hot, { t: 400_000, ax: 0, ay: 1, az: 0, heartRate: 120 });
assert(!needsWaterBreak(hot, 'measured'), 'nabız düşünce su molası kalkmalı');

const brief = emptyTotals();
addSample(brief, { t: 0, ax: 0, ay: 1, az: 0, heartRate: 180 });
addSample(brief, { t: 1000, ax: 0, ay: 1, az: 0, heartRate: 180 });
assert(!needsWaterBreak(brief, 'measured'), 'kısa nabız sıçraması su molası vermemeli');

console.log('liveStats tests ok');
