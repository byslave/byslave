import { heartRateMeasurement, heartRateService, isFresh, parseHeartRate } from './heartRate';

export type BleHeartState = {
  connected: boolean;
  deviceName: string | null;
  bpm: number | null;
  at: number | null;
  note: string | null;
};

type Listener = (state: BleHeartState) => void;

const idle: BleHeartState = { connected: false, deviceName: null, bpm: null, at: null, note: null };

let state: BleHeartState = idle;
let listeners = new Set<Listener>();
let server: { connected: boolean; disconnect: () => void } | null = null;
let onDisconnected: (() => void) | null = null;

function emit(next: BleHeartState) {
  state = next;
  for (const listener of listeners) listener(state);
}

export function bleHeartState(): BleHeartState {
  return state;
}

export function subscribeBleHeart(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function currentHeartRate(): number | undefined {
  if (!state.connected) return undefined;
  if (!isFresh(state.at) || state.bpm == null) return undefined;
  return state.bpm;
}

export function bluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

function bluetooth(): Bluetooth | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & { bluetooth?: Bluetooth }).bluetooth ?? null;
}

export async function disconnectWatch(): Promise<void> {
  try {
    server?.disconnect();
  } catch {
    // Cihaz zaten düşmüş olabilir.
  }
  server = null;
  emit({ ...idle, note: 'Saat bağlantısı kesildi. Nabız alınmıyor.' });
}

export async function connectWatch(): Promise<BleHeartState> {
  const api = bluetooth();
  if (!api) {
    const next = {
      ...idle,
      note: 'Bu tarayıcı Bluetooth nabza izin vermiyor. Android’de Chrome, telefonda HTTPS ile dene. iPhone Safari Bluetooth açmaz.',
    };
    emit(next);
    return next;
  }
  let device: BluetoothDevice;
  try {
    device = await api.requestDevice({
      filters: [{ services: [heartRateService] }],
      optionalServices: [heartRateService],
    });
  } catch (cause) {
    const cancelled = cause instanceof Error && /cancel|abort/i.test(cause.message);
    const next = {
      ...idle,
      note: cancelled
        ? 'Eşleşme iptal edildi. Saat bağlı değil, nabız alınmıyor.'
        : 'Bluetooth listesi açılamadı. Saat nabız servisini yayınlamalı.',
    };
    emit(next);
    return next;
  }
  if (!device.gatt) {
    const next = { ...idle, note: `${device.name ?? 'Saat'} GATT açmıyor. Nabız alınmıyor.` };
    emit(next);
    return next;
  }
  try {
    const gatt = await device.gatt.connect();
    const service = await gatt.getPrimaryService(heartRateService);
    const characteristic = await service.getCharacteristic(heartRateMeasurement);
    const onValue = (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic | null;
      const value = target?.value;
      if (!value) return;
      const bpm = parseHeartRate(value);
      if (bpm == null) return;
      emit({ connected: true, deviceName: device.name ?? 'Bluetooth saat', bpm, at: Date.now(), note: null });
    };
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', onValue);
    onDisconnected = () => {
      characteristic.removeEventListener('characteristicvaluechanged', onValue);
      server = null;
      emit({
        ...idle,
        deviceName: device.name ?? null,
        note: 'Saat düştü. Nabız alınmıyor. Aynı ekrandan yeniden bağlan.',
      });
    };
    device.addEventListener('gattserverdisconnected', onDisconnected);
    server = gatt;
    emit({
      connected: true,
      deviceName: device.name ?? 'Bluetooth saat',
      bpm: null,
      at: null,
      note: `${device.name ?? 'Saat'} bağlandı. İlk nabız gelene kadar sayı yazılmaz.`,
    });
    return state;
  } catch {
    try {
      device.gatt.disconnect();
    } catch {
      // yok say.
    }
    const next = {
      ...idle,
      deviceName: device.name ?? null,
      note: `${device.name ?? 'Saat'} nabız servisini açmadı. Polar, Garmin, Wear OS veya nabız kemeri dene.`,
    };
    emit(next);
    return next;
  }
}
