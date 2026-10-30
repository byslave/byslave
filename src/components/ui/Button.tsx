import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { haptic } from '@/src/lib/haptics';
import { colors, fonts, radii } from '@/src/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic(variant === 'primary' ? 'success' : 'tap');
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[styles.label, variant === 'primary' ? styles.primaryLabel : variant === 'danger' ? styles.dangerLabel : styles.secondaryLabel]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 15 },
  primaryLabel: { color: colors.accentInk },
  secondaryLabel: { color: colors.text },
  dangerLabel: { color: colors.danger },
});
