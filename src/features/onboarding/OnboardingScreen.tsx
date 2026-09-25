import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { brand } from '../../config/brand';
import { Avatar, Button, Field, Screen } from '../../components/ui';
import { isUsernameTaken } from '../../data/seed';
import { connectWatch, platformHealthProvider, watchOptions } from '../../health/providers';
import { useAppState, type OnboardingDraft } from '../../state/AppState';
import type { FitnessLevel, PermissionChoice, Sex } from '../../domain/types';
import { colors, space } from '../../theme/tokens';

const steps = [
  'welcome',
  'about',
  'health',
  'watch',
  'motion',
  'location',
  'notifications',
  'name',
  'username',
  'photo',
  'age',
  'height',
  'weight',
  'sex',
  'fitness',
] as const;

const colorsPreset = ['#3A1214', '#1A1A1A', '#2A1214', '#241416'];

async function motionChoice(): Promise<PermissionChoice> {
  try {
    const { Accelerometer } = await import('expo-sensors');
    const available = await Accelerometer.isAvailableAsync();
    if (!available) return 'unavailable';
    if (typeof Accelerometer.requestPermissionsAsync === 'function') {
      const result = await Accelerometer.requestPermissionsAsync();
      return result.status === 'granted' ? 'granted' : 'denied';
    }
    return 'granted';
  } catch {
    return 'unavailable';
  }
}

