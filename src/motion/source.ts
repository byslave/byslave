import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import type { ActivitySample } from '../domain/types';
import { makeDemoSample } from './demo';

export type MotionKind = 'device' | 'demo';

export async function openMotionSource(
  onSample: (sample: ActivitySample) => void,
): Promise<{ kind: MotionKind; stop: () => void }> {
  try {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) throw new Error('unavailable');
    Accelerometer.setUpdateInterval(400);
    let lastLoc: { lat: number; lng: number } | undefined;
    let locationSub: Location.LocationSubscription | null = null;
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
          (position) => {
            lastLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          },
        );
      }
    } catch {
      locationSub = null;
    }
    const subscription = Accelerometer.addListener((measurement) => {
      onSample({
        t: Date.now(),
        ax: measurement.x,
        ay: measurement.y,
        az: measurement.z,
        lat: lastLoc?.lat,
        lng: lastLoc?.lng,
      });
    });
    return {
      kind: 'device',
      stop: () => {
        subscription.remove();
        locationSub?.remove();
      },
    };
  } catch {
    let index = 1;
    const timer = setInterval(() => {
      onSample(makeDemoSample(index));
      index += 1;
    }, 400);
    return { kind: 'demo', stop: () => clearInterval(timer) };
  }
}
