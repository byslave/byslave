import type { ActivitySample } from '../domain/types';

export const demoOrigin = { lat: 41.0255, lng: 28.9742 };

/** Tarayıcıda sensör yokken kullanılan dans hareketi. Nabız burada üretilmez. */
export function makeDemoSample(index: number, startedAt = 0): ActivitySample {
  const jumping = index % 6 === 0 && index > 0;
  const az = jumping ? 3.2 : 1 + Math.sin(index / 2) * 0.25;
  const ax = Math.sin(index / 3) * 0.35;
  const ay = Math.cos(index / 4) * 0.28;
  return {
    t: startedAt + index * 400,
    ax,
    ay,
    az,
    lat: demoOrigin.lat + Math.sin(index / 20) * 0.00015,
    lng: demoOrigin.lng + Math.cos(index / 20) * 0.00015,
  };
}
