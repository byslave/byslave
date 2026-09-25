import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand } from '../../config/brand';
import { RouteMap, ScoreRing, Sparkline } from '../../components/charts';
import { Button, Card, Screen, Stat } from '../../components/ui';
import { formatCalories, formatDistance, formatDuration, formatWhen } from '../../domain/format';
import { compareLine, leaderboard, rankOf } from '../../domain/leaderboard';
import { nightKindLabel } from '../../domain/labels';
import { nightlifeStats } from '../../domain/stats';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activities, users, profile } = useAppState();
  const [copied, setCopied] = useState(false);
  const activity = activities.find((item) => item.id === id);
  if (!activity) {
    return (
      <Screen>
        <Text style={styles.title}>Kayıt yok</Text>
        <Button label="Geri" kind="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }
  const user = users.find((item) => item.id === activity.userId);
  const rows = activity.eventId ? leaderboard(activities, activity.eventId, users) : [];
  const rank = rankOf(rows, activity.userId);
  const versus = compareLine(rows, activity.userId);
  const ownStats = profile ? nightlifeStats(activities, profile.id) : null;
  const isRecord = Boolean(profile && activity.userId === profile.id && ownStats?.bestScore?.id === activity.id);
  const hrLabel =
    activity.heartRateOrigin === 'estimated' ? 'Nabız · tahmin' : activity.heartRateOrigin === 'measured' ? 'Nabız' : 'Nabız yok';
  const share = async () => {
    const text = `${brand.name} · ${activity.title} · Party Score ${activity.partyScore} · ${formatCalories(activity.calories)} kcal · ${activity.jumps} zıplama · ${formatDistance(activity.distanceMeters)}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
  };
  return (
    <Screen footer={<Button label={copied ? 'Kopyalandı' : 'Özeti kopyala'} onPress={() => void share()} />}>
      <Button label="Geri" kind="ghost" onPress={() => router.back()} />
      <Text style={styles.kicker}>{user?.displayName ?? 'Sen'}</Text>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.meta}>
        {activity.venue} · {formatWhen(activity.startedAt)}
      </Text>
      <View style={styles.center}>
        <ScoreRing score={activity.partyScore} />
      </View>
      <Text style={styles.meta}>{nightKindLabel(activity.nightKind)}</Text>
      {isRecord ? <Text style={styles.record}>Kişisel rekor</Text> : null}
      {rank ? <Text style={styles.meta}>Bu etkinlikte {rank.rank}. sıra / {rank.total}</Text> : null}
      {versus ? <Text style={styles.meta}>{versus}</Text> : null}
      <Card>
        <View style={styles.stats}>
          <Stat label="Süre" value={formatDuration(activity.activeSeconds)} />
          <Stat
            label="Kalori · tahmin"
            value={formatCalories(activity.calories)}
            hint={activity.assumedWeight ? '70 kg varsayıldı' : activity.calorieMethod === 'heart-rate' ? 'Nabız formülü' : 'Hareket formülü'}
          />
        </View>
        <View style={styles.stats}>
          <Stat label="Zıplama" value={String(activity.jumps)} />
          <Stat label="Mesafe" value={formatDistance(activity.distanceMeters)} />
        </View>
        <View style={styles.stats}>
          <Stat label={hrLabel} value={activity.avgHeartRate ? Math.round(activity.avgHeartRate).toString() : '—'} hint={activity.peakHeartRate ? `Zirve ${Math.round(activity.peakHeartRate)}` : undefined} />
          <Stat label="Zirve yoğunluk" value={`${Math.round(activity.peakIntensity * 100)}`} hint={`${Math.round(activity.peakOffsetSeconds / 60)}. dk`} />
        </View>
        <Text style={styles.meta}>{activity.musicBpm ? `Etkinlik BPM ${activity.musicBpm}` : 'Bu kayıtta müzik BPM’i yok'}</Text>
        <Text style={styles.meta}>{activity.shared ? 'Paylaşılıyor' : 'Gizli'}</Text>
      </Card>
      <Text style={styles.section}>Yoğunluk</Text>
      <Card>
        <Sparkline values={activity.intensitySeries} />
      </Card>
      <Text style={styles.section}>Rota</Text>
      <Card>
        <RouteMap route={activity.route} />
      </Card>
      {profile?.id === activity.userId ? null : <Text style={styles.meta}>Başka birinin paylaştığı gece.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  record: { color: colors.red, fontSize: 14, fontWeight: '700' },
  kicker: { color: colors.textSecondary, fontSize: 14 },
  title: { color: colors.white, fontSize: 36, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
  section: { color: colors.white, fontSize: 16, fontWeight: '700' },
  center: { alignItems: 'center' },
  stats: { flexDirection: 'row', gap: space.md },
});
