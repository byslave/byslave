import { Platform } from 'react-native';

export type ProviderResult = { connected: boolean; reason: string };

export type HealthProvider = {
  id: 'healthkit' | 'health-connect' | 'unavailable';
  label: string;
  connect: () => Promise<ProviderResult>;
};

export type WatchOption = { id: string; label: string };

export const watchOptions: WatchOption[] = [
  { id: 'apple-watch', label: 'Apple Watch' },
  { id: 'wear-os', label: 'Wear OS' },
  { id: 'garmin', label: 'Garmin' },
  { id: 'huawei', label: 'Huawei Watch' },
  { id: 'fitbit', label: 'Fitbit' },
];

const healthKit: HealthProvider = {
  id: 'healthkit',
  label: 'Apple Health',
  async connect() {
    return {
      connected: false,
      reason: 'Apple Health bu derlemede bağlı değil. Nabız, HealthKit cihaz derlemesinde aynı arayüze takılır.',
    };
  },
};

const healthConnect: HealthProvider = {
  id: 'health-connect',
  label: 'Health Connect',
  async connect() {
    return {
      connected: false,
      reason: 'Health Connect bu derlemede bağlı değil. Android derlemesinde aynı arayüzden okunur.',
    };
  },
};

const unavailable: HealthProvider = {
  id: 'unavailable',
  label: 'Sağlık verisi',
  async connect() {
    return {
      connected: false,
      reason: 'Bu tarayıcıda sağlık verisi yok. Kayıt, demo harekete ve tahmini nabza düşer.',
    };
  },
};

export function platformHealthProvider(): HealthProvider {
  if (Platform.OS === 'ios') return healthKit;
  if (Platform.OS === 'android') return healthConnect;
  return unavailable;
}

export async function connectWatch(label: string): Promise<ProviderResult> {
  return {
    connected: false,
    reason: `${label} doğrudan bağlanmıyor. Saat nabzı Apple Health veya Health Connect üzerinden gelirse kullanılır.`,
  };
}
