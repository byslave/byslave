import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabase } from '../supabase/client';
import { createRepository, type ActivityRepository } from '../data';
import type { ActivityComment, ActivitySummary, AppNotification, NightEvent, Profile, PublicUser } from '../domain/types';

export type OnboardingDraft = Omit<Profile, 'id'> & { email?: string; password?: string };

type AppContextValue = {
  ready: boolean;
  mode: 'demo' | 'supabase';
  modeNote: string;
  profile: Profile | null;
  users: PublicUser[];
  events: NightEvent[];
  activities: ActivitySummary[];
  notifications: AppNotification[];
  followingIds: string[];
  comments: ActivityComment[];
  seenBadgeKeys: string[];
  completeOnboarding: (draft: OnboardingDraft) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  saveActivity: (activity: ActivitySummary) => Promise<void>;
  joinEvent: (eventId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setNote: (activityId: string, note: string) => Promise<void>;
  toggleRespect: (activityId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  addComment: (activityId: string, text: string) => Promise<void>;
  acknowledgeBadges: (keys: string[]) => Promise<void>;
  resetLocal: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<ActivityRepository | null>(null);
  const [modeNote, setModeNote] = useState('');
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [events, setEvents] = useState<NightEvent[]>([]);
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [seenBadgeKeys, setSeenBadgeKeys] = useState<string[]>([]);

  const apply = (snapshot: Awaited<ReturnType<ActivityRepository['load']>>) => {
    setProfile(snapshot.profile);
    setUsers(snapshot.users);
    setEvents(snapshot.events);
    setActivities(snapshot.activities);
    setNotifications(snapshot.notifications);
    setFollowingIds(snapshot.followingIds);
    setComments(snapshot.comments);
    setSeenBadgeKeys(snapshot.seenBadgeKeys);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let alive = true;
    void (async () => {
      const created = await createRepository();
      if (!alive) return;
      setRepo(created.repo);
      setModeNote(created.note);
      apply(await created.repo.load());
      setReady(true);
      if (created.repo.subscribe) {
        unsubscribe = created.repo.subscribe(() => {
          void created.repo.load().then(apply);
        });
      }
    })();
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AppContextValue>(() => {
    return {
      ready,
      mode: repo?.mode ?? 'demo',
      modeNote,
      profile,
      users,
      events,
      activities,
      notifications,
      followingIds,
      comments,
      seenBadgeKeys,
      async completeOnboarding(draft) {
        if (!repo) return;
        let id: string = crypto.randomUUID();
        if (repo.mode === 'supabase') {
          const supabase = getSupabase();
          if (!supabase || !draft.email || !draft.password) throw new Error('E-posta ve şifre gerekli.');
          const { data, error } = await supabase.auth.signUp({ email: draft.email, password: draft.password });
          if (error) throw new Error(error.message);
          if (!data.session || !data.user) throw new Error('Hesap açıldı ama oturum yok. E-postanı doğrulayıp tekrar dene.');
          id = data.user.id;
        }
        const next: Profile = { ...draft, id };
        await repo.saveProfile(next);
        apply(await repo.load());
      },
      async updateProfile(patch) {
        if (!repo || !profile) return;
        await repo.saveProfile({ ...profile, ...patch, id: profile.id });
        apply(await repo.load());
      },
      async saveActivity(activity) {
        if (!repo) return;
        await repo.saveActivity(activity);
        apply(await repo.load());
      },
      async joinEvent(eventId) {
        if (!repo || !profile) return;
        await repo.joinEvent(eventId, profile.id);
        apply(await repo.load());
      },
      async markNotificationRead(id) {
        if (!repo) return;
        await repo.markNotificationRead(id);
        apply(await repo.load());
      },
      async markAllNotificationsRead() {
        if (!repo) return;
        await repo.markAllNotificationsRead();
        apply(await repo.load());
      },
      async setNote(activityId, note) {
        if (!repo) return;
        await repo.setNote(activityId, note);
        apply(await repo.load());
      },
      async toggleRespect(activityId) {
        if (!repo || !profile) return;
        await repo.toggleRespect(activityId, profile.id);
        apply(await repo.load());
      },
      async toggleFollow(userId) {
        if (!repo || !profile || profile.id === userId) return;
        await repo.toggleFollow(userId);
        apply(await repo.load());
      },
      async addComment(activityId, text) {
        if (!repo) return;
        await repo.addComment(activityId, text);
        apply(await repo.load());
      },
      async acknowledgeBadges(keys) {
        if (!repo) return;
        await repo.acknowledgeBadges(keys);
        apply(await repo.load());
      },
      async resetLocal() {
        if (!repo) return;
        await repo.clearLocal();
        apply(await repo.load());
      },
    };
  }, [activities, comments, events, followingIds, modeNote, notifications, profile, ready, repo, seenBadgeKeys, users]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppState yok');
  return value;
}
