import { scoringConfig } from '../config/scoring';
import { nightKindLabel } from './labels';
import type {
  ActivitySample,
  ActivitySummary,
  BodyProfile,
  CalorieMethod,
  FitnessLevel,
  GeoPoint,
  HeartRateOrigin,
  NightEvent,
  NightKind,
  Sex,
} from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function gForce(sample: ActivitySample): number {
  return Math.sqrt(sample.ax ** 2 + sample.ay ** 2 + sample.az ** 2);
}

export function countJumps(
  samples: ActivitySample[],
  high = scoringConfig.jumpHighG,
  rearm = scoringConfig.jumpRearmG,
): number {
  let jumps = 0;
  let armed = true;
  for (const sample of samples) {
    const force = gForce(sample);
    if (armed && force >= high) {
      jumps += 1;
      armed = false;
    } else if (!armed && force <= rearm) {
      armed = true;
    }
  }
  return jumps;
}

export function routeSpanMeters(route: GeoPoint[]): number {
  if (route.length < 2) return 0;
  let minLat = route[0].lat;
  let maxLat = route[0].lat;
  let minLng = route[0].lng;
  let maxLng = route[0].lng;
  for (const point of route) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }
  return haversine({ lat: minLat, lng: minLng, t: 0 }, { lat: maxLat, lng: maxLng, t: 0 });
}

