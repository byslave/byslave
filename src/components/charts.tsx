import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import type { GeoPoint } from '../domain/types';
import { mapboxStaticUrl } from '../maps/mapbox';
import { colors } from '../theme/tokens';

export function ScoreRing({ score }: { score: number }) {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (Math.max(0, Math.min(100, score)) / 100);
  return (
    <View style={styles.ringWrap}>
      <Svg width={120} height={120}>
        <Circle cx={60} cy={60} r={radius} stroke={colors.border} strokeWidth={8} fill="none" />
        <Circle
          cx={60}
          cy={60}
          r={radius}
          stroke={colors.red}
          strokeWidth={8}
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation={-90}
          origin="60, 60"
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.caption}>Party Score</Text>
      </View>
    </View>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <Text style={styles.muted}>Yoğunluk grafiği için veri yok.</Text>;
  const w = 320;
  const h = 72;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * w;
      const y = h - 8 - Math.max(0, Math.min(1, value)) * (h - 16);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline points={points} fill="none" stroke={colors.red} strokeWidth={2.5} />
    </Svg>
  );
}

export function RouteMap({ route }: { route: GeoPoint[] }) {
  const remote = mapboxStaticUrl(route);
  if (remote) {
    return <Image source={{ uri: remote }} style={styles.map} accessibilityLabel="Mapbox rota" />;
  }
  if (route.length < 2) return <Text style={styles.muted}>Rota için yeterli hareket yok.</Text>;
  const lats = route.map((point) => point.lat);
  const lngs = route.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const w = 320;
  const h = 180;
  const pad = 16;
  const sx = (lng: number) => pad + ((lng - minLng) / Math.max(maxLng - minLng, 1e-8)) * (w - pad * 2);
  const sy = (lat: number) => pad + ((maxLat - lat) / Math.max(maxLat - minLat, 1e-8)) * (h - pad * 2);
  const d = route
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${sx(point.lng).toFixed(1)} ${sy(point.lat).toFixed(1)}`)
    .join(' ');
  return (
    <View style={styles.canvas}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Path d={d} stroke={colors.red} strokeWidth={2.5} fill="none" />
      </Svg>
      <Text style={styles.muted}>Rota çizgisi. Harita anahtarı yok.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  score: { color: colors.white, fontSize: 32, fontWeight: '700', textShadowColor: 'rgba(229,9,20,0.45)', textShadowRadius: 16 },
  caption: { color: colors.textSecondary, fontSize: 10 },
  muted: { color: colors.textSecondary, fontSize: 13 },
  map: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.bg },
  canvas: { gap: 6 },
});
