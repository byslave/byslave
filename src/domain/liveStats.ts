import { scoringConfig } from '../config/scoring';
import { nightKindLabel } from './labels';
import {
  clamp,
  estimateCalories,
  gForce,
  movingCalorieWindow,
  sampleIntensity,
  scoreParty,
  downsample,
} from './scoring';
import type {
  ActivitySample,
  ActivitySummary,
  BodyProfile,
  GeoPoint,
  HeartRateOrigin,
  NightEvent,
  NightKind,
} from './types';

/**
 * Gece boyunca örnekler birikir. Her örnekte tüm geceyi yeniden toplamak
 * telefonu kilitlediği için sayılar burada tek tek eklenir.
 * Sonuçlar buildSummary ile aynı olmalı; liveStats.test.ts bunu kontrol eder.
 */

const seriesCap = 128;
const seriesBuckets = 32;
const routeEvery = 3;
const routeKeep = 100;
const minSegmentMeters = 0.4;
const highHeartRate = 170;
const highHeartRateMs = 45_000;

export type LiveTotals = {
  count: number;
  movingCount: number;
  intensitySum: number;
  peakIntensity: number;
  peakIndex: number;
  jumps: number;
  armed: boolean;
  gpsMeters: number;
  maxSteps: number;
  lastPoint: GeoPoint | null;
  geoCount: number;
  route: GeoPoint[];
  series: number[];
  seriesStride: number;
  bucketCount: number;
  bucketMax: number;
  heartRateSum: number;
  heartRateCount: number;
  peakHeartRate: number | null;
  lastHeartRate: number | null;
  lastSampleAt: number | null;
  highHeartRateSince: number | null;
};

