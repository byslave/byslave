import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CityId, Genre, VenueType } from '@/src/data/demo';
import type { EventOverride, InboxItem, ModerationEntry, OrganizerApplication, PulseEvent, VenueClaim } from '@/src/features/events/model';
import { expireIfEnded } from '@/src/features/events/schedule';
import { applyReport } from '@/src/features/events/verification';

export type PrivacyMode = 'public' | 'friends' | 'ghost';
export type LanguageCode = 'tr' | 'en';
export type ConsentKind = 'location' | 'motion' | 'photos';
export type ReportTarget = 'event' | 'post' | 'person';

export interface DemoUser {
  id: string;
  email: string;
}

interface LocalPost {
  id: string;
  caption: string;
  createdAt: string;
  city: CityId;
}

interface LocalReport {
  id: string;
  target: ReportTarget;
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface ConsentRecord {
  granted: boolean;
  updatedAt: string;
}

export interface NightRecord {
  id: string;
  startedAt: string;
  minutes: number;
  jumps: number;
  rankable: boolean;
}

export interface CustomVenue {
  id: string;
  name: string;
  city: CityId;
  district: string;
  street: string;
  lat: number;
  lng: number;
  type: VenueType;
  rules: string;
  status: 'pending';
}

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  profileReady: boolean | null;
  birthDate: string | null;
  language: LanguageCode;
  user: DemoUser | null;
  displayName: string;
  username: string;
  bio: string;
  avatarDataUrl: string | null;
  privacy: PrivacyMode;
  privacyOnServer: boolean;
  genres: Genre[];
  city: CityId;
  posts: LocalPost[];
  reports: LocalReport[];
  customVenues: CustomVenue[];
  friendIds: string[];
  blockedIds: string[];
  consents: Partial<Record<ConsentKind, ConsentRecord>>;
  notifyFriends: boolean;
  notifyEvents: boolean;
  notifyWaves: boolean;
  seenRecordHint: boolean;
  finishedNights: NightRecord[];
  accountCreatedAt: string | null;
  localEvents: PulseEvent[];
  eventOverrides: Record<string, EventOverride>;
  organizer: OrganizerApplication | null;
  venueClaims: VenueClaim[];
  moderationLog: ModerationEntry[];
  inbox: InboxItem[];
  recordingEventId: string | null;
  setHydrated: (value: boolean) => void;
  setBirthDate: (birthDate: string) => void;
  completeOnboarding: (input: { birthDate: string; user: DemoUser }) => void;
  finishSetup: (input: { displayName: string; username: string; bio: string; avatarDataUrl: string | null }) => void;
  setAvatar: (avatarDataUrl: string | null) => void;
  setLanguage: (language: LanguageCode) => void;
  setPrivacy: (privacy: PrivacyMode) => void;
  setPrivacyOnServer: (value: boolean) => void;
  toggleGenre: (genre: Genre) => void;
  setCity: (city: CityId) => void;
  addPost: (caption: string) => void;
  addReport: (input: { target: ReportTarget; targetId: string; reason: string }) => void;
  addVenue: (input: Omit<CustomVenue, 'id' | 'status'>) => string;
  setConsent: (kind: ConsentKind, granted: boolean) => void;
  blockPerson: (id: string) => void;
  unblockPerson: (id: string) => void;
  addFriend: (id: string) => void;
  removeFriend: (id: string) => void;
  setNotify: (key: 'notifyFriends' | 'notifyEvents' | 'notifyWaves', value: boolean) => void;
  markRecordHint: () => void;
  addFinishedNight: (record: NightRecord) => void;
  addLocalEvent: (event: PulseEvent) => void;
  reportEvent: (eventId: string, reporterId: string) => { held: boolean };
  moderateEvent: (input: { eventId: string; actorId: string; action: 'approve' | 'reject' | 'hide'; reason: string }) => void;
  submitOrganizer: (input: Omit<OrganizerApplication, 'status' | 'note'>) => void;
  reviewOrganizer: (input: { actorId: string; status: 'approved' | 'rejected'; reason: string }) => void;
  submitVenueClaim: (input: { venueId: string; contact: string }) => void;
  reviewVenueClaim: (input: { claimId: string; actorId: string; status: 'approved' | 'rejected'; reason: string }) => void;
  cancelOwnedEvent: (eventId: string) => PulseEvent | null;
  postponeOwnedEvent: (event: PulseEvent) => void;
  expireDue: (now: Date) => void;
  pushInbox: (item: Omit<InboxItem, 'id' | 'at'>) => void;
  setRecording: (eventId: string | null) => void;
  signOut: () => void;
  deleteAccount: () => void;
}

