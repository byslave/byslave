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
    title: 'Track your night',
    image: require('../../../assets/intro/intro-night.png'),
    paragraphs: [
      `From the first song to the last, ${brand.name} keeps the night. Jumps, tempo and time come from your phone — raves, clubs, concerts, festivals, afters.`,
      'Sit still or leave it on the table and nothing gets logged. Numbers aren’t made up.',
    ],
  },
  {
    key: 'stats',
    title: 'See how hard you moved',
    image: require('../../../assets/intro/intro-score.png'),
    paragraphs: [
      'How much did you jump? How long were you moving? How many calories did you burn? After the night, the stats are waiting.',
      'Party Score turns real movement into a night you can look back on. No random numbers.',
    ],
  },
  {
    key: 'people',
    title: 'Find the people. Find the vibe.',
    image: require('../../../assets/intro/intro-night.png'),
    paragraphs: [
      'Home shows who’s out. Events holds venues, lineups and who’s already there. Follow a friend and their nights land on yours.',
      'From clubs and raves to concerts and festivals, the next night is never far.',
    ],
  },
  {
    key: 'legacy',
    title: 'Make every night count',
    image: require('../../../assets/intro/intro-watch.png'),
    paragraphs: [
      'Activity keeps every finished night. Profile holds your eight-week rhythm, your records, the people you run into.',
      'Your route only draws when you actually moved. Pair a watch if you want heart rate. Either way — keep the story.',
    ],
  },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const { users, profile, completeOnboarding } = useAppState();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  const finish = async () => {
    if (busy) return;
    if (profile) {
      router.replace('/');
      return;
    }
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
      setError(cause instanceof Error ? cause.message : "Couldn't start.");
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
          {last ? <Button label="Start your night" onPress={() => void finish()} disabled={busy} /> : null}
          <Button label={profile ? 'Close' : 'Skip'} kind="ghost" onPress={() => void finish()} disabled={busy} />
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
                  {slide.paragraphs.map((paragraph) => (
                    <Text key={paragraph.slice(0, 28)} style={styles.body}>
                      {paragraph}
                    </Text>
                  ))}
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
        <Text style={styles.hint}>Swipe sideways · {page + 1}/{slides.length}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1, gap: space.md },
  slide: { gap: space.sm, flex: 1 },
  photo: { width: '100%', height: 200, borderRadius: 18, backgroundColor: colors.card },
  title: { color: colors.white, fontSize: 32, fontWeight: '700' },
  bodyScroll: { flex: 1 },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, paddingBottom: space.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.red, width: 18 },
  hint: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  error: { color: colors.redBright, fontSize: 14 },
});
