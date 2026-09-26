import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand } from '../../config/brand';
import { RouteMap, ScoreRing, Sparkline } from '../../components/charts';
import { Button, Card, Field, Screen, Stat } from '../../components/ui';
import { formatCalories, formatDistance, formatDuration, formatWhen } from '../../domain/format';
import { compareLine, leaderboard, rankOf } from '../../domain/leaderboard';
import { nightKindLabel } from '../../domain/labels';
import { partyScoreParts } from '../../domain/scoring';
import { nightlifeStats } from '../../domain/stats';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activities, users, profile, comments, toggleRespect, setNote, addComment } = useAppState();
  const [copied, setCopied] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [scoreOpen, setScoreOpen] = useState(false);
  const activity = activities.find((item) => item.id === id);
  if (!activity) {
    return (
      <Screen back={{ onPress: () => router.back() }}>
        <Text style={styles.title}>Kayıt yok</Text>
      </Screen>
    );
  }
  const user = users.find((item) => item.id === activity.userId);
  const rows = activity.eventId ? leaderboard(activities, activity.eventId, users) : [];
  const rank = rankOf(rows, activity.userId);
  const versus = compareLine(rows, activity.userId);
  const ownStats = profile ? nightlifeStats(activities, profile.id) : null;
  const isRecord = Boolean(profile && activity.userId === profile.id && ownStats?.bestScore?.id === activity.id);
  const showHeartRate = activity.heartRateOrigin !== 'none';
  const hrLabel = activity.heartRateOrigin === 'measured' ? 'Nabız' : 'Nabız · tahmin';
  const parts = partyScoreParts(activity);
  const nightComments = comments.filter((item) => item.activityId === activity.id);
  const respectNames = activity.respectIds
    .map((userId) => users.find((item) => item.id === userId)?.displayName)
    .filter((name): name is string => Boolean(name));
  const showRoute = activity.locationShared || profile?.id === activity.userId;
  const share = async () => {
    const text = `${brand.name} · ${activity.title} · Party Score ${activity.partyScore} · ${formatCalories(activity.calories)} kcal · ${activity.jumps} zıplama · ${formatDistance(activity.distanceMeters)}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
  };
  return (
    <Screen back={{ onPress: () => router.back() }} footer={<Button label={copied ? 'Kopyalandı' : 'Özeti kopyala'} onPress={() => void share()} />}>
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
      {activity.note ? <Text style={styles.note}>{activity.note}</Text> : null}
      {profile && activity.userId !== profile.id && activity.shared ? (
        <Button
          label={activity.respectIds.includes(profile.id) ? `Saygı var · ${activity.respectIds.length}` : `Saygı · ${activity.respectIds.length}`}
          kind={activity.respectIds.includes(profile.id) ? 'primary' : 'ghost'}
          onPress={() => void toggleRespect(activity.id)}
        />
      ) : (
        <Text style={styles.meta}>{activity.respectIds.length} saygı</Text>
      )}
      {respectNames.length > 0 ? <Text style={styles.meta}>{respectNames.join(', ')}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setScoreOpen((open) => !open)}>
        <Text style={styles.section}>Party Score nasıl hesaplanır?</Text>
      </Pressable>
      {scoreOpen ? (
        <Card>
          {parts.map((part) => (
            <Text key={part.label} style={styles.meta}>{part.label}: {part.points}</Text>
          ))}
          <Text style={styles.meta}>Nabız, saat bağlıysa kalori parçasına karışır. BPM skora eklenmez; etkinliğin müziğidir.</Text>
        </Card>
      ) : null}
      <Text style={styles.section}>Yorum</Text>
      {nightComments.length === 0 ? <Text style={styles.meta}>Henüz yorum yok.</Text> : null}
      {nightComments.map((item) => {
        const author = users.find((person) => person.id === item.userId);
        return (
          <Card key={item.id}>
            <Text style={styles.meta}>{author?.displayName ?? 'Biri'}</Text>
            <Text style={styles.note}>{item.text}</Text>
          </Card>
        );
      })}
      {profile && activity.userId !== profile.id ? (
        <View style={{ gap: space.sm }}>
          <Field value={comment} onChangeText={(value) => setComment(value.slice(0, 60))} placeholder="Kısa yorum, 60 karakter" />
          <Button
            label="Yorumu bırak"
            kind="ghost"
            onPress={() => {
              void addComment(activity.id, comment);
              setComment('');
            }}
          />
        </View>
      ) : null}
      {profile?.id === activity.userId ? (
        <View style={{ gap: space.sm }}>
          <Field
            value={draftNote ?? activity.note ?? ''}
            onChangeText={(value) => setDraftNote(value.slice(0, 80))}
            placeholder="Gece notu"
          />
          <Button label="Notu kaydet" kind="ghost" onPress={() => void setNote(activity.id, draftNote ?? activity.note ?? '')} />
        </View>
      ) : null}
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
          {showHeartRate ? (
            <Stat label={hrLabel} value={activity.avgHeartRate ? Math.round(activity.avgHeartRate).toString() : '—'} hint={activity.peakHeartRate ? `Zirve ${Math.round(activity.peakHeartRate)}` : undefined} />
          ) : (
            <Stat label="Nabız" value="—" hint="Saat yok" />
          )}
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
      {showRoute ? (
        <Card>
          <RouteMap route={activity.route} />
        </Card>
      ) : (
        <Text style={styles.meta}>Konum bu gecede paylaşılmamış.</Text>
      )}
      {profile?.id === activity.userId ? null : <Text style={styles.meta}>Başka birinin paylaştığı gece.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.white, fontSize: 18, lineHeight: 26 },
  record: { color: colors.red, fontSize: 14, fontWeight: '700' },
  kicker: { color: colors.textSecondary, fontSize: 14 },
  title: { color: colors.white, fontSize: 36, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
  section: { color: colors.white, fontSize: 16, fontWeight: '700' },
  center: { alignItems: 'center' },
  stats: { flexDirection: 'row', gap: space.md },
});
