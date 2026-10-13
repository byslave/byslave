import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function Index() {
  const hydrated = useAppStore((state) => state.hydrated);
  const onboarded = useAppStore((state) => state.onboarded);
  const birthDate = useAppStore((state) => state.birthDate);
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!onboarded) {
    return <Redirect href={birthDate ? '/(onboarding)/auth' : '/(onboarding)/welcome'} />;
  }
  return <Redirect href="/(tabs)" />;
}
