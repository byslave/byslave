import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { brand } from '../../config/brand';
import { Button, Screen } from '../../components/ui';
import { guestUsername } from '../../domain/username';
import { useAppState } from '../../state/AppState';
import { colors, space } from '../../theme/tokens';

const slides = [
  {
    key: 'night',
    title: 'Geceyi kaydet',
    body: `${brand.name}, rave, kulüp, konser ve after geceni telefonunla tutar. Geceyi başlat deyince ivme okunur: zıplama, tempo ve süre buradan gelir. Otururken veya telefon dururken sayı uydurulmaz. Konumu açarsan gece izi gerçek rotadır; aynı salonda kaldıysan rota çizilmez.`,
    image: require('../../../assets/intro/intro-night.png'),
  },
  {
    key: 'score',
    title: 'Party Score',
    body: 'Gece bitince 0-100 arası bir skor çıkar. Beş parçadan gelir: hareketin sertliği, zıplama, yanan kalori, süre ve mesafe. Kalori tahmindir, tıbbi ölçüm değildir. Müzik BPM’i skora karışmaz; o etkinliğin temposudur. Yoğunluk ne kadar sert zıpladığındır, gece izi nerede durduğundur.',
    image: require('../../../assets/intro/intro-score.png'),
  },
  {
    key: 'place',
    title: 'Mekân ve paylaşım',
    body: 'Kayıtta Volkswagen yazınca altta Volkswagen Arena çıkar. Etkinliği sen eklersin. Gece bitince en fazla dört fotoğraf eklenir. Kaydet, fotoğrafın üstüne süreyi, zıplamayı, mesafeyi ve kaloriyi basar. Şerit, kare veya hikaye indirilir; telefonda Instagram ve WhatsApp paylaşım sayfası açılır.',
    image: require('../../../assets/intro/intro-night.png'),
  },
  {
    key: 'watch',
    title: 'Nabız Bluetooth’tan',
    body: 'Saat veya nabız kemeri Bluetooth ile bağlanır. Polar, Garmin, Wear OS ve nabız yayımlayan diğer saatler listede görünür. Bağlıysa nabız kayda gerçekten gelir ve kalori formülüne karışır. Bağlanmazsa nabız istenmez, tahmin yazılmaz. Profildeki Saat eşleştir’den tarama açılır.',
    image: require('../../../assets/intro/intro-watch.png'),
  },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const { users, completeOnboarding } = useAppState();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  const enter = async (openWatch: boolean) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const username = guestUsername(users);
    try {
      await completeOnboarding({
        displayName: username,
        username,
        avatarColor: '#3A1214',
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
      });
      router.replace(openWatch ? '/watch' : '/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Açılamadı.');
      setBusy(false);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    if (clamped !== page) setPage(clamped);
  };

  const last = page === slides.length - 1;

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ gap: space.sm }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {last ? <Button label="Saati bağla" onPress={() => void enter(true)} disabled={busy} /> : null}
          {last ? <Button label="Başla" kind="ghost" onPress={() => void enter(false)} disabled={busy} /> : null}
          <Button label="Atla" kind="ghost" onPress={() => void enter(false)} disabled={busy} />
        </View>
      }
    >
      <View style={styles.pager} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            snapToInterval={width}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {slides.map((slide) => (
              <View key={slide.key} style={[styles.slide, { width }]}>
                <Image source={slide.image} style={styles.photo} />
                <Text style={styles.title}>{slide.title}</Text>
                <ScrollView style={styles.bodyScroll} nestedScrollEnabled>
                  <Text style={styles.body}>{slide.body}</Text>
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View key={slide.key} style={[styles.dot, index === page && styles.dotOn]} />
          ))}
        </View>
        <Text style={styles.hint}>Yana kaydır · {page + 1}/{slides.length}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1, gap: space.md },
  slide: { gap: space.sm, flex: 1 },
  photo: { width: '100%', height: 160, borderRadius: 18, backgroundColor: colors.card },
  title: { color: colors.white, fontSize: 28, fontWeight: '700' },
  bodyScroll: { flex: 1 },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, paddingBottom: space.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.red, width: 18 },
  hint: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  error: { color: colors.redBright, fontSize: 14 },
});
