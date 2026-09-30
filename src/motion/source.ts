import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { ActivitySample, PermissionChoice } from '../domain/types';

export type MotionKind = 'device' | 'unavailable';

const gravity = 9.80665;
const moveMeters = 8;

export type MotionSession = {
  kind: MotionKind;
  stop: () => void;
  motion: PermissionChoice;
  location: PermissionChoice;
};

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function requestWebMotion(): Promise<PermissionChoice> {
  if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
    return Promise.resolve('unavailable');
  }
  const event = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  if (typeof event.requestPermission !== 'function') return Promise.resolve('granted');
  return event
    .requestPermission()
    .then((state) => (state === 'granted' ? 'granted' : 'denied'))
    .catch(() => 'denied' as const);
}

async function watchPlace(): Promise<{ location: PermissionChoice; read: () => { lat: number; lng: number } | undefined; stop: () => void }> {
  let current: { lat: number; lng: number } | undefined;
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    const location: PermissionChoice = permission.status === 'granted' ? 'granted' : 'denied';
    if (location !== 'granted') return { location, read: () => undefined, stop: () => undefined };
    let anchor: { lat: number; lng: number } | null = null;
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (position) => {
        if (position.coords.accuracy != null && position.coords.accuracy > 40) return;
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!anchor) {
          anchor = point;
          current = point;
          return;
        }
        if (haversine(anchor, point) >= moveMeters) {
          anchor = point;
          current = point;
        }
      },
    );
    return { location, read: () => current, stop: () => sub.remove() };
  } catch {
    return { location: 'unavailable', read: () => undefined, stop: () => undefined };
  }
}

function fromMetersPerSecond(x: number, y: number, z: number): Pick<ActivitySample, 'ax' | 'ay' | 'az'> {
  return { ax: x / gravity, ay: y / gravity, az: z / gravity };
}

function readWebAcceleration(
  event: DeviceMotionEvent,
  unit: { current: 'g' | 'mps2' | null },
): Pick<ActivitySample, 'ax' | 'ay' | 'az'> | null {
  const raw = event.accelerationIncludingGravity;
  if (!raw || raw.x == null || raw.y == null || raw.z == null) return null;
  const magnitude = Math.hypot(raw.x, raw.y, raw.z);
  if (!unit.current) {
    if (magnitude > 4) unit.current = 'mps2';
    else if (magnitude >= 0.5) unit.current = 'g';
    else return null;
  }
  const axes = unit.current === 'g' ? { ax: raw.x, ay: raw.y, az: raw.z } : fromMetersPerSecond(raw.x, raw.y, raw.z);
  if (Math.hypot(axes.ax, axes.ay, axes.az) < 0.2) return null;
  return axes;
}

async function openWeb(onSample: (sample: ActivitySample) => void): Promise<MotionSession> {
  const motion = await requestWebMotion();
  if (motion !== 'granted') {
    return { kind: 'unavailable', stop: () => undefined, motion, location: 'skipped' };
  }
  const place = await watchPlace();
  const unit: { current: 'g' | 'mps2' | null } = { current: null };
  return new Promise((resolve) => {
    let settled = false;
    const onMotion = (event: DeviceMotionEvent) => {
      const axes = readWebAcceleration(event, unit);
      if (!axes) return;
      const here = place.read();
      onSample({ t: Date.now(), ...axes, lat: here?.lat, lng: here?.lng });
      if (settled) return;
      settled = true;
      resolve({
        kind: 'device',
        motion,
        location: place.location,
        stop: () => {
          window.removeEventListener('devicemotion', onMotion);
          place.stop();
        },
      });
    };
    window.addEventListener('devicemotion', onMotion);
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      window.removeEventListener('devicemotion', onMotion);
      place.stop();
      resolve({ kind: 'unavailable', stop: () => undefined, motion: 'unavailable', location: place.location });
    }, 1500);
  });
}

async function openNative(onSample: (sample: ActivitySample) => void): Promise<MotionSession> {
  try {
    const result = await Accelerometer.requestPermissionsAsync();
    const motion: PermissionChoice = result.status === 'granted' ? 'granted' : result.status === 'denied' ? 'denied' : 'unavailable';
    if (motion !== 'granted') {
      return { kind: 'unavailable', stop: () => undefined, motion, location: 'skipped' };
    }
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      return { kind: 'unavailable', stop: () => undefined, motion: 'unavailable', location: 'skipped' };
    }
    const place = await watchPlace();
    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener((measurement) => {
      const here = place.read();
      onSample({
        t: Date.now(),
        ax: measurement.x,
        ay: measurement.y,
        az: measurement.z,
        lat: here?.lat,
        lng: here?.lng,
      });
    });
    return {
      kind: 'device',
      motion,
      location: place.location,
      stop: () => {
        subscription.remove();
        place.stop();
      },
    };
  } catch {
    return { kind: 'unavailable', stop: () => undefined, motion: 'unavailable', location: 'unavailable' };
  }
}

export async function openMotionSource(onSample: (sample: ActivitySample) => void): Promise<MotionSession> {
  if (Platform.OS === 'web') return openWeb(onSample);
  return openNative(onSample);
}
