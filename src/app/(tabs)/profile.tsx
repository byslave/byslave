import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, Field, Screen, SectionTitle } from '../../components/ui';
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
  const { profile, mode, modeNote, updateProfile, resetLocal } = useAppState();
  const [editing, setEditing] = useState(false);
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [height, setHeight] = useState(profile?.heightCm?.toString() ?? '');
  const [weight, setWeight] = useState(profile?.weightKg?.toString() ?? '');
  if (!profile) return null;

  return (
    <Screen footer={<Button label={mode === 'supabase' ? 'Çıkış yap' : 'Demoyu sıfırla'} kind="ghost" onPress={() => void resetLocal()} />}>
      <View style={styles.header}>
        <Avatar label={profile.displayName} color={profile.avatarColor} uri={profile.avatarUri} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.meta}>@{profile.username}</Text>
        </View>
      </View>
      <Card>
        <Text style={styles.meta}>{modeNote}</Text>
      </Card>
      <SectionTitle>Beden</SectionTitle>
      <Card>
        <Text style={styles.meta}>Yaş {profile.age ?? '—'} · Boy {profile.heightCm ?? '—'} cm · Kilo {profile.weightKg ?? '—'} kg</Text>
        <Text style={styles.meta}>Cinsiyet {profile.sex ?? 'yok'} · Tempo {profile.fitnessLevel}</Text>
        {editing ? (
          <View style={{ gap: space.sm }}>
            <Field value={age} onChangeText={setAge} placeholder="Yaş" keyboardType="number-pad" />
            <Field value={height} onChangeText={setHeight} placeholder="Boy cm" keyboardType="number-pad" />
            <Field value={weight} onChangeText={setWeight} placeholder="Kilo kg" keyboardType="number-pad" />
            {(['low', 'medium', 'high'] as FitnessLevel[]).map((level) => (
              <Button key={level} label={level} kind={profile.fitnessLevel === level ? 'primary' : 'ghost'} onPress={() => void updateProfile({ fitnessLevel: level })} />
            ))}
            {(['female', 'male', 'unspecified'] as Sex[]).map((sex) => (
              <Button key={sex} label={sex} kind={profile.sex === sex ? 'primary' : 'ghost'} onPress={() => void updateProfile({ sex })} />
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
});