export function emptyTotals(): LiveTotals {
  return {
    count: 0,
    movingCount: 0,
    intensitySum: 0,
    peakIntensity: 0,
    peakIndex: 0,
    jumps: 0,
    armed: true,
    gpsMeters: 0,
    maxSteps: 0,
    lastPoint: null,
    geoCount: 0,
    route: [],
    series: [],
    seriesStride: 1,
    bucketCount: 0,
    bucketMax: 0,
    heartRateSum: 0,
    heartRateCount: 0,
    peakHeartRate: null,
    lastHeartRate: null,
    lastSampleAt: null,
    highHeartRateSince: null,
  };
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pushIntensity(totals: LiveTotals, value: number) {
  totals.bucketMax = Math.max(totals.bucketMax, value);
  totals.bucketCount += 1;
  if (totals.bucketCount < totals.seriesStride) return;
  totals.series.push(totals.bucketMax);
  totals.bucketCount = 0;
  totals.bucketMax = 0;
  if (totals.series.length < seriesCap) return;
  const halved: number[] = [];
  for (let i = 0; i < totals.series.length; i += 2) {
    halved.push(Math.max(totals.series[i] ?? 0, totals.series[i + 1] ?? 0));
  }
  totals.series = halved;
  totals.seriesStride *= 2;
}

/** Tek örneği toplamlara işler. Nesne yerinde değişir. */
export function addSample(totals: LiveTotals, sample: ActivitySample): void {
  const intensity = sampleIntensity(sample);
  if (totals.count === 0 || intensity > totals.peakIntensity) {
    totals.peakIntensity = intensity;
    totals.peakIndex = totals.count;
  }
  totals.intensitySum += intensity;
  if (intensity > 0) totals.movingCount += 1;
  pushIntensity(totals, intensity);

  const force = gForce(sample);
  if (totals.armed && force >= scoringConfig.jumpHighG) {
    totals.jumps += 1;
    totals.armed = false;
  } else if (!totals.armed && force <= scoringConfig.jumpRearmG) {
    totals.armed = true;
  }

  if (typeof sample.steps === 'number') totals.maxSteps = Math.max(totals.maxSteps, sample.steps);
  if (typeof sample.lat === 'number' && typeof sample.lng === 'number') {
    const point = { lat: sample.lat, lng: sample.lng, t: sample.t };
    if (totals.lastPoint) {
      const segment = haversine(totals.lastPoint, point);
      if (segment >= minSegmentMeters) totals.gpsMeters += segment;
    }
    totals.lastPoint = point;
    if (totals.geoCount % routeEvery === 0) {
      totals.route.push(point);
      if (totals.route.length > routeKeep) totals.route.shift();
    }
    totals.geoCount += 1;
  }

  if (typeof sample.heartRate === 'number') {
    totals.heartRateSum += sample.heartRate;
    totals.heartRateCount += 1;
    totals.peakHeartRate = Math.max(totals.peakHeartRate ?? sample.heartRate, sample.heartRate);
  }
  totals.lastHeartRate = sample.heartRate ?? null;
  totals.lastSampleAt = sample.t;
  if ((sample.heartRate ?? 0) >= highHeartRate) {
    if (totals.highHeartRateSince == null) totals.highHeartRateSince = sample.t;
  } else {
    totals.highHeartRateSince = null;
  }

  totals.count += 1;
}

export type LiveStats = {
  intensity: number;
  peakIntensity: number;
  peakOffsetSeconds: number;
  jumps: number;
  distanceMeters: number;
  calories: number;
  calorieMethod: ActivitySummary['calorieMethod'];
  assumedWeight: boolean;
  avgHeartRate: number | null;
  peakHeartRate: number | null;
  partyScore: number;
};

type StatsInput = {
  totals: LiveTotals;
  activeSeconds: number;
  body: BodyProfile;
  heartRateOrigin: HeartRateOrigin;
};

export function liveStats({ totals, activeSeconds, body, heartRateOrigin }: StatsInput): LiveStats {
  const avgMotion = totals.count === 0 ? 0 : totals.intensitySum / totals.count;
  const avgHeartRate =
    heartRateOrigin === 'none' || totals.heartRateCount === 0
      ? null
      : totals.heartRateSum / totals.heartRateCount;
  const hrIntensity =
    avgHeartRate == null
      ? avgMotion
      : clamp((avgHeartRate - scoringConfig.hrRest) / scoringConfig.hrSpan, 0, 1);
  const intensity =
    avgHeartRate == null
      ? avgMotion
      : clamp(avgMotion * (1 - scoringConfig.hrBlend) + hrIntensity * scoringConfig.hrBlend, 0, 1);
  const calorieWindow = movingCalorieWindow({
    movingCount: totals.movingCount,
    sampleCount: totals.count,
    intensitySum: totals.intensitySum,
    elapsedSeconds: activeSeconds,
  });
  const calories = estimateCalories({
    intensity: calorieWindow.intensity,
    activeSeconds: calorieWindow.activeSeconds,
    body,
    avgHeartRate,
    heartRateOrigin,
  });
  const stride = ((body.heightCm ?? 170) * 0.415) / 100;
  const distanceMeters = Math.max(totals.gpsMeters, totals.maxSteps * stride);
  const peakOffsetSeconds =
    totals.count > 1 ? (totals.peakIndex / (totals.count - 1)) * activeSeconds : 0;
  return {
    intensity,
    peakIntensity: totals.peakIntensity,
    peakOffsetSeconds,
    jumps: totals.jumps,
    distanceMeters,
    calories: calories.calories,
    calorieMethod: calories.method,
    assumedWeight: calories.assumedWeight,
    avgHeartRate,
    peakHeartRate: heartRateOrigin === 'none' ? null : totals.peakHeartRate,
    partyScore: scoreParty({
      intensity,
      jumps: totals.jumps,
      calories: calories.calories,
      activeSeconds,
      distanceMeters,
    }),
  };
}

/** Nabız bir süredir yüksek mi. Yalnız ölçülen nabızla çalışır. */
export function needsWaterBreak(totals: LiveTotals, origin: HeartRateOrigin): boolean {
  if (origin !== 'measured') return false;
  if (totals.highHeartRateSince == null || totals.lastSampleAt == null) return false;
  if ((totals.lastHeartRate ?? 0) < highHeartRate) return false;
  return totals.lastSampleAt - totals.highHeartRateSince >= highHeartRateMs;
}

export function intensitySeries(totals: LiveTotals): number[] {
  const tail = totals.bucketCount > 0 ? [...totals.series, totals.bucketMax] : totals.series;
  return downsample(tail, seriesBuckets);
}

export function summaryFromTotals(input: {
  id: string;
  userId: string;
  event: NightEvent | null;
  totals: LiveTotals;
  activeSeconds: number;
  body: BodyProfile;
  shared: boolean;
  locationShared?: boolean;
  heartRateOrigin: HeartRateOrigin;
  nightKind?: NightKind | null;
  note?: string | null;
  now?: number;
}): ActivitySummary {
  const stats = liveStats({
    totals: input.totals,
    activeSeconds: input.activeSeconds,
    body: input.body,
    heartRateOrigin: input.heartRateOrigin,
  });
  const ended = input.now ?? Date.now();
  return {
    id: input.id,
    userId: input.userId,
    eventId: input.event?.id ?? null,
    title: input.event?.title ?? nightKindLabel(input.nightKind ?? null),
    venue: input.event?.venue ?? 'Mekân yok',
    startedAt: new Date(ended - input.activeSeconds * 1000).toISOString(),
    endedAt: new Date(ended).toISOString(),
    activeSeconds: input.activeSeconds,
    calories: stats.calories,
    calorieMethod: stats.calorieMethod,
    assumedWeight: stats.assumedWeight,
    jumps: stats.jumps,
    distanceMeters: stats.distanceMeters,
    intensity: stats.intensity,
    peakIntensity: stats.peakIntensity,
    peakOffsetSeconds: stats.peakOffsetSeconds,
    avgHeartRate: stats.avgHeartRate,
    peakHeartRate: stats.peakHeartRate,
    heartRateOrigin: input.heartRateOrigin,
    musicBpm: input.event?.musicBpm ?? null,
    nightKind: input.nightKind ?? null,
    note: input.note?.trim() ? input.note.trim().slice(0, 80) : null,
    respectIds: [],
    partyScore: stats.partyScore,
    route: input.locationShared ? input.totals.route.slice() : [],
    intensitySeries: intensitySeries(input.totals),
    shared: input.shared,
    locationShared: Boolean(input.locationShared),
    photoUris: [],
  };
}
