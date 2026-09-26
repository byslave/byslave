import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen } from '../components/ui';
import { pairWatch, watchOptions } from '../health/providers';
import { useAppState } from '../state/AppState';
import { colors, space } from '../theme/tokens';

export default function WatchScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppState();
  const [selected, setSelected] = useState(watchOptions.find((item) => item.label === profile?.watchLabel)?.id ?? 'apple-watch');
  const [message, setMessage] = useState<string | null>(profile?.watchNote ?? null);
  const [busy, setBusy] = useState(false);
  const watch = watchOptions.find((item) => item.id === selected) ?? watchOptions[0];

  const pair = async () => {
    if (!profile || !watch) return;
    setBusy(true);
    const result = await pairWatch(watch.id);
    await updateProfile({
      watchLabel: watch.label,
      watchStatus: result.connected ? 'granted' : 'unavailable',
      watchNote: result.reason,
    });
    setMessage(result.reason);
    setBusy(false);
  };

  const clear = async () => {
    await updateProfile({ watchLabel: null, watchStatus: 'skipped', watchNote: null });
    setMessage('Saat seçimi kalktı.');
  };

  return (
    <Screen
      back={{ onPress: () => router.back() }}
      footer={
        <View style={{ gap: space.sm }}>
          <Button label={busy ? 'Deneniyor' : 'Eşleştirmeyi dene'} onPress={() => void pair()} disabled={busy || !profile} />
          {profile?.watchLabel ? <Button label="Eşleşmeyi kaldır" kind="ghost" onPress={() => void clear()} /> : null}
        </View>
      }
    >
      <Text style={styles.title}>Saat eşleştir</Text>
      <Text style={styles.body}>
        Saat bağlanırsa nabız {watch?.via} üzerinden kendiliğinden gelir. Bağlanmazsa nabız alınmaz.
      </Text>
      {watchOptions.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable key={option.id} onPress={() => setSelected(option.id)}>
            <Card>
              <Text style={[styles.name, active && styles.active]}>{option.label}</Text>
              <Text style={styles.body}>{option.via}</Text>
              <Text style={styles.body}>{option.signals.join(' · ')}</Text>
            </Card>
          </Pressable>
        );
      })}
      {message ? <Text style={styles.body}>{message}</Text> : null}
      {profile?.watchLabel ? <Text style={styles.body}>Seçili saat: {profile.watchLabel}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  name: { color: colors.white, fontSize: 18, fontWeight: '700' },
  active: { color: colors.red },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
