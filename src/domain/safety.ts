import type { ActivitySample, HeartRateOrigin } from './types';

export function sustainedHighHeartRate(
  samples: ActivitySample[],
  origin: HeartRateOrigin,
  threshold = 170,
  sustainMs = 45_000,
): boolean {
  if (origin !== 'measured') return false;
  let runStart: number | null = null;
  for (const sample of samples) {
    if ((sample.heartRate ?? 0) >= threshold) {
      if (runStart == null) runStart = sample.t;
    } else {
      runStart = null;
    }
  }
  const last = samples[samples.length - 1];
  if (runStart == null || !last || (last.heartRate ?? 0) < threshold) return false;
  return last.t - runStart >= sustainMs;
}
