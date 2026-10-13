import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { AudioLines, Map, Rows3, Trophy, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { haptic } from '@/src/lib/haptics';
import { colors, fonts } from '@/src/theme/tokens';

const icons = {
  index: Map,
  feed: Rows3,
  night: AudioLines,
  leaderboard: Trophy,
  profile: UserRound,
} as const;

export function PulseTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    index: t('tabs.map'),
    feed: t('tabs.feed'),
    night: t('tabs.night'),
    leaderboard: t('tabs.board'),
    profile: t('tabs.profile'),
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons] ?? Map;
        const center = route.name === 'night';
        const onPress = () => {
          haptic('select');
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={labels[route.name] ?? route.name}
            onPress={onPress}
            style={styles.item}
          >
            <View style={[styles.iconWrap, center && styles.center, focused && !center && styles.focused]}>
              <Icon color={center || focused ? colors.accentInk : colors.textFaint} size={center ? 22 : 20} />
            </View>
            {!center ? (
              <Text style={[styles.label, focused && styles.labelOn]} maxFontSizeMultiplier={1.2}>
                {labels[route.name]}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(14,12,20,0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, minHeight: 52 },
  iconWrap: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  focused: { backgroundColor: 'rgba(217,204,255,0.12)' },
  center: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textFaint },
  labelOn: { color: colors.text },
});
