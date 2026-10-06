import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { PermissionChoice } from '../../domain/types';
import { useAppState } from '../../state/AppState';

async function askLocation(): Promise<PermissionChoice> {
  try {
    const result = await Promise.race([
      Location.requestForegroundPermissionsAsync(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (!result) return 'skipped';
    if (result.status === 'granted') return 'granted';
    if (result.status === 'denied') return 'denied';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export function LocationGate() {
  const { ready, profile, updateProfile } = useAppState();
  const [status, setStatus] = useState<PermissionChoice | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    void askLocation().then((next) => {
      if (alive) setStatus(next);
    });
    return () => {
      alive = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!profile || !status || status === 'skipped') return;
    if (profile.locationStatus !== 'skipped') return;
    void updateProfile({ locationStatus: status });
  }, [profile, status, updateProfile]);

  return null;
}
