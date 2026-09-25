import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivitySummary,
  AppNotification,
  AppSnapshot,
  NightEvent,
  Profile,
  PublicUser,
} from '../domain/types';
import type { ActivityRepository } from './repository';

function asProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    username: String(row.username),
    avatarColor: String(row.avatar_color ?? '#151515'),
    avatarUri: row.avatar_url ? String(row.avatar_url) : undefined,
    age: row.age == null ? null : Number(row.age),
    heightCm: row.height_cm == null ? null : Number(row.height_cm),
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    sex: (row.sex as Profile['sex']) ?? null,
    fitnessLevel: (row.fitness_level as Profile['fitnessLevel']) ?? 'medium',
    healthStatus: row.health_status as Profile['healthStatus'],
    watchStatus: row.watch_status as Profile['watchStatus'],
    watchLabel: row.watch_label ? String(row.watch_label) : null,
    healthNote: row.health_note ? String(row.health_note) : null,
    watchNote: row.watch_note ? String(row.watch_note) : null,
    motionStatus: row.motion_status as Profile['motionStatus'],
    locationStatus: row.location_status as Profile['locationStatus'],
    notificationStatus: row.notification_status as Profile['notificationStatus'],
  };
}

function asActivity(row: Record<string, unknown>): ActivitySummary {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    eventId: row.event_id ? String(row.event_id) : null,
    title: String(row.title),
    venue: String(row.venue),
    startedAt: String(row.started_at),
    endedAt: String(row.ended_at),
    activeSeconds: Number(row.active_seconds),
    calories: Number(row.calories),
    calorieMethod: row.calorie_method as ActivitySummary['calorieMethod'],
    assumedWeight: Boolean(row.assumed_weight),
    jumps: Number(row.jumps),
    distanceMeters: Number(row.distance_meters),
    intensity: Number(row.intensity),
    peakIntensity: Number(row.peak_intensity),
    peakOffsetSeconds: Number(row.peak_offset_seconds ?? 0),
    avgHeartRate: row.avg_heart_rate == null ? null : Number(row.avg_heart_rate),
    peakHeartRate: row.peak_heart_rate == null ? null : Number(row.peak_heart_rate),
    heartRateOrigin: row.heart_rate_origin as ActivitySummary['heartRateOrigin'],
    musicBpm: row.music_bpm == null ? null : Number(row.music_bpm),
    nightKind: (row.night_kind as ActivitySummary['nightKind']) ?? null,
    note: row.note ? String(row.note) : null,
    respectIds: [],
    partyScore: Number(row.party_score),
    route: (row.route as ActivitySummary['route']) ?? [],
    intensitySeries: (row.intensity_series as number[]) ?? [],
    shared: Boolean(row.shared),
  };
}

export class SupabaseRepository implements ActivityRepository {
  readonly mode = 'supabase' as const;

  constructor(private readonly client: SupabaseClient) {}

