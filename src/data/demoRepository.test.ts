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
  await repo.clearLocal();
  assert((await repo.load()).profile == null, 'sıfırlama profili silmeli');
  console.log('demo repository reset ok');
}

void main();
