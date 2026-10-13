import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { portraits, type PortraitKey } from '@/src/data/images';
import { colors, fonts } from '@/src/theme/tokens';

interface AvatarProps {
  name: string;
  portrait?: PortraitKey | 'you';
  size?: number;
}

export function Avatar({ name, portrait, size = 36 }: AvatarProps) {
  const source = portrait && portrait !== 'you' ? portraits[portrait] : null;
  return (
    <View
      accessibilityLabel={name}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {source ? (
        <Image source={source} style={{ width: size - 2, height: size - 2, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.36 }]} maxFontSizeMultiplier={1.2}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  letter: { fontFamily: fonts.display, color: colors.accent },
});
