import { Platform } from 'react-native';
import type { HeartRateOrigin, PermissionChoice } from '../domain/types';
import { bleHeartState, bluetoothAvailable, connectWatch, currentHeartRate, disconnectWatch } from './bleHeartRate';

export type ProviderResult = { connected: boolean; reason: string; deviceName?: string | null };

export type HealthProvider = {
  id: 'healthkit' | 'health-connect' | 'unavailable';
  label: string;
  connect: () => Promise<ProviderResult>;
};

export const watchOptions = [
  { id: 'bluetooth', label: 'Bluetooth nabız', via: 'Bluetooth LE', signals: ['Nabız'] },
] as const;

export async function pairWatch(): Promise<ProviderResult> {
  if (Platform.OS !== 'web' && !bluetoothAvailable()) {
    return {
      connected: false,
      reason: 'Bluetooth nabız bu derlemede tarayıcıdaki Web Bluetooth ile çalışır. Android Chrome veya HTTPS aç. Saat bağlanmazsa nabız alınmaz.',
    };
  }
  const result = await connectWatch();
  return {
    connected: result.connected,
    reason: result.note ?? (result.connected ? `${result.deviceName ?? 'Saat'} bağlandı.` : 'Saat bağlanmadı. Nabız alınmıyor.'),
    deviceName: result.deviceName,
  };
}

export async function unpairWatch(): Promise<void> {
  await disconnectWatch();
}

export function liveWatchStatus(): PermissionChoice {
  return bleHeartState().connected ? 'granted' : 'skipped';
}

export function heartRateOriginForWatch(status: PermissionChoice): HeartRateOrigin {
  if (status !== 'granted' && !bleHeartState().connected) return 'none';
  return currentHeartRate() != null ? 'measured' : 'none';
}
