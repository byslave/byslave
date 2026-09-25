/**
 * Skor ve kalori sabitleri. Formül değişince testler ve demo geceler buradan güncellenir.
 * Kalori ve Party Score tahmindir; tıbbi ölçüm değildir.
 */
export const scoringConfig = {
  jumpHighG: 2.2,
  jumpRearmG: 1.35,
  intensityDivisor: 2.5,
  metMin: 4.5,
  metMax: 10,
  defaultWeightKg: 70,
  fitnessFactor: { low: 0.92, medium: 1, high: 1.06 },
  hrBlend: 0.3,
  hrRest: 90,
  hrSpan: 80,
  hrCalorieBlend: 0.4,
  reference: {
    intensity: 0.8,
    jumps: 400,
    calories: 700,
    activeSeconds: 90 * 60,
    distanceMeters: 3000,
  },
  weights: {
    intensity: 0.3,
    jumps: 0.25,
    calories: 0.2,
    time: 0.15,
    distance: 0.1,
  },
} as const;
