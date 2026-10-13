import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CityId, Genre } from '@/src/data/demo';

export type PrivacyMode = 'public' | 'friends' | 'ghost';
export type LanguageCode = 'tr' | 'en';

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
  eventId: string;
  reason: string;
  createdAt: string;
}

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  birthDate: string | null;
  language: LanguageCode;
  user: DemoUser | null;
  privacy: PrivacyMode;
  genres: Genre[];
  city: CityId;
  posts: LocalPost[];
  reports: LocalReport[];
  setHydrated: (value: boolean) => void;
  setBirthDate: (birthDate: string) => void;
  completeOnboarding: (input: { birthDate: string; user: DemoUser }) => void;
  setLanguage: (language: LanguageCode) => void;
  setPrivacy: (privacy: PrivacyMode) => void;
  toggleGenre: (genre: Genre) => void;
  setCity: (city: CityId) => void;
  addPost: (caption: string) => void;
  addReport: (eventId: string, reason: string) => void;
  signOut: () => void;
  deleteAccount: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      birthDate: null,
      language: 'tr',
      user: null,
      privacy: 'public',
      genres: ['techno', 'electro'],
      city: 'istanbul',
      posts: [],
      reports: [],
      setHydrated: (value) => set({ hydrated: value }),
      setBirthDate: (birthDate: string) => set({ birthDate }),
      completeOnboarding: ({ birthDate, user }) => set({ onboarded: true, birthDate, user }),
      setLanguage: (language) => set({ language }),
      setPrivacy: (privacy) => set({ privacy }),
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
      addReport: (eventId, reason) =>
        set({
          reports: [
            ...get().reports,
            { id: `report-${Date.now()}`, eventId, reason, createdAt: new Date().toISOString() },
          ],
        }),
      signOut: () => set({ onboarded: false, user: null }),
      deleteAccount: () =>
        set({
          onboarded: false,
          birthDate: null,
          user: null,
          privacy: 'public',
          genres: ['techno', 'electro'],
          posts: [],
          reports: [],
        }),
    }),
    {
      name: 'pulse-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        birthDate: state.birthDate,
        language: state.language,
        user: state.user,
        privacy: state.privacy,
        genres: state.genres,
        city: state.city,
        posts: state.posts,
        reports: state.reports,
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
