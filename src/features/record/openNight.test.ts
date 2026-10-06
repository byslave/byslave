import { addSample, emptyTotals, liveStats } from '../../domain/liveStats';
import { clearOpenNight, loadOpenNight, parseOpenNight, saveOpenNight, type OpenNight } from './openNight';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function memory() {
  const data = new Map<string, string>();
  return {
    async getItem(key: string) {
      return data.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
    async removeItem(key: string) {
      data.delete(key);
    },
  };
}

const body = { age: 30, heightCm: 180, weightKg: 80, sex: 'male' as const, fitnessLevel: 'medium' as const };

const totals = emptyTotals();
for (let i = 0; i < 2000; i += 1) {
  addSample(totals, {
    t: i * 200,
    ax: Math.sin(i / 3) * 0.5,
    ay: 0.4,
    az: i % 5 === 0 ? 2.5 : 1,
    lat: 41 + i * 2e-6,
    lng: 29 + i * 2e-6,
  });
}
const activeSeconds = 400;
const before = liveStats({ totals, activeSeconds, body, heartRateOrigin: 'none' });

const store = memory();
const night: OpenNight = {
  startedAt: Date.now() - activeSeconds * 1000,
  activeSeconds,
  savedAt: Date.now(),
  totals,
  context: { eventId: 'evt_warehouse', nightKind: 'club', note: 'yarım', shared: true, locationShared: true },
};

async function main() {
  await saveOpenNight(night, store);
  const found = await loadOpenNight(store);
  assert(found != null, 'yarım gece geri gelmeli');
  const after = liveStats({ totals: found!.totals, activeSeconds: found!.activeSeconds, body, heartRateOrigin: 'none' });
  assert(after.jumps === before.jumps, 'kurtarılan gecede zıplama aynı');
  assert(Math.abs(after.calories - before.calories) < 1e-9, 'kurtarılan gecede kalori aynı');
  assert(after.partyScore === before.partyScore, 'kurtarılan gecede skor aynı');
  assert(found!.context?.eventId === 'evt_warehouse', 'etkinlik seçimi de dönmeli');
  assert(found!.totals.route.length > 0, 'rota da dönmeli');

  await clearOpenNight(store);
  assert((await loadOpenNight(store)) == null, 'silinen gece geri gelmemeli');

  const old = JSON.stringify({ ...night, savedAt: Date.now() - 20 * 60 * 60 * 1000 });
  assert(parseOpenNight(old) == null, 'dünden kalan kayıt sorulmamalı');
  const tiny = JSON.stringify({ ...night, activeSeconds: 12 });
  assert(parseOpenNight(tiny) == null, 'yarım dakikalık kayıt sorulmamalı');
  assert(parseOpenNight('bozuk json') == null, 'bozuk kayıt çökmemeli');
  assert(parseOpenNight(null) == null, 'kayıt yoksa null');

  console.log('openNight tests ok');
}

void main();
