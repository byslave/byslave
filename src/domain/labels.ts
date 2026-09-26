import type { FitnessLevel, NightKind, Sex } from './types';

export const danceEffortLabel: Record<FitnessLevel, string> = {
  low: 'Yumuşak',
  medium: 'Orta',
  high: 'Sert',
};

export const sexLabel: Record<Sex, string> = {
  female: 'Kadın',
  male: 'Erkek',
  unspecified: 'Belirtilmedi',
};

export const nightKindOptions: { id: NightKind; label: string }[] = [
  { id: 'rave', label: 'Rave' },
  { id: 'club', label: 'Kulüp' },
  { id: 'festival', label: 'Festival' },
  { id: 'concert', label: 'Konser' },
  { id: 'after', label: 'After' },
];

export function nightKindLabel(kind: NightKind | null | undefined): string {
  return nightKindOptions.find((item) => item.id === kind)?.label ?? 'Serbest gece';
}
