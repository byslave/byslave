import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import type { ActivitySample, PermissionChoice } from '../domain/types';
import { makeDemoSample } from './demo';

export type MotionKind = 'device' | 'demo';

async function motionPermission(): Promise<PermissionChoice> {
  try {
    if (typeof Accelerometer.requestPermissionsAsync === 'function') {
      const result = await Accelerometer.requestPermissionsAsync();
      if (result.status === 'granted') return 'granted';
      if (result.status === 'denied') return 'denied';
    }
    const available = await Accelerometer.isAvailableAsync();
    return available ? 'granted' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function openMotionSource(
  onSample: (sample: ActivitySample) => void,
): Promise<{ kind: MotionKind; stop: () => void; motion: PermissionChoice; location: PermissionChoice }> {
  try {
    const motion = await motionPermission();
    if (motion !== 'granted') throw new Error('unavailable');
    Accelerometer.setUpdateInterval(400);
    let lastLoc: { lat: number; lng: number } | undefined;
    let locationSub: Location.LocationSubscription | null = null;
    let location: PermissionChoice = 'skipped';
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      location = permission.status === 'granted' ? 'granted' : 'denied';
      if (location === 'granted') {
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
          (position) => {
            lastLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          },
        );
      }
    } catch {
      locationSub = null;
      location = 'unavailable';
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
      motion,
      location,
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
    return { kind: 'demo', motion: 'unavailable', location: 'unavailable', stop: () => clearInterval(timer) };
  }
}
