import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radii } from '@/src/theme/tokens';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    let reduce = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduce = enabled;
      if (!reduce) opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
    });
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, animated, style]} accessibilityRole="progressbar" />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surface2, borderRadius: radii.md },
});
