import { estimateCalories, scoreParty } from '../domain/scoring';
import type {
  ActivitySummary,
  AppNotification,
  BodyProfile,
  NightEvent,
  NightKind,
  PublicUser,
} from '../domain/types';

const users: PublicUser[] = [
  { id: 'usr_ece', displayName: 'Ece Yılmaz', username: 'ece', avatarColor: '#3A1214' },
  { id: 'usr_deniz', displayName: 'Deniz Kaya', username: 'deniz', avatarColor: '#1A1A1A' },
  { id: 'usr_kerem', displayName: 'Kerem Acar', username: 'kerem', avatarColor: '#2A1214' },
  { id: 'usr_aylin', displayName: 'Aylin Demir', username: 'aylin', avatarColor: '#241416' },
];

function loop(lat: number, lng: number): ActivitySummary['route'] {
  return Array.from({ length: 24 }, (_, index) => ({
    lat: lat + Math.sin(index / 3) * 0.00035,
    lng: lng + Math.cos(index / 3) * 0.00035,
    t: index,
  }));
}

function wave(base: number): number[] {
  return Array.from({ length: 24 }, (_, index) => {
    const peak = index === 16 ? 0.95 : 0;
    return Math.min(1, base + Math.sin(index / 3) * 0.12 + peak);
  });
}

function night(input: {
  id: string;
  userId: string;
  event: NightEvent | null;
  title: string;
  venue: string;
  startedAt: string;
  activeSeconds: number;
  jumps: number;
  distanceMeters: number;
  intensity: number;
  peakIntensity: number;
  avgHeartRate: number;
  peakHeartRate: number;
  nightKind: NightKind;
  note?: string | null;
  respectIds?: string[];
  body: BodyProfile;
  route: ActivitySummary['route'];
}): ActivitySummary {
  const calories = estimateCalories({
    intensity: input.intensity,
    activeSeconds: input.activeSeconds,
    body: input.body,
    avgHeartRate: input.avgHeartRate,
    heartRateOrigin: 'measured',
  });
  return {
    id: input.id,
    userId: input.userId,
    eventId: input.event?.id ?? null,
    title: input.title,
    venue: input.venue,
    startedAt: input.startedAt,
    endedAt: new Date(new Date(input.startedAt).getTime() + input.activeSeconds * 1000).toISOString(),
    activeSeconds: input.activeSeconds,
    calories: calories.calories,
    calorieMethod: calories.method,
    assumedWeight: calories.assumedWeight,
    jumps: input.jumps,
    distanceMeters: input.distanceMeters,
    intensity: input.intensity,
    peakIntensity: input.peakIntensity,
    peakOffsetSeconds: input.activeSeconds * 0.72,
    avgHeartRate: input.avgHeartRate,
    peakHeartRate: input.peakHeartRate,
    heartRateOrigin: 'measured',
    musicBpm: input.event?.musicBpm ?? null,
    nightKind: input.nightKind,
    note: input.note ?? null,
    respectIds: input.respectIds ?? [],
    partyScore: scoreParty({
      intensity: input.intensity,
      jumps: input.jumps,
      calories: calories.calories,
      activeSeconds: input.activeSeconds,
      distanceMeters: input.distanceMeters,
    }),
    route: input.route,
    intensitySeries: wave(input.intensity),
    shared: true,
  };
}

