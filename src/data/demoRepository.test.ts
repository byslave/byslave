import { DemoRepository } from './demoRepository';
import type { Profile } from '../domain/types';

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

const profile: Profile = {
  id: 'user-1',
  displayName: 'Ada',
  username: 'ada_gece',
  avatarColor: '#111',
  age: 30,
  heightCm: 170,
  weightKg: 60,
  sex: 'female',
  fitnessLevel: 'medium',
  healthStatus: 'skipped',
  watchStatus: 'skipped',
  watchLabel: null,
  healthNote: null,
  watchNote: null,
  motionStatus: 'skipped',
  locationStatus: 'skipped',
  notificationStatus: 'skipped',
};

async function main() {
  const repo = new DemoRepository(memory());
  await repo.saveProfile(profile);
  assert((await repo.load()).profile?.username === 'ada_gece', 'profil saklanmalı');
  await repo.addComment('act_ece_warehouse', '  bu yorum altmış karakterden uzun olmamalı ve kırpılırken baştaki boşluk da gider, fazlası silinir tamam mı');
  const saved = await repo.load();
  const mine = saved.comments.find((item) => item.userId === 'user-1');
  assert(mine != null && mine.text.length <= 60 && !mine.text.startsWith(' '), 'yorum 60 karakter ve kırpık');
  assert(saved.notifications.some((item) => item.title.includes('açık') || item.title.includes('yakında')), 'bildirimler dolu');
  await repo.clearLocal();
  assert((await repo.load()).profile == null, 'sıfırlama profili silmeli');
  console.log('demo repository reset ok');
}

void main();
