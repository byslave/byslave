import type { ActivitySummary, AppSnapshot, Profile } from '../domain/types';

export interface ActivityRepository {
  readonly mode: 'demo' | 'supabase';
  load(): Promise<AppSnapshot>;
  saveProfile(profile: Profile): Promise<void>;
  saveActivity(activity: ActivitySummary): Promise<void>;
  joinEvent(eventId: string, userId: string): Promise<void>;
  markNotificationRead(id: string): Promise<void>;
  clearLocal(): Promise<void>;
  subscribe?(onChange: () => void): () => void;
}
