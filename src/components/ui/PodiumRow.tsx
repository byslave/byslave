import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Avatar } from '@/src/components/ui/Avatar';
import type { PortraitKey } from '@/src/data/images';
import { colors, fonts, radii } from '@/src/theme/tokens';

interface PodiumRowProps {
  rank: number;
  name: string;
  value: string;
  portrait?: PortraitKey | 'you';
  highlight?: boolean;
}

export function PodiumRow({ rank, name, value, portrait, highlight = false }: PodiumRowProps) {
  return (
    <View style={[styles.row, highlight && styles.highlight]}>
      <AppText variant="bodyMedium" style={styles.rank}>
        {rank}
      </AppText>
      <Avatar name={name} portrait={portrait} size={40} />
      <AppText variant="bodyMedium" style={styles.name}>
        {name}
      </AppText>
      <AppText variant="bodyMedium" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  highlight: { backgroundColor: 'rgba(217,204,255,0.12)' },
  rank: { width: 22, fontFamily: fonts.display, color: colors.accent },
  name: { flex: 1 },
  value: { fontVariant: ['tabular-nums'] },
});