export function buildSeed(now = Date.now()) {
  const hour = 60 * 60 * 1000;
  const events: NightEvent[] = [
    {
      id: 'evt_warehouse',
      title: 'Warehouse 34',
      venue: 'Karaköy',
      city: 'İstanbul',
      startsAt: new Date(now - 2 * hour).toISOString(),
      musicBpm: 138,
      attendeeIds: ['usr_ece', 'usr_deniz', 'usr_kerem'],
    },
    {
      id: 'evt_sortie',
      title: 'Sortie Afterhours',
      venue: 'Muammer Karaca',
      city: 'İstanbul',
      startsAt: new Date(now + 3 * 24 * hour).toISOString(),
      musicBpm: 132,
      attendeeIds: ['usr_ece', 'usr_deniz'],
    },
    {
      id: 'evt_babylon',
      title: 'Babylon',
      venue: 'Şişhane',
      city: 'İstanbul',
      startsAt: new Date(now - 8 * 24 * hour).toISOString(),
      musicBpm: 118,
      attendeeIds: ['usr_aylin', 'usr_kerem'],
    },
  ];
  const warehouse = events[0]!;
  const babylon = events[2]!;
  const activities: ActivitySummary[] = [
    night({
      id: 'act_ece_warehouse',
      userId: 'usr_ece',
      event: warehouse,
      title: warehouse.title,
      venue: warehouse.venue,
      startedAt: warehouse.startsAt,
      activeSeconds: 78 * 60,
      jumps: 460,
      distanceMeters: 2400,
      intensity: 0.76,
      peakIntensity: 0.95,
      avgHeartRate: 151,
      peakHeartRate: 176,
      nightKind: 'rave',
      note: 'Pist kapanana kadar.',
      respectIds: ['usr_deniz', 'usr_kerem'],
      body: { age: 27, heightCm: 168, weightKg: 60, sex: 'female', fitnessLevel: 'high' },
      route: loop(41.022, 28.975),
    }),
    night({
      id: 'act_deniz_warehouse',
      userId: 'usr_deniz',
      event: warehouse,
      title: warehouse.title,
      venue: warehouse.venue,
      startedAt: warehouse.startsAt,
      activeSeconds: 70 * 60,
      jumps: 390,
      distanceMeters: 2100,
      intensity: 0.68,
      peakIntensity: 0.9,
      avgHeartRate: 146,
      peakHeartRate: 170,
      nightKind: 'rave',
      body: { age: 29, heightCm: 182, weightKg: 78, sex: 'male', fitnessLevel: 'medium' },
      route: loop(41.023, 28.976),
    }),
    night({
      id: 'act_kerem_warehouse',
      userId: 'usr_kerem',
      event: warehouse,
      title: warehouse.title,
      venue: warehouse.venue,
      startedAt: warehouse.startsAt,
      activeSeconds: 54 * 60,
      jumps: 240,
      distanceMeters: 1600,
      intensity: 0.55,
      peakIntensity: 0.8,
      avgHeartRate: 138,
      peakHeartRate: 162,
      nightKind: 'rave',
      body: { age: 31, heightCm: 176, weightKg: 74, sex: 'male', fitnessLevel: 'medium' },
      route: loop(41.021, 28.974),
    }),
    night({
      id: 'act_aylin_babylon',
      userId: 'usr_aylin',
      event: babylon,
      title: babylon.title,
      venue: babylon.venue,
      startedAt: babylon.startsAt,
      activeSeconds: 64 * 60,
      jumps: 210,
      distanceMeters: 1800,
      intensity: 0.5,
      peakIntensity: 0.74,
      avgHeartRate: 132,
      peakHeartRate: 158,
      nightKind: 'concert',
      body: { age: 26, heightCm: 165, weightKg: 58, sex: 'female', fitnessLevel: 'low' },
      route: loop(41.028, 28.973),
    }),
  ];
  const notifications: AppNotification[] = [
    {
      id: 'ntf_ece',
      title: 'Ece bir gece paylaştı',
      body: 'Warehouse 34 için Party Score tabloda.',
      createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
      read: false,
      href: '/event/evt_warehouse',
    },
    {
      id: 'ntf_board',
      title: 'Canlı liderlik',
      body: 'Warehouse 34 skorları açık.',
      createdAt: new Date(now - 2 * hour).toISOString(),
      read: false,
      href: '/event/evt_warehouse',
    },
  ];
  return { users, events, activities, notifications };
}

export function isUsernameTaken(username: string, usersList: PublicUser[], selfId?: string): boolean {
  return usersList.some((user) => user.username === username && user.id !== selfId);
}
