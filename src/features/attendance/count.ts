export type AttendanceStatus = 'interested' | 'going' | 'checked_in' | 'left';

/** Interested and left do not count as confirmed attendance. */
export function confirmedCount(base: number, status: AttendanceStatus | null): number {
  const extra = status === 'going' || status === 'checked_in' ? 1 : 0;
  return base + extra;
}
