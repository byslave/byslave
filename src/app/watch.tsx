import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen } from '../components/ui';
import { bleHeartState, bluetoothAvailable, subscribeBleHeart, type BleHeartState } from '../health/bleHeartRate';
import { pairWatch, unpairWatch } from '../health/providers';
import { useAppState } from '../state/AppState';
import { colors, space } from '../theme/tokens';

const steps = [
  'Saati veya kemeri eşleştirme / yayın moduna al.',
  'Bluetooth ile bağlan’a bas. Tarayıcı yakındaki cihazları listeler.',
  'Kendi saatini seç. Nabız servisi yoksa bağlanır ama nabız yazılmaz.',
];

export default function WatchScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppState();
  const [ble, setBle] = useState<BleHeartState>(bleHeartState());
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeBleHeart(setBle), []);

  const pair = async () => {
    if (!profile) return;
    setBusy(true);
    const result = await pairWatch();
    await updateProfile({
      watchLabel: result.connected ? (result.deviceName ?? 'Bluetooth saat') : profile.watchLabel,
      watchStatus: result.connected ? 'granted' : 'unavailable',
      watchNote: result.reason,
    });
    setBusy(false);
  };

  const clear = async () => {
    await unpairWatch();
    await updateProfile({ watchLabel: null, watchStatus: 'skipped', watchNote: null });
  };

  return (
    <Screen
      back={{ onPress: () => router.back() }}
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            label={busy ? 'Taranıyor' : ble.connected ? 'Başka saat tara' : 'Bluetooth ile bağlan'}
            onPress={() => void pair()}
            disabled={busy || !profile}
          />
          {ble.connected || profile?.watchLabel ? <Button label="Bağlantıyı kes" kind="ghost" onPress={() => void clear()} /> : null}
        </View>
      }
    >
      <Text style={styles.title}>Saat eşleştir</Text>
      <Text style={styles.body}>
        Telefon, yakındaki Bluetooth cihazlarını tarar ve nabız servisi varsa kayda bağlar. Polar, Garmin, Wear OS ve göğüs bandı çalışır. Apple Watch bu tarayıcıda nabız vermez.
      </Text>
      <Card>
        {steps.map((step, index) => (
          <Text key={step} style={styles.body}>
            {index + 1}. {step}
          </Text>
        ))}
      </Card>
      {!bluetoothAvailable() ? (
        <Card>
          <Text style={styles.body}>Bu ortamda Web Bluetooth yok. Android’de Chrome ve HTTPS ile aç. Saat bağlanamaz, nabız alınmaz.</Text>
        </Card>
      ) : null}
      <Card>
        <Text style={styles.name}>{ble.connected ? ble.deviceName ?? 'Bluetooth saat' : 'Saat yok'}</Text>
        <Text style={[styles.bpm, !(ble.connected && ble.bpm != null) && styles.bpmEmpty]}>
          {ble.connected && ble.bpm != null ? String(ble.bpm) : '—'}
        </Text>
        <Text style={styles.body}>{ble.connected ? 'Nabız Bluetooth’tan' : 'Bağlı değil'}</Text>
      </Card>
      {ble.note ? <Text style={styles.body}>{ble.note}</Text> : null}
      {profile?.watchLabel && !ble.connected ? (
        <Text style={styles.body}>Son seçilen: {profile.watchLabel}. Yeniden bağlanana kadar nabız alınmaz.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  name: { color: colors.white, fontSize: 18, fontWeight: '700' },
  bpm: { color: colors.red, fontSize: 56, fontWeight: '700', letterSpacing: -1 },
  bpmEmpty: { color: colors.textSecondary, fontSize: 32 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