  async load(): Promise<AppSnapshot> {
    const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user.id;
    let profile: Profile | null = null;
    if (userId) {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      profile = data ? asProfile(data) : null;
    }
    const [eventsRes, peopleRes, attendeesRes, activitiesRes, notesRes, respectsRes, followsRes] = await Promise.all([
      this.client.from('events').select('*').order('starts_at'),
      this.client.from('profiles').select('id, display_name, username, avatar_color, avatar_url'),
      this.client.from('event_attendees').select('event_id, user_id'),
      this.client.from('activities').select('*').order('started_at', { ascending: false }),
      userId
        ? this.client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      this.client.from('activity_respects').select('activity_id, user_id'),
      userId
        ? this.client.from('follows').select('following_id').eq('follower_id', userId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (eventsRes.error) throw eventsRes.error;
    if (peopleRes.error) throw peopleRes.error;
    if (attendeesRes.error) throw attendeesRes.error;
    if (activitiesRes.error) throw activitiesRes.error;
    if (notesRes.error) throw notesRes.error;
    if (respectsRes.error) throw respectsRes.error;
    if (followsRes.error) throw followsRes.error;
    const respectMap = new Map<string, string[]>();
    for (const row of respectsRes.data ?? []) {
      const list = respectMap.get(row.activity_id) ?? [];
      list.push(row.user_id);
      respectMap.set(row.activity_id, list);
    }
    const attendeeMap = new Map<string, string[]>();
    for (const row of attendeesRes.data ?? []) {
      const list = attendeeMap.get(row.event_id) ?? [];
      list.push(row.user_id);
      attendeeMap.set(row.event_id, list);
    }
    const events: NightEvent[] = (eventsRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      venue: row.venue,
      city: row.city,
      startsAt: row.starts_at,
      musicBpm: row.music_bpm == null ? null : Number(row.music_bpm),
      attendeeIds: attendeeMap.get(row.id) ?? [],
    }));
    const users: PublicUser[] = (peopleRes.data ?? []).map((row) => ({
      id: row.id,
      displayName: row.display_name,
      username: row.username,
      avatarColor: row.avatar_color,
      avatarUri: row.avatar_url ?? undefined,
    }));
    const notifications: AppNotification[] = (notesRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      read: row.read,
      href: row.href,
    }));
    return {
      profile,
      users,
      events,
      activities: (activitiesRes.data ?? []).map((row) => ({
        ...asActivity(row),
        respectIds: respectMap.get(row.id) ?? [],
      })),
      notifications,
      followingIds: (followsRes.data ?? []).map((row) => row.following_id),
    };
  }

  async saveProfile(profile: Profile) {
    const { error } = await this.client.from('profiles').upsert({
      id: profile.id,
      username: profile.username,
      display_name: profile.displayName,
      avatar_url: profile.avatarUri ?? null,
      avatar_color: profile.avatarColor,
      age: profile.age,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      sex: profile.sex,
      fitness_level: profile.fitnessLevel,
      health_status: profile.healthStatus,
      watch_status: profile.watchStatus,
      watch_label: profile.watchLabel,
      health_note: profile.healthNote,
      watch_note: profile.watchNote,
      motion_status: profile.motionStatus,
      location_status: profile.locationStatus,
      notification_status: profile.notificationStatus,
    });
    if (error) throw error;
  }

  async saveActivity(activity: ActivitySummary) {
    const { error } = await this.client.from('activities').upsert({
      id: activity.id,
      user_id: activity.userId,
      event_id: activity.eventId,
      title: activity.title,
      venue: activity.venue,
      started_at: activity.startedAt,
      ended_at: activity.endedAt,
      active_seconds: Math.round(activity.activeSeconds),
      calories: activity.calories,
      calorie_method: activity.calorieMethod,
      assumed_weight: activity.assumedWeight,
      jumps: activity.jumps,
      distance_meters: activity.distanceMeters,
      intensity: activity.intensity,
      peak_intensity: activity.peakIntensity,
      peak_offset_seconds: activity.peakOffsetSeconds,
      avg_heart_rate: activity.avgHeartRate,
      peak_heart_rate: activity.peakHeartRate,
      heart_rate_origin: activity.heartRateOrigin,
      music_bpm: activity.musicBpm,
      night_kind: activity.nightKind,
      note: activity.note,
      party_score: activity.partyScore,
      route: activity.route,
      intensity_series: activity.intensitySeries,
      shared: activity.shared,
    });
    if (error) throw error;
    if (activity.eventId) await this.joinEvent(activity.eventId, activity.userId);
  }

  async joinEvent(eventId: string, userId: string) {
    const { error } = await this.client.from('event_attendees').upsert({ event_id: eventId, user_id: userId });
    if (error) throw error;
  }

  async markNotificationRead(id: string) {
    const { error } = await this.client.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  }

  async markAllNotificationsRead() {
    const { data } = await this.client.auth.getUser();
    if (!data.user) return;
    const { error } = await this.client.from('notifications').update({ read: true }).eq('user_id', data.user.id).eq('read', false);
    if (error) throw error;
  }

  async setNote(activityId: string, note: string) {
    const { error } = await this.client.from('activities').update({ note: note.trim().slice(0, 80) || null }).eq('id', activityId);
    if (error) throw error;
  }

  async toggleRespect(activityId: string, userId: string) {
    const { data, error: readError } = await this.client
      .from('activity_respects')
      .select('user_id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle();
    if (readError) throw readError;
    const { error } = data
      ? await this.client.from('activity_respects').delete().eq('activity_id', activityId).eq('user_id', userId)
      : await this.client.from('activity_respects').insert({ activity_id: activityId, user_id: userId });
    if (error) throw error;
  }

  async toggleFollow(userId: string) {
    const { data: sessionData, error: sessionError } = await this.client.auth.getUser();
    if (sessionError) throw sessionError;
    const followerId = sessionData.user?.id;
    if (!followerId || followerId === userId) return;
    const { data, error: readError } = await this.client
      .from('follows')
      .select('following_id')
      .eq('follower_id', followerId)
      .eq('following_id', userId)
      .maybeSingle();
    if (readError) throw readError;
    const { error } = data
      ? await this.client.from('follows').delete().eq('follower_id', followerId).eq('following_id', userId)
      : await this.client.from('follows').insert({ follower_id: followerId, following_id: userId });
    if (error) throw error;
  }

  async clearLocal() {
    await this.client.auth.signOut();
  }

  subscribe(onChange: () => void) {
    const channel = this.client
      .channel('activities-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => onChange())
      .subscribe();
    return () => {
      void this.client.removeChannel(channel);
    };
  }
}
