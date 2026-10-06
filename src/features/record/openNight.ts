import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyTotals, type LiveTotals } from '../../domain/liveStats';

const STORAGE_KEY = 'nightlife.openNight.v1';
/** Bu süreden eski yarım kayıtlar sorulmaz. */
const maxAgeMs = 18 * 60 * 60 * 1000;

export type OpenNight = {
  startedAt: number;
  activeSeconds: number;
  savedAt: number;
  totals: LiveTotals;
  context: {
    eventId: string | null;
    nightKind: string;
    note: string;
    shared: boolean;
    locationShared: boolean;
  } | null;
};

type Store = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

export async function saveOpenNight(night: OpenNight, store: Store = AsyncStorage): Promise<void> {
  try {
    await store.setItem(STORAGE_KEY, JSON.stringify(night));
  } catch {
    // Depo dolu olabilir. Kayıt sürsün.
  }
}

export async function clearOpenNight(store: Store = AsyncStorage): Promise<void> {
  try {
    await store.removeItem(STORAGE_KEY);
  } catch {
    // Yok sayılır.
  }
}

export function parseOpenNight(raw: string | null, now = Date.now()): OpenNight | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OpenNight>;
    if (typeof parsed.startedAt !== 'number' || typeof parsed.activeSeconds !== 'number') return null;
    if (parsed.activeSeconds < 60) return null;
    const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : parsed.startedAt;
    if (now - savedAt > maxAgeMs) return null;
    return {
      startedAt: parsed.startedAt,
      activeSeconds: parsed.activeSeconds,
      savedAt,
      totals: { ...emptyTotals(), ...(parsed.totals ?? {}) },
      context: parsed.context ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadOpenNight(store: Store = AsyncStorage, now = Date.now()): Promise<OpenNight | null> {
  try {
    const found = parseOpenNight(await store.getItem(STORAGE_KEY), now);
    if (!found) await clearOpenNight(store);
    return found;
  } catch {
    return null;
  }
}
