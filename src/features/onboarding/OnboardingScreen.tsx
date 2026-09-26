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
    body: `${brand.name}, parti, rave, konser ve kulüp geceni tutar. Süre, zıplama ve mesafe bu kayıtta toplanır.`,
    image: require('../../../assets/intro/intro-night.png'),
  },
  {
    key: 'score',
    title: 'Party Score',
    body: 'Bu gece 0-100 arası bir skor olur. Arkadaşların ve etkinlik tablosuyla kıyaslarsın.',
    image: require('../../../assets/intro/intro-score.png'),
  },
  {
    key: 'watch',
    title: 'Nabız saatten gelir',
    body: 'Akıllı saat bağlıysa nabız kendiliğinden alınır. Saat yoksa nabız istenmez.',
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

  const enter = async () => {
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
      router.replace('/');
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

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ gap: space.sm }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {page === slides.length - 1 ? <Button label="Başla" onPress={() => void enter()} disabled={busy} /> : null}
          <Button label="Atla" kind="ghost" onPress={() => void enter()} disabled={busy} />
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
                <Text style={styles.body}>{slide.body}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View key={slide.key} style={[styles.dot, index === page && styles.dotOn]} />
          ))}
        </View>
        <Text style={styles.hint}>Yana kaydır</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1, gap: space.md },
  slide: { gap: space.md },
  photo: { width: '100%', height: 220, borderRadius: 18, backgroundColor: colors.card },
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.red, width: 18 },
  hint: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  error: { color: colors.redBright, fontSize: 14 },
});
