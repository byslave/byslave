import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/src/lib/i18n';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppCanvas } from '@/src/components/AppCanvas';
import { AppProviders } from '@/src/components/AppProviders';
import { ToastHost } from '@/src/components/ui/Toast';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function SessionGate() {
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const onboarded = useAppStore((state) => state.onboarded);
  const birthDate = useAppStore((state) => state.birthDate);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0];
    if (onboarded && (group === '(onboarding)' || pathname === '/')) {
      router.replace('/(tabs)');
    }
    if (!onboarded && group === '(tabs)') {
      router.replace(birthDate ? '/(onboarding)/auth' : '/(onboarding)/welcome');
    }
  }, [birthDate, hydrated, onboarded, pathname, router, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppProviders>
        <SessionGate />
        <AppCanvas>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event/[id]" />
            <Stack.Screen name="dev/ui" />
          </Stack>
          <ToastHost />
        </AppCanvas>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
