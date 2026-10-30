import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CityId, Genre, VenueType } from '@/src/data/demo';

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
        set({ onboarded: true, birthDate, user, profileReady: false, privacy: 'friends', privacyOnServer: false }),
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
