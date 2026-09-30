import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, SectionTitle } from '../../components/ui';
import { badgeBoard } from '../../domain/badges';
import { formatCalories, formatDuration, formatWhen } from '../../domain/format';
import { nightKindLabel } from '../../domain/labels';
import { isSameMonth } from '../../domain/stats';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

export default function ActivityScreen() {
  const router = useRouter();
  const { profile, activities } = useAppState();
  const [monthOnly, setMonthOnly] = useState(false);
  const mine = activities
    .filter((item) => item.userId === profile?.id)
    .filter((item) => (monthOnly ? isSameMonth(item.startedAt) : true))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const badges = profile ? badgeBoard(activities, profile.id) : [];
  return (
    <Screen>
      <SectionTitle>Rozetler</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
        {badges.map((badge) => (
          <View key={badge.key} style={[styles.badge, badge.earnedAt ? styles.badgeOn : null]}>
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <Text style={styles.meta}>{badge.earnedAt ? 'Kazanıldı' : badge.description}</Text>
          </View>
        ))}
      </ScrollView>
      <SectionTitle>Geçmiş</SectionTitle>
      <View style={styles.filters}>
        <Pressable onPress={() => setMonthOnly(false)} style={[styles.chip, !monthOnly && styles.chipOn]}>
          <Text style={styles.chipText}>Tümü</Text>
        </Pressable>
        <Pressable onPress={() => setMonthOnly(true)} style={[styles.chip, monthOnly && styles.chipOn]}>
          <Text style={styles.chipText}>Bu ay</Text>
        </Pressable>
      </View>
      {mine.length === 0 ? (
        <Card>
          <Text style={styles.title}>Kayıt yok</Text>
          <Text style={styles.meta}>Bitirdiğin geceler burada durur.</Text>
        </Card>
      ) : (
        mine.map((activity) => (
          <Pressable key={activity.id} onPress={() => router.push(`/session/${activity.id}`)}>
            <Card>
              <Text style={styles.score}>{activity.partyScore}</Text>
              <Text style={styles.title}>{activity.title}</Text>
              <Text style={styles.meta}>
                {nightKindLabel(activity.nightKind)} · {formatWhen(activity.startedAt)} · {formatDuration(activity.activeSeconds)} · {formatCalories(activity.calories)} kcal · {activity.jumps} zıplama
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { color: colors.red, fontSize: 28, fontWeight: '700' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14 },
  filters: { flexDirection: 'row', gap: space.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { borderColor: colors.red, backgroundColor: '#2A0C0E' },
  chipText: { color: colors.white, fontSize: 13 },
  badges: { gap: space.sm, paddingVertical: 4 },
  badge: { width: 148, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: space.md, gap: 6, backgroundColor: colors.card },
  badgeOn: { borderColor: colors.red },
  badgeTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
