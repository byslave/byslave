import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors } from '@/src/theme/tokens';

export function NightChart({ values }: { values: number[] }) {
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

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline points={points} fill="none" stroke={colors.chart} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={peakX} cy={peakY} r={5} fill={colors.chartPeak} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
});