function haversine(a: GeoPoint, b: GeoPoint): number {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceMeters(samples: ActivitySample[], heightCm: number | null): number {
  let gps = 0;
  let prev: GeoPoint | null = null;
  let steps = 0;
  for (const sample of samples) {
    if (typeof sample.steps === 'number') steps = Math.max(steps, sample.steps);
    if (typeof sample.lat !== 'number' || typeof sample.lng !== 'number') continue;
    const point = { lat: sample.lat, lng: sample.lng, t: sample.t };
    if (prev) {
      const segment = haversine(prev, point);
      if (segment >= 0.4) gps += segment;
    }
    prev = point;
  }
  const height = heightCm ?? 170;
  const stride = (height * 0.415) / 100;
  return Math.max(gps, steps * stride);
}

export function sampleIntensity(sample: ActivitySample): number {
  const dev = Math.abs(gForce(sample) - 1);
  if (dev < scoringConfig.stillG) return 0;
  return clamp((dev - scoringConfig.stillG) / scoringConfig.intensityDivisor, 0, 1);
}

export function downsample(values: number[], buckets: number): number[] {
  if (values.length === 0) return [];
  if (values.length <= buckets) return values.slice();
  const out: number[] = [];
  const size = values.length / buckets;
  for (let i = 0; i < buckets; i += 1) {
    const start = Math.floor(i * size);
    const end = Math.max(start + 1, Math.floor((i + 1) * size));
    let max = 0;
    for (let j = start; j < end; j += 1) max = Math.max(max, values[j] ?? 0);
    out.push(max);
  }
  return out;
}

function keytelPerMinute(hr: number, weightKg: number, age: number, sex: Exclude<Sex, 'unspecified'>): number {
  const raw =
    sex === 'male'
      ? (-55.0969 + 0.6309 * hr + 0.1988 * weightKg + 0.2017 * age) / 4.184
      : (-20.4022 + 0.4472 * hr - 0.1263 * weightKg + 0.074 * age) / 4.184;
  return clamp(raw, 0, 14);
}

/**
 * Kalori yalnız hareketli örneklerin payına yazılır.
 * 10 sn dans + 10 dk duruş, duruş süresini yakım saymaz.
 */
export function movingCalorieWindow(input: {
  movingCount: number;
  sampleCount: number;
  intensitySum: number;
  elapsedSeconds: number;
}): { intensity: number; activeSeconds: number } {
  if (input.movingCount <= 0 || input.sampleCount <= 0 || input.elapsedSeconds <= 0) {
    return { intensity: 0, activeSeconds: 0 };
  }
  return {
    intensity: input.intensitySum / input.movingCount,
    activeSeconds: (input.movingCount / input.sampleCount) * input.elapsedSeconds,
  };
}

export function estimateCalories(input: {
  intensity: number;
  activeSeconds: number;
  body: BodyProfile;
  avgHeartRate: number | null;
  heartRateOrigin: HeartRateOrigin;
}): { calories: number; method: CalorieMethod; assumedWeight: boolean } {
  const assumedWeight = input.body.weightKg == null;
  const weight = input.body.weightKg ?? scoringConfig.defaultWeightKg;
  const fitness: FitnessLevel = input.body.fitnessLevel;
  if (input.intensity <= 0 || input.activeSeconds <= 0) {
    return { calories: 0, method: 'motion', assumedWeight };
  }
  const met = scoringConfig.metMin + input.intensity * (scoringConfig.metMax - scoringConfig.metMin);
  const motion = met * weight * (input.activeSeconds / 3600) * scoringConfig.fitnessFactor[fitness];
  const sex = input.body.sex;
  const canUseHr =
    input.heartRateOrigin !== 'none' &&
    input.avgHeartRate != null &&
    input.body.age != null &&
    sex != null &&
    sex !== 'unspecified';
  if (!canUseHr || input.avgHeartRate == null || input.body.age == null || sex == null) {
    return { calories: motion, method: 'motion', assumedWeight };
  }
  const hr = keytelPerMinute(input.avgHeartRate, weight, input.body.age, sex) * (input.activeSeconds / 60);
  const blend = scoringConfig.hrCalorieBlend;
  return {
    calories: motion * (1 - blend) + hr * blend,
    method: 'heart-rate',
    assumedWeight,
  };
}

export function scoreParty(input: {
  intensity: number;
  jumps: number;
  calories: number;
  activeSeconds: number;
  distanceMeters: number;
}): number {
  const ref = scoringConfig.reference;
  const w = scoringConfig.weights;
  const score =
    100 *
    (w.intensity * clamp(input.intensity / ref.intensity, 0, 1) +
      w.jumps * clamp(input.jumps / ref.jumps, 0, 1) +
      w.calories * clamp(input.calories / ref.calories, 0, 1) +
      w.time * clamp(input.activeSeconds / ref.activeSeconds, 0, 1) +
      w.distance * clamp(input.distanceMeters / ref.distanceMeters, 0, 1));
  return Math.round(score);
}

export function partyScoreParts(input: {
  intensity: number;
  jumps: number;
  calories: number;
  activeSeconds: number;
  distanceMeters: number;
}): { label: string; points: number }[] {
  const ref = scoringConfig.reference;
  const w = scoringConfig.weights;
  const part = (label: string, weight: number, value: number, reference: number) => ({
    label,
    points: Math.round(100 * weight * clamp(value / reference, 0, 1)),
  });
  return [
    part('Yoğunluk', w.intensity, input.intensity, ref.intensity),
    part('Zıplama', w.jumps, input.jumps, ref.jumps),
    part('Kalori', w.calories, input.calories, ref.calories),
    part('Süre', w.time, input.activeSeconds, ref.activeSeconds),
    part('Mesafe', w.distance, input.distanceMeters, ref.distanceMeters),
  ];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildSummary(input: {
  id: string;
  userId: string;
  event: NightEvent | null;
  activeSeconds: number;
  samples: ActivitySample[];
  body: BodyProfile;
  shared: boolean;
  locationShared?: boolean;
  heartRateOrigin: HeartRateOrigin;
  nightKind?: NightKind | null;
  note?: string | null;
  now?: number;
}): ActivitySummary {
  const intensities = input.samples.map(sampleIntensity);
  const intensitySum = intensities.reduce((sum, value) => sum + value, 0);
  const movingCount = intensities.reduce((count, value) => count + (value > 0 ? 1 : 0), 0);
  const avgMotion = average(intensities) ?? 0;
  const hrs =
    input.heartRateOrigin === 'none'
      ? []
      : input.samples.flatMap((sample) => (typeof sample.heartRate === 'number' ? [sample.heartRate] : []));
  const avgHeartRate = average(hrs);
  const peakHeartRate = hrs.length ? Math.max(...hrs) : null;
  const hrIntensity =
    avgHeartRate == null ? avgMotion : clamp((avgHeartRate - scoringConfig.hrRest) / scoringConfig.hrSpan, 0, 1);
  const intensity =
    input.heartRateOrigin === 'none' || avgHeartRate == null
      ? avgMotion
      : clamp(avgMotion * (1 - scoringConfig.hrBlend) + hrIntensity * scoringConfig.hrBlend, 0, 1);
  const calorieWindow = movingCalorieWindow({
    movingCount,
    sampleCount: intensities.length,
    intensitySum,
    elapsedSeconds: input.activeSeconds,
  });
  const calories = estimateCalories({
    intensity: calorieWindow.intensity,
    activeSeconds: calorieWindow.activeSeconds,
    body: input.body,
    avgHeartRate,
    heartRateOrigin: input.heartRateOrigin,
  });
  const jumps = countJumps(input.samples);
  const distance = distanceMeters(input.samples, input.body.heightCm);
  const peakIntensity = intensities.length ? Math.max(...intensities) : 0;
  const peakIndex = intensities.indexOf(peakIntensity);
  const peakOffsetSeconds =
    intensities.length > 1 ? (peakIndex / (intensities.length - 1)) * input.activeSeconds : 0;
  const route = input.samples
    .filter((sample) => typeof sample.lat === 'number' && typeof sample.lng === 'number')
    .filter((_, index) => index % 3 === 0)
    .slice(-100)
    .map((sample) => ({ lat: sample.lat as number, lng: sample.lng as number, t: sample.t }));
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
    calories: calories.calories,
    calorieMethod: calories.method,
    assumedWeight: calories.assumedWeight,
    jumps,
    distanceMeters: distance,
    intensity,
    peakIntensity,
    peakOffsetSeconds,
    avgHeartRate,
    peakHeartRate,
    heartRateOrigin: input.heartRateOrigin,
    musicBpm: input.event?.musicBpm ?? null,
    nightKind: input.nightKind ?? null,
    note: input.note?.trim() ? input.note.trim().slice(0, 80) : null,
    respectIds: [],
    partyScore: scoreParty({
      intensity,
      jumps,
      calories: calories.calories,
      activeSeconds: input.activeSeconds,
      distanceMeters: distance,
    }),
    route: input.locationShared ? route : [],
    intensitySeries: downsample(intensities, 32),
    shared: input.shared,
    locationShared: Boolean(input.locationShared),
    photoUris: [],
  };
}
