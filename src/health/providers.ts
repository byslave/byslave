import { Platform } from 'react-native';
import type { HeartRateOrigin, PermissionChoice } from '../domain/types';

export type ProviderResult = { connected: boolean; reason: string };

export type HealthProvider = {
  id: 'healthkit' | 'health-connect' | 'unavailable';
  label: string;
  connect: () => Promise<ProviderResult>;
};

export type WatchOption = {
  id: string;
  label: string;
  via: string;
  signals: string[];
};

export const watchOptions: WatchOption[] = [
  { id: 'apple-watch', label: 'Apple Watch', via: 'Apple Health', signals: ['Nabız', 'Aktif kalori', 'Hareket'] },
  { id: 'wear-os', label: 'Wear OS', via: 'Health Connect', signals: ['Nabız', 'Adım'] },
  { id: 'garmin', label: 'Garmin', via: 'Health Connect', signals: ['Nabız', 'Aktivite'] },
  { id: 'huawei', label: 'Huawei Watch', via: 'Health Connect', signals: ['Nabız'] },
  { id: 'fitbit', label: 'Fitbit', via: 'Health Connect', signals: ['Nabız', 'Aktif kalori'] },
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
      reason: 'Bu tarayıcıda sağlık verisi yok. Nabız alınmaz.',
    };
  },
};

export function platformHealthProvider(): HealthProvider {
  if (Platform.OS === 'ios') return healthKit;
  if (Platform.OS === 'android') return healthConnect;
  return unavailable;
}

export async function pairWatch(id: string): Promise<ProviderResult> {
  const watch = watchOptions.find((item) => item.id === id);
  if (!watch) return { connected: false, reason: 'Saat seçilmedi.' };
  if (Platform.OS === 'web') {
    return {
      connected: false,
      reason: `${watch.label} bu tarayıcıda eşleşmez. Telefonda ${watch.via} açıkken aynı ekrandan tekrar dene. Saat bağlanmazsa nabız alınmaz.`,
    };
  }
  const health = await platformHealthProvider().connect();
  if (!health.connected) {
    return { connected: false, reason: `${watch.label} seçildi. ${health.reason}` };
  }
  return { connected: true, reason: `${watch.label}, ${watch.via} üzerinden bağlandı. Nabız kayda kendiliğinden gelir.` };
}

export function heartRateOriginForWatch(status: PermissionChoice): HeartRateOrigin {
  return status === 'granted' ? 'measured' : 'none';
}
