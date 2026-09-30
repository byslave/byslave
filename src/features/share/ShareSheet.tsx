import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { brand } from '../../config/brand';
import { colors, space } from '../../theme/tokens';
import { Button } from '../../components/ui';
import { cardVariants, downloadCard, renderNightCard, shareCard, type CardVariant } from './nightCard';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  venue: string;
  score: number;
  duration: string;
  jumps: string;
  distance: string;
  calories: string;
  photoUris: string[];
};

export function ShareSheet(props: Props) {
  const [variant, setVariant] = useState<CardVariant>('serit');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const photoUri = props.photoUris[photoIndex] ?? null;
  const shape = cardVariants.find((item) => item.id === variant) ?? cardVariants[0]!;

  useEffect(() => {
    if (!props.open) return;
    setVariant('serit');
    setPhotoIndex(0);
    setNote(null);
  }, [props.open]);

  const input = {
    variant,
    photoUri,
    title: props.title,
    venue: props.venue,
    score: props.score,
    duration: props.duration,
    jumps: props.jumps,
    distance: props.distance,
    calories: props.calories,
  };

  const run = async (kind: 'download' | 'share') => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const dataUrl = await renderNightCard(input);
      if (!dataUrl) {
        setNote('Bu ortamda görsel oluşturulamadı.');
        return;
      }
      if (kind === 'download') {
        downloadCard(dataUrl, props.score);
        setNote('Görsel indi.');
        return;
      }
      const result = await shareCard(dataUrl, props.title, props.score);
      setNote(result === 'shared' ? 'Paylaşım sayfası açıldı.' : 'Görsel indi. Telefonda Instagram veya WhatsApp’a ekleyebilirsin.');
    } catch {
      setNote('Paylaşım kapanmış olabilir.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={props.open} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={props.onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Dışa aktar</Text>
            <Text style={styles.meta}>Fotoğrafın üstüne bu gecenin sayıları basılır. Üç düzen var.</Text>
            <View style={styles.chips}>
              {cardVariants.map((item) => (
                <Pressable key={item.id} accessibilityRole="button" onPress={() => setVariant(item.id)} style={[styles.chip, variant === item.id && styles.chipOn]}>
                  <Text style={styles.chipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            {props.photoUris.length > 1 ? (
              <View style={styles.chips}>
                {props.photoUris.map((uri, index) => (
                  <Pressable key={`${index}-${uri.slice(0, 12)}`} accessibilityRole="button" onPress={() => setPhotoIndex(index)} style={[styles.chip, photoIndex === index && styles.chipOn]}>
                    <Text style={styles.chipText}>Fotoğraf {index + 1}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <NightCardPreview {...input} ratio={shape.width / shape.height} />
            <Button label={busy ? 'Hazırlanıyor' : 'İndir'} onPress={() => void run('download')} disabled={busy} />
            <Text style={styles.meta}>Sosyal uygulamalar</Text>
            <View style={styles.chips}>
              {['Instagram', 'WhatsApp', 'X'].map((name) => (
                <Pressable key={name} accessibilityRole="button" onPress={() => void run('share')} style={styles.chip}>
                  <Text style={styles.chipText}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.meta}>Telefonda paylaşım sayfası Instagram, WhatsApp ve diğerlerini açar.</Text>
            {note ? <Text style={styles.note}>{note}</Text> : null}
            <Button label="Kapat" kind="ghost" onPress={props.onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NightCardPreview({
  variant,
  photoUri,
  title,
  venue,
  score,
  duration,
  jumps,
  distance,
  calories,
  ratio,
}: NightCardInputPreview) {
  const photo = photoUri ? <Image source={{ uri: photoUri }} style={styles.fill} /> : <View style={[styles.fill, styles.empty]} />;
  const numbers = (
    <View style={styles.statRow}>
      <Mini label="Süre" value={duration} />
      <Mini label="Zıplama" value={jumps} />
      <Mini label="Mesafe" value={distance} />
      <Mini label="Kalori" value={calories} />
    </View>
  );
  return (
    <View style={[styles.card, photoUri ? { aspectRatio: ratio } : null]}>
      {variant === 'serit' ? (
        <View style={styles.column}>
          <View style={styles.photoSlot}>{photo}</View>
          <View style={styles.bar}>
            <View style={styles.barHead}>
              <View>
                <Text style={styles.score}>{score}</Text>
                <Text style={styles.caption}>Party Score</Text>
              </View>
              <View style={styles.barTitles}>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.caption} numberOfLines={1}>{venue}</Text>
              </View>
            </View>
            {numbers}
          </View>
        </View>
      ) : (
        <View style={styles.column}>
          {photo}
          <View style={styles.overlay}>
            <Text style={styles.brand}>{brand.name}</Text>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.caption}>Party Score</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.caption} numberOfLines={1}>{venue}</Text>
            {numbers}
          </View>
        </View>
      )}
    </View>
  );
}

type NightCardInputPreview = {
  variant: CardVariant;
  photoUri: string | null;
  title: string;
  venue: string;
  score: number;
  duration: string;
  jumps: string;
  distance: string;
  calories: string;
  ratio: number;
};

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    height: '86%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: space.md, gap: space.sm, paddingBottom: space.xl },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13 },
  note: { color: colors.white, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { borderColor: colors.red, backgroundColor: '#2A0C0E' },
  chipText: { color: colors.white, fontSize: 13 },
  card: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  column: { flex: 1 },
  photoSlot: { flex: 1, backgroundColor: colors.card },
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  empty: { backgroundColor: '#1A1A1A' },
  bar: { backgroundColor: colors.bgSecondary, padding: 12, gap: 8 },
  barHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barTitles: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    gap: 2,
    backgroundColor: 'rgba(5,5,5,0.78)',
  },
  brand: { color: colors.white, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  score: { color: colors.red, fontSize: 36, fontWeight: '700' },
  caption: { color: colors.textSecondary, fontSize: 11 },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  mini: { flex: 1 },
  miniValue: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
