import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivitySummary, AppSnapshot, Profile, PublicUser } from '../domain/types';
import type { ActivityRepository } from './repository';
import { buildSeed } from './seed';

const STORAGE_KEY = 'nightlife.demo.v2';

type Persisted = {
  profile: Profile | null;
  activities: ActivitySummary[];
  joinedEventIds: string[];
  readNotificationIds: string[];
  followingIds: string[];
  respectedActivityIds: string[];
  notes: { activityId: string; note: string }[];
};

function blank(): Persisted {
  return {
    profile: null,
    activities: [],
    joinedEventIds: [],
    readNotificationIds: [],
    followingIds: [],
    respectedActivityIds: [],
    notes: [],
  };
}

function toPublic(profile: Profile): PublicUser {
  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    avatarColor: profile.avatarColor,
    avatarUri: profile.avatarUri,
  };
}

type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export class DemoRepository implements ActivityRepository {
  readonly mode = 'demo' as const;
  private persisted: Persisted = blank();

  constructor(private readonly storage: KeyValueStore = AsyncStorage) {}

  private snapshot(): AppSnapshot {
    const seed = buildSeed();
    const profile = this.persisted.profile;
    const events = seed.events.map((event) => {
      if (!profile || !this.persisted.joinedEventIds.includes(event.id)) return event;
      return { ...event, attendeeIds: [...new Set([...event.attendeeIds, profile.id])] };
    });
    return {
      profile,
      users: profile ? [...seed.users, toPublic(profile)] : seed.users,
      events,
      activities: [...seed.activities, ...this.persisted.activities].map((activity) => {
        const note = this.persisted.notes.find((item) => item.activityId === activity.id)?.note ?? activity.note ?? null;
        const respectIds = [...(activity.respectIds ?? [])];
        if (profile && this.persisted.respectedActivityIds.includes(activity.id) && !respectIds.includes(profile.id)) {
          respectIds.push(profile.id);
        }
        if (profile && !this.persisted.respectedActivityIds.includes(activity.id)) {
          const mine = respectIds.indexOf(profile.id);
          if (mine >= 0) respectIds.splice(mine, 1);
        }
        return { ...activity, nightKind: activity.nightKind ?? null, note, respectIds };
      }),
      followingIds: this.persisted.followingIds,
      notifications: seed.notifications.map((item) => ({
        ...item,
        read: item.read || this.persisted.readNotificationIds.includes(item.id),
      })),
    };
  }

  private async persist() {
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(this.persisted));
  }

  async load(): Promise<AppSnapshot> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    this.persisted = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
    return this.snapshot();
  }

  async saveProfile(profile: Profile) {
    this.persisted.profile = profile;
    await this.persist();
  }

  async saveActivity(activity: ActivitySummary) {
    this.persisted.activities = [...this.persisted.activities.filter((item) => item.id !== activity.id), activity];
    if (activity.eventId && !this.persisted.joinedEventIds.includes(activity.eventId)) {
      this.persisted.joinedEventIds = [...this.persisted.joinedEventIds, activity.eventId];
    }
    await this.persist();
  }

  async joinEvent(eventId: string, _userId: string) {
    if (!this.persisted.joinedEventIds.includes(eventId)) {
      this.persisted.joinedEventIds = [...this.persisted.joinedEventIds, eventId];
      await this.persist();
    }
  }

  async markNotificationRead(id: string) {
    if (!this.persisted.readNotificationIds.includes(id)) {
      this.persisted.readNotificationIds = [...this.persisted.readNotificationIds, id];
      await this.persist();
    }
  }

  async markAllNotificationsRead() {
    const ids = buildSeed().notifications.map((item) => item.id);
    this.persisted.readNotificationIds = [...new Set([...this.persisted.readNotificationIds, ...ids])];
    await this.persist();
  }

  async setNote(activityId: string, note: string) {
    const trimmed = note.trim().slice(0, 80);
    const own = this.persisted.activities.find((item) => item.id === activityId);
    if (own) own.note = trimmed || null;
    this.persisted.notes = this.persisted.notes.filter((item) => item.activityId !== activityId);
    if (trimmed) this.persisted.notes.push({ activityId, note: trimmed });
    await this.persist();
  }

  async toggleRespect(activityId: string, userId: string) {
    if (this.persisted.profile?.id !== userId) return;
    const has = this.persisted.respectedActivityIds.includes(activityId);
    this.persisted.respectedActivityIds = has
      ? this.persisted.respectedActivityIds.filter((id) => id !== activityId)
      : [...this.persisted.respectedActivityIds, activityId];
    await this.persist();
  }

  async toggleFollow(userId: string) {
    const has = this.persisted.followingIds.includes(userId);
    this.persisted.followingIds = has
      ? this.persisted.followingIds.filter((id) => id !== userId)
      : [...this.persisted.followingIds, userId];
    await this.persist();
  }

  async clearLocal() {
    this.persisted = blank();
    await this.storage.removeItem(STORAGE_KEY);
  }
}