const emptyPersonal = {
  onboarded: false,
  profileReady: null as boolean | null,
  birthDate: null as string | null,
  user: null as DemoUser | null,
  displayName: '',
  username: '',
  bio: '',
  avatarDataUrl: null as string | null,
  privacy: 'friends' as PrivacyMode,
  privacyOnServer: false,
  genres: ['techno', 'electro'] as Genre[],
  posts: [] as LocalPost[],
  reports: [] as LocalReport[],
  customVenues: [] as CustomVenue[],
  friendIds: [] as string[],
  blockedIds: [] as string[],
  consents: {} as Partial<Record<ConsentKind, ConsentRecord>>,
  finishedNights: [] as NightRecord[],
  accountCreatedAt: null as string | null,
  localEvents: [] as PulseEvent[],
  eventOverrides: {} as Record<string, EventOverride>,
  organizer: null as OrganizerApplication | null,
  venueClaims: [] as VenueClaim[],
  moderationLog: [] as ModerationEntry[],
  inbox: [] as InboxItem[],
  recordingEventId: null as string | null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...emptyPersonal,
      language: 'tr',
      city: 'istanbul',
      notifyFriends: true,
      notifyEvents: true,
      notifyWaves: true,
      seenRecordHint: false,
      setHydrated: (value) => set({ hydrated: value }),
      setBirthDate: (birthDate: string) => set({ birthDate }),
      completeOnboarding: ({ birthDate, user }) =>
        set({
          onboarded: true,
          birthDate,
          user,
          profileReady: false,
          privacy: 'friends',
          privacyOnServer: false,
          accountCreatedAt: get().accountCreatedAt ?? new Date().toISOString(),
        }),
      finishSetup: ({ displayName, username, bio, avatarDataUrl }) =>
        set({ profileReady: true, displayName, username, bio, avatarDataUrl }),
      setAvatar: (avatarDataUrl) => set({ avatarDataUrl }),
      setLanguage: (language) => set({ language }),
      setPrivacy: (privacy) => set({ privacy, privacyOnServer: false }),
      setPrivacyOnServer: (value) => set({ privacyOnServer: value }),
      toggleGenre: (genre) => {
        const current = get().genres;
        set({
          genres: current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
        });
      },
      setCity: (city) => set({ city }),
      addPost: (caption) =>
        set({
          posts: [
            {
              id: `local-${Date.now()}`,
              caption,
              createdAt: new Date().toISOString(),
              city: get().city,
            },
            ...get().posts,
          ],
        }),
      addReport: ({ target, targetId, reason }) =>
        set({
          reports: [...get().reports, { id: `report-${Date.now()}`, target, targetId, reason, createdAt: new Date().toISOString() }],
        }),
      addVenue: (input) => {
        const id = `venue-${Date.now()}`;
        set({ customVenues: [{ ...input, id, status: 'pending' }, ...get().customVenues] });
        return id;
      },
      setConsent: (kind, granted) =>
        set({
          consents: { ...get().consents, [kind]: { granted, updatedAt: new Date().toISOString() } },
          ...(kind === 'photos' && !granted ? { avatarDataUrl: null } : {}),
        }),
      blockPerson: (id) =>
        set({
          blockedIds: get().blockedIds.includes(id) ? get().blockedIds : [...get().blockedIds, id],
          friendIds: get().friendIds.filter((friend) => friend !== id),
        }),
      unblockPerson: (id) => set({ blockedIds: get().blockedIds.filter((item) => item !== id) }),
      addFriend: (id) => {
        if (get().blockedIds.includes(id) || get().friendIds.includes(id)) return;
        set({ friendIds: [...get().friendIds, id] });
      },
      removeFriend: (id) => set({ friendIds: get().friendIds.filter((item) => item !== id) }),
      setNotify: (key, value) => set({ [key]: value }),
      markRecordHint: () => set({ seenRecordHint: true }),
      addFinishedNight: (record) => set({ finishedNights: [record, ...get().finishedNights] }),
      addLocalEvent: (event) => set({ localEvents: [event, ...get().localEvents] }),
      reportEvent: (eventId, reporterId) => {
        const local = get().localEvents.find((event) => event.id === eventId);
        if (local) {
          const next = applyReport({ reporters: local.reporters, reporterId, verification: local.verificationStatus });
          set({
            localEvents: get().localEvents.map((event) =>
              event.id === eventId ? { ...event, reporters: next.reporters, verificationStatus: next.verification, held: next.held } : event,
            ),
          });
          return { held: next.held };
        }
        const current = get().eventOverrides[eventId] ?? { reporters: [], held: false };
        const next = applyReport({
          reporters: current.reporters,
          reporterId,
          verification: current.verificationStatus ?? 'unverified',
        });
        set({
          eventOverrides: {
            ...get().eventOverrides,
            [eventId]: { ...current, reporters: next.reporters, verificationStatus: next.verification, held: next.held },
          },
        });
        return { held: next.held };
      },
      moderateEvent: ({ eventId, actorId, action, reason }) => {
        const at = new Date().toISOString();
        const entry: ModerationEntry = { id: `mod-${Date.now()}`, at, actorId, action, targetId: eventId, reason };
        const local = get().localEvents.find((event) => event.id === eventId);
        const patch =
          action === 'approve'
            ? { verificationStatus: 'verified' as const, held: false, verifiedAt: at, verifiedBy: actorId, verificationNote: reason }
            : action === 'reject'
              ? { verificationStatus: 'rejected' as const, held: true, verificationNote: reason }
              : { verificationStatus: 'pending' as const, held: true, verificationNote: reason };
        if (local) {
          set({
            localEvents: get().localEvents.map((event) => (event.id === eventId ? { ...event, ...patch } : event)),
            moderationLog: [entry, ...get().moderationLog],
          });
          return;
        }
        const current = get().eventOverrides[eventId] ?? { reporters: [], held: false };
        set({
          eventOverrides: { ...get().eventOverrides, [eventId]: { ...current, ...patch } },
          moderationLog: [entry, ...get().moderationLog],
        });
      },
      submitOrganizer: (input) => set({ organizer: { ...input, status: 'pending', note: '' } }),
      reviewOrganizer: ({ actorId, status, reason }) => {
        const current = get().organizer;
        if (!current) return;
        const entry: ModerationEntry = {
          id: `mod-${Date.now()}`,
          at: new Date().toISOString(),
          actorId,
          action: status === 'approved' ? 'approve-organizer' : 'reject-organizer',
          targetId: current.email,
          reason,
        };
        set({ organizer: { ...current, status, note: reason }, moderationLog: [entry, ...get().moderationLog] });
      },
      submitVenueClaim: ({ venueId, contact }) =>
        set({
          venueClaims: [{ id: `claim-${Date.now()}`, venueId, contact, status: 'pending', note: '' }, ...get().venueClaims],
        }),
      reviewVenueClaim: ({ claimId, actorId, status, reason }) => {
        const entry: ModerationEntry = {
          id: `mod-${Date.now()}`,
          at: new Date().toISOString(),
          actorId,
          action: status === 'approved' ? 'approve-claim' : 'reject-claim',
          targetId: claimId,
          reason,
        };
        set({
          venueClaims: get().venueClaims.map((claim) => (claim.id === claimId ? { ...claim, status, note: reason } : claim)),
          moderationLog: [entry, ...get().moderationLog],
        });
      },
      cancelOwnedEvent: (eventId) => {
        const event = get().localEvents.find((item) => item.id === eventId);
        if (!event) return null;
        const next = { ...event, status: 'cancelled' as const };
        set({ localEvents: get().localEvents.map((item) => (item.id === eventId ? next : item)) });
        return next;
      },
      postponeOwnedEvent: (event) => set({ localEvents: get().localEvents.map((item) => (item.id === event.id ? event : item)) }),
      expireDue: (now) => {
        let changed = false;
        const localEvents = get().localEvents.map((event) => {
          const next = expireIfEnded(
            {
              status: event.status,
              startAt: event.startAt,
              endAt: event.endAt,
              sessions: event.sessions,
              verificationStatus: event.verificationStatus,
              held: event.held,
            },
            now,
          );
          if (next.status === event.status) return event;
          changed = true;
          return { ...event, status: next.status };
        });
        if (changed) set({ localEvents });
      },
      pushInbox: (item) => set({ inbox: [{ ...item, id: `note-${Date.now()}`, at: new Date().toISOString() }, ...get().inbox] }),
      setRecording: (eventId) => set({ recordingEventId: eventId }),
      signOut: () => set({ onboarded: false, user: null }),
      deleteAccount: () =>
        set({
          ...emptyPersonal,
          language: get().language,
          city: get().city,
        }),
    }),
    {
      name: 'pulse-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        profileReady: state.profileReady,
        birthDate: state.birthDate,
        language: state.language,
        user: state.user,
        displayName: state.displayName,
        username: state.username,
        bio: state.bio,
        avatarDataUrl: state.avatarDataUrl,
        privacy: state.privacy,
        privacyOnServer: state.privacyOnServer,
        genres: state.genres,
        city: state.city,
        posts: state.posts,
        reports: state.reports,
        customVenues: state.customVenues,
        friendIds: state.friendIds,
        blockedIds: state.blockedIds,
        consents: state.consents,
        notifyFriends: state.notifyFriends,
        notifyEvents: state.notifyEvents,
        notifyWaves: state.notifyWaves,
        seenRecordHint: state.seenRecordHint,
        finishedNights: state.finishedNights,
        accountCreatedAt: state.accountCreatedAt,
        localEvents: state.localEvents,
        eventOverrides: state.eventOverrides,
        organizer: state.organizer,
        venueClaims: state.venueClaims,
        moderationLog: state.moderationLog,
        inbox: state.inbox,
        recordingEventId: state.recordingEventId,
      }),
    },
  ),
);

export const useAttendanceStore = create<{
  hydrated: boolean;
  byEvent: Record<string, 'interested' | 'going' | 'checked_in' | 'left' | undefined>;
  setHydrated: (value: boolean) => void;
  setStatus: (eventId: string, status: 'interested' | 'going' | null) => void;
  reset: () => void;
}>()(
  persist(
    (set, get) => ({
      hydrated: false,
      byEvent: {},
      setHydrated: (value) => set({ hydrated: value }),
      setStatus: (eventId, status) =>
        set({
          byEvent: { ...get().byEvent, [eventId]: status ?? undefined },
        }),
      reset: () => set({ byEvent: {} }),
    }),
    {
      name: 'pulse-attendance',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ byEvent: state.byEvent }),
    },
  ),
);
