export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
}

export function formatCalories(value: number): string {
  const digits = value < 50 ? 1 : 0;
  return value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function eventPhase(startsAt: string, now = Date.now()): 'live' | 'upcoming' | 'past' {
  const start = new Date(startsAt).getTime();
  const end = start + 6 * 60 * 60 * 1000;
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'past';
}
