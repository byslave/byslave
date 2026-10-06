import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, gap: 12 }}>
      <Text style={{ color: colors.white, fontSize: 28, fontWeight: '700' }}>Sayfa yok</Text>
      <Link href="/" style={{ color: colors.red }}>
        Ana sayfaya dön
      </Link>
    </View>
  );
}
