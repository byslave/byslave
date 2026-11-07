export function isRealDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isAtLeastAge(
  year: number,
  month: number,
  day: number,
  now: Date,
  years: number,
): boolean {
  if (!isRealDate(year, month, day)) return false;
  const birth = new Date(year, month - 1, day);
  const cutoff = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
  return birth.getTime() <= cutoff.getTime();
}

export function toISODate(year: number, month: number, day: number): string {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}
