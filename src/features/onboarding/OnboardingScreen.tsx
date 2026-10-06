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
    image: require('../../../assets/intro/intro-night.png'),
    paragraphs: [
      `${brand.name}, rave, kulüp, konser, festival ve after geceni telefonunla tutar. Ana sayfada arkadaşların geceleri, Etkinlik’te mekânlar, ortadaki kırmızı Kayıt’ta kendi gecen, Aktivite’de geçmiş, Profil’de rekorlar durur.`,
      'Kayıt’ta Geceyi başlat deyince telefonun ivmesi okunur. Zıplama, tempo ve süre buradan gelir. Otururken, telefon masadayken veya hareket yokken zıplama ve kalori yazılmaz. Sayı uydurulmaz.',
      'Arkadaşını bul kapalıyken rota saklanmaz. Açarsan ve gerçekten yer değiştirdiysen gece izi çizilir. Aynı salonda kaldıysan rota uydurulmaz; zirve dakikası yazılır.',
    ],
  },
  {
    key: 'score',
    title: 'Party Score',
    image: require('../../../assets/intro/intro-score.png'),
    paragraphs: [
      'Gece bitince 0–100 arası bir skor çıkar. Beş parçadan gelir: hareketin sertliği, zıplama sayısı, yanan kalori, süre ve mesafe. Kalori tahmindir, tıbbi ölçüm değildir.',
      'Yoğunluk, ne kadar sert zıpladığındır. 0 sakin, 100 gecenin en sert anı. Gece izi ise nerede durduğundur. İkisi aynı şey değildir.',
      'Müzik BPM’i skora karışmaz; o etkinliğin temposudur. Nabız yalnız Bluetooth saat bağlıysa kaloriye karışır. Saat yoksa nabız istenmez.',
    ],
  },
  {
    key: 'place',
    title: 'Mekân ve paylaşım',
    image: require('../../../assets/intro/intro-night.png'),
    paragraphs: [
      'Kayıtta mekân ara. Volkswagen yazınca altta Volkswagen Arena çıkar. Listede yoksa aynı yerden eklenir. Etkinlik sekmesinde de kendi geceni açabilirsin; Bugece veya Bubilet’ten otomatik çekilmez.',
      'Kayıt bitince sıra şöyledir: Party Score, istatistikler, fotoğraf, gece izi, skorun hesabı, yorum. En fazla dört fotoğraf eklenir. Yalnız sen ekler ve silersin; başkaları görür.',
      'Alttaki Kaydet, fotoğrafın üstüne süre, zıplama, mesafe ve kaloriyi basar. Şerit, kare veya hikaye indirilir. Telefonda Instagram, WhatsApp ve X paylaşım sayfası açılır. Metin kopyalanmaz.',
    ],
  },
  {
    key: 'watch',
    title: 'Saati Bluetooth ile bağla',
    image: require('../../../assets/intro/intro-watch.png'),
    paragraphs: [
      'Nabız, Bluetooth üzerinden gelir. Saatini veya göğüs bandını eşleştirme moduna al, bu slayttaki Saati bağla veya Profil’deki Saat eşleştir’e bas, listeden cihazını seç.',
      'Polar, Garmin, Wear OS, nabız kemeri ve Bluetooth nabız yayımlayan saatler çalışır. Apple Watch bu tarayıcıda nabız vermez. Bağlanmazsa nabız tahmin yazılmaz.',
      'Bağlantı koparsa kayıt durmaz, nabız kesilir. iPhone Safari Bluetooth açmaz. Android’de Chrome ve HTTPS gerekir. İlk nabız gelmeden sayı 0 kalır.',
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

  const finish = async (openWatch: boolean) => {
    if (busy) return;
    if (profile) {
      router.replace(openWatch ? '/watch' : '/');
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
          {last ? <Button label="Saati bağla" onPress={() => void finish(true)} disabled={busy} /> : null}
          {last ? <Button label="Başla" kind="ghost" onPress={() => void finish(false)} disabled={busy} /> : null}
          <Button label={profile ? 'Kapat' : 'Atla'} kind="ghost" onPress={() => void finish(false)} disabled={busy} />
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
                    <Text key={paragraph.slice(0, 24)} style={styles.body}>
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
        <Text style={styles.hint}>Yana kaydır · {page + 1}/{slides.length}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1, gap: space.sm },
  slide: { gap: space.sm, flex: 1 },
  photo: { width: '100%', height: 132, borderRadius: 18, backgroundColor: colors.card },
  title: { color: colors.white, fontSize: 26, fontWeight: '700' },
  bodyScroll: { flex: 1 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, paddingBottom: space.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.red, width: 18 },
  hint: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  error: { color: colors.redBright, fontSize: 14 },
});
