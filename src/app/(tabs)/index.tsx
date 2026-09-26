import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { brand } from '../../config/brand';
import { Avatar, Card, Screen, SectionTitle } from '../../components/ui';
import { ScoreRing } from '../../components/charts';
import { eventPhase, formatCalories, formatDuration, formatWhen } from '../../domain/format';
import { leaderboard, rankOf } from '../../domain/leaderboard';
import { nightKindLabel } from '../../domain/labels';
import { badgeBoard } from '../../domain/badges';
import { crossedWith } from '../../domain/paths';
import { nightlifeStats } from '../../domain/stats';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, activities, events, users, notifications, followingIds, seenBadgeKeys, toggleFollow, toggleRespect, acknowledgeBadges } = useAppState();
  const unread = notifications.filter((item) => !item.read).length;
  const mine = activities
    .filter((item) => item.userId === profile?.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const latest = mine[0];
  const live = events.find((event) => eventPhase(event.startsAt) === 'live') ?? events.find((event) => eventPhase(event.startsAt) === 'upcoming');
  const feed = activities
    .filter((item) => item.shared && item.userId !== profile?.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const followed = feed.filter((item) => followingIds.includes(item.userId));
  const discover = feed.filter((item) => !followingIds.includes(item.userId));
  const stats = profile ? nightlifeStats(activities, profile.id) : null;
  const liveRows = live ? leaderboard(activities, live.id, users) : [];
  const liveRank = profile ? rankOf(liveRows, profile.id) : null;
  const freshBadge = profile
    ? badgeBoard(activities, profile.id).find((badge) => badge.earnedAt && !seenBadgeKeys.includes(badge.key))
    : null;
  const suggestions = profile
    ? crossedWith(activities, profile.id).filter((item) => item.times >= 2 && !followingIds.includes(item.userId))
    : [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>{brand.name}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/notifications')}>
          <Text style={styles.bell}>Bildirim{unread ? ` ${unread}` : ''}</Text>
        </Pressable>
      </View>
      {freshBadge ? (
        <Card>
          <Text style={styles.title}>Rozet · {freshBadge.title}</Text>
          <Text style={styles.meta}>{freshBadge.description}</Text>
          <Pressable accessibilityRole="button" onPress={() => void acknowledgeBadges([freshBadge.key])}>
            <Text style={styles.follow}>Tamam</Text>
          </Pressable>
        </Card>
      ) : null}
      {stats ? (
        <>
          <SectionTitle>Özet</SectionTitle>
          <Card>
            <View style={styles.row}>
              <View style={styles.stat}><Text style={styles.statValue}>{stats.monthNights}</Text><Text style={styles.meta}>bu ay</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{stats.jumps}</Text><Text style={styles.meta}>zıplama</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{stats.bestScore?.partyScore ?? '—'}</Text><Text style={styles.meta}>rekor</Text></View>
            </View>
          </Card>
        </>
      ) : null}
      <SectionTitle>Son gecen</SectionTitle>
      {latest ? (
        <Pressable onPress={() => router.push(`/session/${latest.id}`)}>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{latest.title}</Text>
                <Text style={styles.meta}>
                  {formatDuration(latest.activeSeconds)} · {formatCalories(latest.calories)} kcal · {latest.jumps} zıplama
                </Text>
              </View>
              <ScoreRing score={latest.partyScore} />
            </View>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <Text style={styles.title}>Henüz bir gecen yok</Text>
          <Text style={styles.meta}>Kayıt sekmesinden bir gece başlat.</Text>
        </Card>
      )}
      {live ? (
        <>
          <SectionTitle>{eventPhase(live.startsAt) === 'live' ? 'Şu an' : 'Yaklaşan'}</SectionTitle>
          <Pressable onPress={() => router.push(`/event/${live.id}`)}>
            <Card>
              <Text style={styles.title}>{live.title}</Text>
              <Text style={styles.meta}>
                {live.venue} · {formatWhen(live.startsAt)}
                {live.musicBpm ? ` · ${live.musicBpm} BPM` : ''}
              </Text>
              {liveRank ? <Text style={styles.meta}>Senin sıran {liveRank.rank} / {liveRank.total}</Text> : null}
            </Card>
          </Pressable>
        </>
      ) : null}
      <SectionTitle>Takip</SectionTitle>
      {followed.length === 0 ? (
        <Card>
          <Text style={styles.meta}>Takip ettiğin geceler burada durur. Aşağıdan birini seç.</Text>
        </Card>
      ) : (
        followed.map((activity) => renderFeed(activity))
      )}
      {suggestions.length > 0 ? (
        <>
          <SectionTitle>Aynı gece</SectionTitle>
          {suggestions.map((item) => {
            const user = users.find((person) => person.id === item.userId);
            return (
              <Card key={item.userId}>
                <Text style={styles.title}>{user?.displayName ?? 'Biri'} ile {item.times} kez aynı gecedeydiniz</Text>
                <Text style={styles.meta}>{item.venue}</Text>
                <Pressable accessibilityRole="button" onPress={() => void toggleFollow(item.userId)}>
                  <Text style={styles.follow}>Takip et</Text>
                </Pressable>
              </Card>
            );
          })}
        </>
      ) : null}
      <SectionTitle>Keşfet</SectionTitle>
      {discover.map((activity) => renderFeed(activity))}
    </Screen>
  );

  function renderFeed(activity: (typeof feed)[number]) {
    const user = users.find((item) => item.id === activity.userId);
    const mineOnEvent = activity.eventId ? mine.find((item) => item.eventId === activity.eventId) : undefined;
    const gap = mineOnEvent ? activity.partyScore - mineOnEvent.partyScore : null;
    const gapText = gap == null ? nightKindLabel(activity.nightKind) : gap > 0 ? `${gap} puan senden önde` : gap < 0 ? `${Math.abs(gap)} puan geride` : 'Aynı skor';
    const followedUser = followingIds.includes(activity.userId);
    return (
      <Card key={activity.id}>
        <Pressable onPress={() => router.push(`/session/${activity.id}`)}>
          <View style={styles.row}>
            <Avatar label={user?.displayName ?? '?'} color={user?.avatarColor ?? colors.card} uri={user?.avatarUri} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{user?.displayName}</Text>
              <Text style={styles.meta}>
                {activity.title} · {activity.partyScore} · {gapText}
              </Text>
              {activity.note ? <Text style={styles.meta}>{activity.note}</Text> : null}
            </View>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void toggleRespect(activity.id)}>
          <Text style={styles.follow}>
            {profile && activity.respectIds.includes(profile.id) ? `Saygı var · ${activity.respectIds.length}` : `Saygı · ${activity.respectIds.length}`}
          </Text>
        </Pressable>
        {user && !followedUser ? (
          <Pressable accessibilityRole="button" onPress={() => void toggleFollow(user.id)}>
            <Text style={styles.follow}>Takip et</Text>
          </Pressable>
        ) : null}
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.white, fontSize: 28, fontWeight: '700', letterSpacing: 1 },
  bell: { color: colors.red, fontSize: 14 },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
  stat: { flex: 1, gap: 2 },
  statValue: { color: colors.white, fontSize: 28, fontWeight: '700' },
  follow: { color: colors.red, fontSize: 14, fontWeight: '700' },
});