async function locationChoice(): Promise<PermissionChoice> {
  try {
    const Location = await import('expo-location');
    const result = await Location.requestForegroundPermissionsAsync();
    return result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

async function notificationChoice(): Promise<PermissionChoice> {
  try {
    const Notifications = await import('expo-notifications');
    const result = await Notifications.requestPermissionsAsync();
    return result.granted || result.status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export function OnboardingScreen() {
  const router = useRouter();
  const { users, mode, completeOnboarding } = useAppState();
  const [index, setIndex] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({
    displayName: '',
    username: '',
    avatarColor: colorsPreset[0],
    age: null,
    heightCm: null,
    weightKg: null,
    sex: null,
    fitnessLevel: 'medium',
    healthStatus: 'skipped',
    watchStatus: 'skipped',
    watchLabel: null,
    healthNote: null,
    watchNote: null,
    motionStatus: 'skipped',
    locationStatus: 'skipped',
    notificationStatus: 'skipped',
    email: '',
    password: '',
  });

  const step = steps[index];
  const progress = (index + 1) / steps.length;

  const go = (next: number) => {
    setError(null);
    setInfo(null);
    setIndex(next);
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(draft);
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profil kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const validateAndNext = () => {
    if (step === 'name' && draft.displayName.trim().length < 2) {
      setError('İsim en az 2 karakter.');
      return;
    }
    if (step === 'name' && mode === 'supabase') {
      if (!draft.email?.includes('@') || (draft.password?.length ?? 0) < 6) {
        setError('Supabase için e-posta ve en az 6 karakter şifre gerekli.');
        return;
      }
    }
    if (step === 'username') {
      const username = draft.username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,16}$/.test(username)) {
        setError('Kullanıcı adı 3-16 karakter, küçük harf, rakam veya alt çizgi.');
        return;
      }
      if (isUsernameTaken(username, users)) {
        setError('Bu kullanıcı adı dolu.');
        return;
      }
      setDraft({ ...draft, username });
    }
    if (step === 'age' && draft.age != null && (draft.age < 13 || draft.age > 90)) {
      setError('Yaş 13 ile 90 arasında olmalı.');
      return;
    }
    if (step === 'height' && draft.heightCm != null && (draft.heightCm < 120 || draft.heightCm > 230)) {
      setError('Boy 120 ile 230 cm arasında olmalı.');
      return;
    }
    if (step === 'weight' && draft.weightKg != null && (draft.weightKg < 35 || draft.weightKg > 250)) {
      setError('Kilo 35 ile 250 kg arasında olmalı.');
      return;
    }
    if (index === steps.length - 1) {
      void finish();
      return;
    }
    go(index + 1);
  };

  const skipValue = (patch: Partial<OnboardingDraft>) => {
    setDraft({ ...draft, ...patch });
    go(index + 1);
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}
          <Button label={index === steps.length - 1 ? 'Profili bitir' : 'Devam'} onPress={validateAndNext} disabled={busy} />
          {index > 0 ? <Button label="Geri" kind="ghost" onPress={() => go(index - 1)} /> : null}
        </View>
      }
    >
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${progress * 100}%` }]} />
      </View>
      {step === 'welcome' ? (
        <View style={styles.block}>
          <Text style={styles.kicker}>{brand.tagline}</Text>
          <Text style={styles.hero}>{brand.name}</Text>
          <Text style={styles.body}>Parti, rave, konser ve kulüp gecelerini kaydet.</Text>
        </View>
      ) : null}
      {step === 'about' ? (
        <View style={styles.block}>
          <Text style={styles.title}>{brand.name} nedir?</Text>
          <Text style={styles.body}>Kalori, zıplama, mesafe ve yoğunluk tek gecede toplanır.</Text>
          <Text style={styles.body}>Party Score bu geceyi 0-100 arası özetler.</Text>
          <Text style={styles.body}>Arkadaşlarınla ve etkinlik tablosuyla kıyaslarsın.</Text>
        </View>
      ) : null}
      {step === 'health' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Sağlık verisi</Text>
          <Text style={styles.body}>Nabız, kalori ve yoğunluk tahminini iyileştirir. Bu tarayıcıda çoğu zaman yoktur.</Text>
          <Button
            label="Bağlamayı dene"
            kind="ghost"
            onPress={() => {
              void platformHealthProvider().connect().then((result) => {
                setDraft({
                  ...draft,
                  healthStatus: result.connected ? 'granted' : 'unavailable',
                  healthNote: result.reason,
                });
                setInfo(result.reason);
              });
            }}
          />
          <Button label="Şimdi değil" kind="ghost" onPress={() => skipValue({ healthStatus: 'skipped' })} />
        </View>
      ) : null}
      {step === 'watch' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Saat</Text>
          <Text style={styles.body}>Saatler aynı veriyi açmaz. Nabız, sağlık platformu üzerinden gelirse kullanılır.</Text>
          {watchOptions.map((watch) => (
            <Button
              key={watch.id}
              label={watch.label}
              kind="ghost"
              onPress={() => {
                void connectWatch(watch.label).then((result) => {
                  setDraft({ ...draft, watchStatus: 'unavailable', watchLabel: watch.label, watchNote: result.reason });
                  setInfo(result.reason);
                });
              }}
            />
          ))}
          <Button label="Şimdi değil" kind="ghost" onPress={() => skipValue({ watchStatus: 'skipped' })} />
        </View>
      ) : null}
      {step === 'motion' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Hareket</Text>
          <Text style={styles.body}>Hareket verisi zıplama ve tempoyu tahmin eder.</Text>
          <Button
            label="İzin ver"
            onPress={() => {
              void motionChoice().then((status) => {
                setDraft({ ...draft, motionStatus: status });
                setInfo(status === 'granted' ? 'Hareket izni alındı.' : 'Hareket bu cihazda kullanılamıyor. Kayıt demo harekete düşer.');
              });
            }}
          />
          <Button label="Şimdi değil" kind="ghost" onPress={() => skipValue({ motionStatus: 'skipped' })} />
        </View>
      ) : null}
      {step === 'location' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Konum</Text>
          <Text style={styles.body}>Konum, gece boyunca ne kadar yer değiştirdiğini tahmin eder.</Text>
          <Button
            label="İzin ver"
            onPress={() => {
              void locationChoice().then((status) => {
                setDraft({ ...draft, locationStatus: status });
                setInfo(status === 'granted' ? 'Konum izni alındı.' : 'Konum izni yok. Mesafe sınırlı kalır.');
              });
            }}
          />
          <Button label="Şimdi değil" kind="ghost" onPress={() => skipValue({ locationStatus: 'skipped' })} />
        </View>
      ) : null}
      {step === 'notifications' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Bildirimler</Text>
          <Text style={styles.body}>İsteğe bağlı. Liderlik ve arkadaş paylaşımları için. Uygulama bildirim olmadan da çalışır.</Text>
          <Button
            label="Aç"
            onPress={() => {
              void notificationChoice().then((status) => {
                setDraft({ ...draft, notificationStatus: status });
                setInfo(status === 'granted' ? 'Bildirim açık.' : 'Bildirim bu ortamda açılmadı.');
              });
            }}
          />
          <Button label="Şimdi değil" kind="ghost" onPress={() => skipValue({ notificationStatus: 'skipped' })} />
        </View>
      ) : null}
      {step === 'name' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Profil</Text>
          <Field value={draft.displayName} onChangeText={(displayName) => setDraft({ ...draft, displayName })} placeholder="Adın" />
          {mode === 'supabase' ? (
            <>
              <Field
                value={draft.email}
                onChangeText={(email) => setDraft({ ...draft, email })}
                placeholder="E-posta"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                value={draft.password}
                onChangeText={(password) => setDraft({ ...draft, password })}
                placeholder="Şifre"
                secureTextEntry
              />
            </>
          ) : null}
        </View>
      ) : null}
      {step === 'username' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Kullanıcı adı</Text>
          <Field
            value={draft.username}
            autoCapitalize="none"
            onChangeText={(username) => setDraft({ ...draft, username: username.toLowerCase() })}
            placeholder="ornek_ad"
          />
        </View>
      ) : null}
      {step === 'photo' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Fotoğraf</Text>
          <Text style={styles.body}>İsteğe bağlı. Yoksa renk ve baş harf kullanılır.</Text>
          <View style={styles.row}>
            {colorsPreset.map((color) => (
              <Pressable key={color} onPress={() => setDraft({ ...draft, avatarColor: color, avatarUri: undefined })}>
                <Avatar label={draft.displayName || 'R'} color={color} size={56} />
              </Pressable>
            ))}
          </View>
          <Button
            label="Fotoğraf seç"
            kind="ghost"
            onPress={() => {
              void ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.3, base64: true }).then((result) => {
                if (result.canceled || !result.assets[0]) return;
                const asset = result.assets[0];
                const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
                if (uri.length > 500_000) {
                  setInfo('Fotoğraf çok büyük, renk kullanıldı.');
                  setDraft({ ...draft, avatarUri: undefined });
                  return;
                }
                setDraft({ ...draft, avatarUri: uri });
              });
            }}
          />
          {draft.avatarUri ? <Avatar label={draft.displayName || 'R'} color={draft.avatarColor} uri={draft.avatarUri} size={72} /> : null}
        </View>
      ) : null}
      {step === 'age' ? (
        <NumberStep
          title="Yaş"
          body="Kalori tahmininde kullanılır. Atlanırsa daha kaba bir hareket tahmini yapılır."
          value={draft.age}
          placeholder="28"
          onChange={(age) => setDraft({ ...draft, age })}
          onSkip={() => skipValue({ age: null })}
        />
      ) : null}
      {step === 'height' ? (
        <NumberStep
          title="Boy"
          body="Konum zayıfsa adım boyu mesafeye yardım eder. Santimetre."
          value={draft.heightCm}
          placeholder="175"
          onChange={(heightCm) => setDraft({ ...draft, heightCm })}
          onSkip={() => skipValue({ heightCm: null })}
        />
      ) : null}
      {step === 'weight' ? (
        <NumberStep
          title="Kilo"
          body="Kalori formülünün ana girdisi. Atlanırsa 70 kg varsayılır ve sonuç tahmini olarak işaretlenir."
          value={draft.weightKg}
          placeholder="70"
          onChange={(weightKg) => setDraft({ ...draft, weightKg })}
          onSkip={() => skipValue({ weightKg: null })}
        />
      ) : null}
      {step === 'sex' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Cinsiyet</Text>
          <Text style={styles.body}>Yalnız nabızlı kalori formülü için. Atlanırsa hareket formülü kullanılır.</Text>
          {([
            ['female', 'Kadın'],
            ['male', 'Erkek'],
            ['unspecified', 'Belirtmek istemiyorum'],
          ] as const).map(([value, label]) => (
            <Button key={value} label={label} kind={draft.sex === value ? 'primary' : 'ghost'} onPress={() => setDraft({ ...draft, sex: value satisfies Sex })} />
          ))}
          <Button label="Atla" kind="ghost" onPress={() => skipValue({ sex: null })} />
        </View>
      ) : null}
      {step === 'fitness' ? (
        <View style={styles.block}>
          <Text style={styles.title}>Tempo</Text>
          <Text style={styles.body}>Hareket kalorisine küçük bir çarpan uygular. Yoğunluk asıl kaynağı sensördür.</Text>
          {([
            ['low', 'Sakin'],
            ['medium', 'Orta'],
            ['high', 'Sert'],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              label={label}
              kind={draft.fitnessLevel === value ? 'primary' : 'ghost'}
              onPress={() => setDraft({ ...draft, fitnessLevel: value satisfies FitnessLevel })}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function NumberStep({
  title,
  body,
  value,
  placeholder,
  onChange,
  onSkip,
}: {
  title: string;
  body: string;
  value: number | null;
  placeholder: string;
  onChange: (value: number | null) => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Field
        value={value == null ? '' : String(value)}
        keyboardType="number-pad"
        placeholder={placeholder}
        onChangeText={(text) => onChange(text.trim() === '' ? null : Number(text.replace(',', '.')))}
      />
      <Button label="Atla" kind="ghost" onPress={onSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  bar: { height: 3, backgroundColor: colors.red },
  block: { gap: space.md },
  kicker: { color: colors.textSecondary, fontSize: 14 },
  hero: { color: colors.white, fontSize: 64, fontWeight: '700', letterSpacing: -2 },
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  error: { color: colors.redBright, fontSize: 14 },
  info: { color: colors.textSecondary, fontSize: 14 },
  row: { flexDirection: 'row', gap: space.md },
});
