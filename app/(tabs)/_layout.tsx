import { Tabs } from 'expo-router';

import { PulseTabBar } from '@/src/components/PulseTabBar';
import { colors } from '@/src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PulseTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="night" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
