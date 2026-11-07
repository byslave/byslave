import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioLines, Map, Rows3, Trophy, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { haptic } from '@/src/lib/haptics';
import { useAppStore } from '@/src/stores/appStore';
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
  const seenRecordHint = useAppStore((store) => store.seenRecordHint);
  const markRecordHint = useAppStore((store) => store.markRecordHint);
  const labels: Record<string, string> = {
    index: t('tabs.map'),
    feed: t('tabs.feed'),
    night: t('tabs.record'),
    leaderboard: t('tabs.board'),
    profile: t('tabs.profile'),
  };

  return (
    <View pointerEvents="box-none" style={styles.shell}>
      <LinearGradient pointerEvents="none" colors={['rgba(7,6,12,0)', 'rgba(7,6,12,0.92)', colors.bg]} style={styles.fade} />
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {!seenRecordHint ? (
          <View style={styles.hint} accessibilityRole="text">
            <Text style={styles.hintText}>{t('tabs.recordHint')}</Text>
          </View>
        ) : null}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name as keyof typeof icons] ?? Map;
          const center = route.name === 'night';
          const onPress = () => {
            haptic('select');
            if (center) markRecordHint();
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
              <Text style={[styles.label, (focused || center) && styles.labelOn]} maxFontSizeMultiplier={1.2}>
                {labels[route.name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  wrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(14,12,20,0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  hint: {
    position: 'absolute',
    top: -36,
    alignSelf: 'center',
    left: 70,
    right: 70,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 2,
  },
  hintText: { color: colors.accentInk, fontFamily: fonts.bodySemibold, fontSize: 12, textAlign: 'center' },
  item: { flex: 1, alignItems: 'center', gap: 4, minHeight: 52, minWidth: 44 },
  iconWrap: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
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
