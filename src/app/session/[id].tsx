import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NightTrace, ScoreRing } from '../../components/charts';
import { Button, Card, Field, Screen, Stat } from '../../components/ui';
import { ShareSheet } from '../../features/share/ShareSheet';
import { formatCalories, formatDistance, formatDuration, formatWhen } from '../../domain/format';
import { compareLine, leaderboard, rankOf } from '../../domain/leaderboard';
import { nightKindLabel } from '../../domain/labels';
import { partyScoreParts } from '../../domain/scoring';
import { nightlifeStats } from '../../domain/stats';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, users, profile, comments, toggleRespect, setNote, addComment, setPhotos } = useAppState();
  const [shareOpen, setShareOpen] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [scoreOpen, setScoreOpen] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const activity = activities.find((item) => item.id === id);
  if (!activity) {
    return (
      <Screen back>
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
  const ownsNight = profile?.id === activity.userId;
  const addPhoto = async () => {
    if (activity.photoUris.length >= 4) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    if (uri.length > 560_000) {
      setPhotoNote('Fotoğraf 400 KB sınırını aşıyor.');
      return;
    }
    setPhotoNote(null);
    await setPhotos(activity.id, [...activity.photoUris, uri].slice(0, 4));
  };
  return (
    <Screen back footer={<Button label="Kaydet" onPress={() => setShareOpen(true)} />}>
      <Text style={styles.kicker}>{user?.displayName ?? 'Sen'}</Text>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.meta}>
        {activity.venue} · {formatWhen(activity.startedAt)}
      </Text>
      {isRecord ? <Text style={styles.record}>Kişisel rekor</Text> : null}
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
      <View style={styles.center}>
        <ScoreRing score={activity.partyScore} />
      </View>
      <Text style={styles.section}>İstatistikler</Text>
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
          <Stat label="Yoğunluk" value={`${Math.round(activity.peakIntensity * 100)}`} hint={`Hareketin sertliği · ${Math.round(activity.peakOffsetSeconds / 60)}. dk`} />
        </View>
        <Text style={styles.meta}>{activity.musicBpm ? `Etkinlik BPM ${activity.musicBpm}` : 'Bu kayıtta müzik BPM’i yok'}</Text>
        <Text style={styles.meta}>{activity.shared ? 'Paylaşılıyor' : 'Gizli'}</Text>
        {rank ? <Text style={styles.meta}>Bu etkinlikte {rank.rank}. sıra / {rank.total}</Text> : null}
        {versus ? <Text style={styles.meta}>{versus}</Text> : null}
      </Card>
      <Text style={styles.section}>Fotoğraflar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
        {activity.photoUris.map((uri, index) => (
          <View key={`${index}-${uri.slice(0, 24)}`} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} />
            {ownsNight ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fotoğrafı sil"
                onPress={() => void setPhotos(activity.id, activity.photoUris.filter((_, photoIndex) => photoIndex !== index))}
                style={styles.photoRemove}
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {ownsNight && activity.photoUris.length < 4 ? (
          <Pressable accessibilityRole="button" onPress={() => void addPhoto()} style={styles.photoAdd}>
            <Text style={styles.photoAddText}>Fotoğraf ekle</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      {photoNote ? <Text style={styles.meta}>{photoNote}</Text> : null}
      {!ownsNight && activity.photoUris.length === 0 ? <Text style={styles.meta}>Bu gecede fotoğraf yok.</Text> : null}
      <Text style={styles.meta}>{nightKindLabel(activity.nightKind)}</Text>
      {activity.note ? <Text style={styles.note}>{activity.note}</Text> : null}
      <Text style={styles.section}>Gece izi</Text>
      <Card>
        <NightTrace
          venue={activity.venue}
          route={activity.route}
          peakOffsetSeconds={activity.peakOffsetSeconds}
          locationShared={activity.locationShared}
        />
      </Card>
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
      {ownsNight ? null : <Text style={styles.meta}>Başka birinin paylaştığı gece.</Text>}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={activity.title}
        venue={activity.venue}
        score={activity.partyScore}
        duration={formatDuration(activity.activeSeconds)}
        jumps={String(activity.jumps)}
        distance={formatDistance(activity.distanceMeters)}
        calories={formatCalories(activity.calories)}
        photoUris={activity.photoUris}
      />
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
  photos: { gap: space.sm, paddingVertical: 4 },
  photoWrap: { width: 112, height: 112 },
  photo: { width: 112, height: 112, borderRadius: 14, backgroundColor: colors.card },
  photoAdd: {
    width: 112,
    height: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
  photoAddText: { color: colors.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: colors.white, fontSize: 16, lineHeight: 18 },
});
