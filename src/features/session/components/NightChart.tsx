import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { AppText } from '@/src/components/ui/AppText';
import { colors, radii } from '@/src/theme/tokens';

export function NightChart({ values, labels, tooltip }: { values: number[]; labels: string[]; tooltip: string }) {
  const width = 320;
  const height = 120;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - 12 - (value / max) * (height - 24);
      return `${x},${y}`;
    })
    .join(' ');
  const peak = values.indexOf(max);
  const peakX = peak * step;
  const peakY = height - 12 - ((values[peak] ?? 0) / max) * (height - 24);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={tooltip} onPress={() => setOpen((value) => !value)}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Polyline points={points} fill="none" stroke={colors.chart} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={peakX} cy={peakY} r={8} fill={colors.chartPeak} />
        </Svg>
      </Pressable>
      {open ? (
        <View style={[styles.tip, { left: `${Math.min(78, Math.max(8, (peakX / width) * 100))}%` }]} accessibilityRole="text">
          <AppText variant="bodyMedium">{tooltip}</AppText>
        </View>
      ) : null}
      <View style={styles.axis}>
        <AppText variant="muted">{labels[0]}</AppText>
        <AppText variant="muted">{labels[Math.floor(labels.length / 2)]}</AppText>
        <AppText variant="muted">{labels[labels.length - 1]}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 8 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  tip: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
