import { Text, type TextProps, type TextStyle } from 'react-native';

import { text } from '@/src/theme/text';

type Variant = keyof typeof text;

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: Variant; style?: TextStyle | TextStyle[] }) {
  return <Text {...props} style={[text[variant], style]} maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.5} />;
}
