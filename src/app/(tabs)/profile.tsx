import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Field, Screen, SectionTitle } from '../../components/ui';
import { formatDuration } from '../../domain/format';
import { danceEffortLabel, sexLabel } from '../../domain/labels';
import { crossedWith } from '../../domain/paths';
import { nightlifeStats, weekRhythm } from '../../domain/stats';
import { yearWrapped } from '../../domain/wrapped';
import { usernameIssue } from '../../domain/username';
import { useAppState } from '../../state/AppState';
import type { FitnessLevel, Sex } from '../../domain/types';
import { colors, space } from '../../theme/tokens';

const statusText = {
  granted: 'İzin verildi',
  denied: 'Reddedildi',
  skipped: 'Atlandı',
  unavailable: 'Bu cihazda yok',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, activities, users, followingIds, mode, modeNote, updateProfile, resetLocal, toggleFollow } = useAppState();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [height, setHeight] = useState(profile?.heightCm?.toString() ?? '');
  const [weight, setWeight] = useState(profile?.weightKg?.toString() ?? '');
  useEffect(() => {
    setUsername(profile?.username ?? '');
  }, [profile?.username]);
  if (!profile) return null;
  const stats = nightlifeStats(activities, profile.id);
  const weeks = weekRhythm(activities, profile.id);
  const crosses = crossedWith(activities, profile.id);
  const wrapped = yearWrapped(activities, profile.id);
  const others = users.filter((user) => user.id !== profile.id);
  const efforts: FitnessLevel[] = ['low', 'medium', 'high'];
  const sexes: Sex[] = ['female', 'male', 'unspecified'];

  return (
    <Screen footer={
        <Button
          label={mode === 'supabase' ? 'Çıkış yap' : 'Demoyu sıfırla'}
          kind="ghost"
          onPress={() => {
            void resetLocal().then(() => router.replace('/onboarding'));
          }}
        />
      }>
      <View style={styles.header}>
        <Avatar label={profile.displayName} color={profile.avatarColor} uri={profile.avatarUri} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.meta}>@{profile.username}</Text>
        </View>
      </View>
      <Card>
        <Field
          value={username}
          maxLength={16}
          autoCapitalize="none"
          placeholder="Kullanıcı adı"
          onChangeText={(value) => {
            setUsername(value.slice(0, 16));
            setNameError(null);
          }}
        />
        <Text style={styles.meta}>3 ile 16 karakter.</Text>
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
        <Button
          label="Kullanıcı adını kaydet"
          kind="ghost"
          onPress={() => {
            const next = username.trim();
            const issue = usernameIssue(next, users, profile.id);
            if (issue) {
              setNameError(issue);
              return;
            }
            void updateProfile({
              username: next,
              displayName: profile.displayName === profile.username ? next : profile.displayName,
            });
          }}
        />
      </Card>
      <Card>
        <Text style={styles.meta}>{modeNote}</Text>
      </Card>
      <SectionTitle>Son 8 hafta</SectionTitle>
      <Card>
        <View style={styles.weeks}>
          {weeks.map((week) => (
            <View key={week.label} style={styles.week}>
              <View style={[styles.bar, { height: 8 + week.nights * 18 }]} />
              <Text style={styles.weekLabel}>{week.nights}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.meta}>{weeks[0]?.label} – {weeks[weeks.length - 1]?.label}</Text>
      </Card>
      <SectionTitle>Rekorlar</SectionTitle>
      <Card>
        <Text style={styles.meta}>En uzun gece {stats.longest ? formatDuration(stats.longest.activeSeconds) : '—'}</Text>
        <Text style={styles.meta}>En yüksek skor {stats.bestScore?.partyScore ?? '—'}{stats.bestScore ? ` · ${stats.bestScore.title}` : ''}</Text>
        <Text style={styles.meta}>En yüksek nabız {stats.bestHeart?.peakHeartRate ?? '—'}</Text>
        <Text style={styles.meta}>En çok zıplama {stats.bestJumps?.jumps ?? '—'}</Text>
        <Text style={styles.meta}>En yüksek BPM {stats.bestBpm?.musicBpm ?? '—'}</Text>
      </Card>
      <SectionTitle>Kesişen yollar</SectionTitle>
      {crosses.length === 0 ? (
        <Card>
          <Text style={styles.meta}>Aynı etkinlikte kayıt açınca burada birikir.</Text>
        </Card>
      ) : (
        crosses.map((item) => {
          const user = users.find((person) => person.id === item.userId);
          return (
            <Card key={item.userId}>
              <Text style={styles.meta}>{user?.displayName ?? 'Biri'} ile {item.times} kez aynı gecedeydiniz · {item.venue}</Text>
            </Card>
          );
        })
      )}
      <SectionTitle>{`${wrapped.year} özeti`}</SectionTitle>
      <Card>
        <Text style={styles.name}>{wrapped.nights} gece</Text>
        <Text style={styles.meta}>{wrapped.hours.toFixed(1)} saat · {wrapped.jumps} zıplama</Text>
        <Text style={styles.meta}>En çok {wrapped.topVenue ?? '—'}</Text>
        <Text style={styles.meta}>En yüksek skor {wrapped.best?.partyScore ?? '—'}{wrapped.best ? ` · ${wrapped.best.title}` : ''}</Text>
        <View style={styles.wrapped}>
          {wrapped.months.map((month) => (
            <View key={month.label} style={styles.week}>
              <View style={[styles.bar, { height: 8 + month.nights * 14 }]} />
              <Text style={styles.weekLabel}>{month.label}</Text>
            </View>
          ))}
        </View>
      </Card>
      <SectionTitle>{`Takip · ${followingIds.length}`}</SectionTitle>
      {others.map((user) => {
        const following = followingIds.includes(user.id);
        return (
          <Card key={user.id}>
            <View style={styles.header}>
              <Avatar label={user.displayName} color={user.avatarColor} uri={user.avatarUri} />
              <Text style={styles.meta}>{user.displayName}</Text>
              <Button label={following ? 'Bırak' : 'Takip et'} kind={following ? 'ghost' : 'primary'} onPress={() => void toggleFollow(user.id)} />
            </View>
          </Card>
        );
      })}
      <SectionTitle>Toplam</SectionTitle>
      <Card>
        <Text style={styles.meta}>{stats.nights} gece · bu ay {stats.monthNights}</Text>
      </Card>
      <SectionTitle>Beden</SectionTitle>
      <Card>
        <Text style={styles.meta}>Yaş {profile.age ?? '—'} · Boy {profile.heightCm ?? '—'} cm · Kilo {profile.weightKg ?? '—'} kg</Text>
        <Text style={styles.meta}>Cinsiyet {profile.sex ? sexLabel[profile.sex] : 'yok'} · Dans {danceEffortLabel[profile.fitnessLevel]}</Text>
        <Text style={styles.meta}>Dans şiddeti müzik BPM’i değildir. BPM etkinlikte görünür.</Text>
        {editing ? (
          <View style={{ gap: space.sm }}>
            <Field value={age} onChangeText={setAge} placeholder="Yaş" keyboardType="number-pad" />
            <Field value={height} onChangeText={setHeight} placeholder="Boy cm" keyboardType="number-pad" />
            <Field value={weight} onChangeText={setWeight} placeholder="Kilo kg" keyboardType="number-pad" />
            {efforts.map((level) => (
              <Button key={level} label={danceEffortLabel[level]} kind={profile.fitnessLevel === level ? 'primary' : 'ghost'} onPress={() => void updateProfile({ fitnessLevel: level })} />
            ))}
            {sexes.map((sex) => (
              <Button key={sex} label={sexLabel[sex]} kind={profile.sex === sex ? 'primary' : 'ghost'} onPress={() => void updateProfile({ sex })} />
            ))}
            <Button
              label="Ölçüleri kaydet"
              onPress={() => {
                void updateProfile({
                  age: age.trim() ? Number(age) : null,
                  heightCm: height.trim() ? Number(height) : null,
                  weightKg: weight.trim() ? Number(weight) : null,
                });
                setEditing(false);
              }}
            />
          </View>
        ) : (
          <Button label="Verileri düzenle" kind="ghost" onPress={() => setEditing(true)} />
        )}
      </Card>
      <SectionTitle>Bağlantılar</SectionTitle>
      <Card>
        <Text style={styles.meta}>Sağlık: {statusText[profile.healthStatus]}</Text>
        {profile.healthNote ? <Text style={styles.meta}>{profile.healthNote}</Text> : null}
        <Text style={styles.meta}>
          Saat: {profile.watchLabel ?? 'seçilmedi'} · {statusText[profile.watchStatus]}
        </Text>
        {profile.watchNote ? <Text style={styles.meta}>{profile.watchNote}</Text> : null}
        <Button label="Saati eşleştir" kind="ghost" onPress={() => router.push('/watch')} />
        <Text style={styles.meta}>Hareket: {statusText[profile.motionStatus]}</Text>
        <Text style={styles.meta}>Konum: {statusText[profile.locationStatus]}</Text>
        <Text style={styles.meta}>Bildirim: {statusText[profile.notificationStatus]}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  name: { color: colors.white, fontSize: 28, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  weeks: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 88 },
  wrapped: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110 },
  week: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: 10, backgroundColor: colors.red, borderRadius: 4 },
  weekLabel: { color: colors.textSecondary, fontSize: 11 },
  error: { color: colors.redBright, fontSize: 14 },
});
