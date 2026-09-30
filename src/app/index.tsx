import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { brand } from '../config/brand';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/tokens';

export default function Index() {
  const { ready, profile } = useAppState();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? '/(tabs)' : '/onboarding');
  }, [profile, ready, router]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontSize: 42, fontWeight: '700' }}>{brand.name}</Text>
    </View>
  );
}
