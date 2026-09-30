import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlaceHit } from '../domain/venues';
import { colors, space } from '../theme/tokens';

export function PlaceList({ places, onPick }: { places: PlaceHit[]; onPick: (place: PlaceHit) => void }) {
  if (places.length === 0) return null;
  return (
    <View nativeID="place-results" style={styles.list}>
      {places.map((place) => (
        <Pressable key={place.key} accessibilityRole="button" onPress={() => onPick(place)} style={styles.row}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.meta}>
            {place.area} · {place.city}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  row: {
    paddingHorizontal: space.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  name: { color: colors.white, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13 },
});
