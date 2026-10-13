import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import i18n from '@/src/lib/i18n';
import { useAppStore, useAttendanceStore } from '@/src/stores/appStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const language = useAppStore((state) => state.language);
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    const finishApp = () => useAppStore.getState().setHydrated(true);
    const finishAttendance = () => useAttendanceStore.getState().setHydrated(true);
    const unsubApp = useAppStore.persist.onFinishHydration(finishApp);
    const unsubAttendance = useAttendanceStore.persist.onFinishHydration(finishAttendance);
    if (useAppStore.persist.hasHydrated()) finishApp();
    if (useAttendanceStore.persist.hasHydrated()) finishAttendance();
    return () => {
      unsubApp();
      unsubAttendance();
    };
  }, []);

  useEffect(() => {
    if (hydrated) void i18n.changeLanguage(language);
  }, [hydrated, language]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
