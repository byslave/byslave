import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../state/AppState';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 480, backgroundColor: colors.bg }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
          </View>
        </View>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
