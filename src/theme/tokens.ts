import tokens from './tokens.json';

export const colors = tokens.colors;
export const space = tokens.space;
export const radii = tokens.radii;
export const motion = tokens.motion;

export const fonts = {
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const tabClearance = 108;
