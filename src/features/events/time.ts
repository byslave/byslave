/** Europe/Istanbul wall time. Turkey does not observe daylight saving, so the offset stays +03:00. */

const ISTANBUL = 'Europe/Istanbul';

export interface IstanbulParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function istanbulParts(instant: Date): IstanbulParts {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: ISTANBUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const bag = Object.fromEntries(formatted.map((part) => [part.type, part.value]));
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour) % 24,
    minute: Number(bag.minute),
  };
}

export function istanbulOffsetHours(instant: Date): number {
  const parts = istanbulParts(instant);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const utcMinutes = Math.round(instant.getTime() / 60000);
  return Math.round((asUtc / 60000 - utcMinutes) / 60);
}

/** Interpret a calendar date and 24-hour clock as Istanbul local time. */
export function istanbulLocalToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('invalid-istanbul-local');
  }
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = istanbulOffsetHours(guess);
  return new Date(Date.UTC(year, month - 1, day, hour - offset, minute));
}

export function formatIstanbul(instant: Date, language: string): string {
  return new Intl.DateTimeFormat(language.startsWith('en') ? 'en-GB' : 'tr-TR', {
    timeZone: ISTANBUL,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant);
}

function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function istanbulDateISO(instant: Date): string {
  const parts = istanbulParts(instant);
  return isoFromParts(parts.year, parts.month, parts.day);
}

export function istanbulClock(instant: Date): string {
  const parts = istanbulParts(instant);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

/** 0 is Sunday, matching JavaScript's getDay, in the Istanbul calendar. */
export function istanbulWeekday(instant: Date): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: ISTANBUL, weekday: 'short' }).format(instant);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(label);
}

export function addIstanbulDays(instant: Date, days: number): string {
  return shiftIstanbulDate(istanbulParts(instant), days);
}

export function istanbulWeekendDates(now: Date): string[] {
  const weekday = istanbulWeekday(now);
  if (weekday === 0) return [istanbulDateISO(now)];
  const delta = (6 - weekday + 7) % 7;
  return [addIstanbulDays(now, delta), addIstanbulDays(now, delta + 1)];
}

export function upcomingIstanbulDates(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addIstanbulDays(now, index));
}

function shiftIstanbulDate(parts: Pick<IstanbulParts, 'year' | 'month' | 'day'>, days: number): string {
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return isoFromParts(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

/**
 * Tonight runs 18:00 Istanbul through 06:00 the next morning.
 * Before 06:00 the window still belongs to the night that started yesterday.
 */
export function tonightBounds(now: Date): { start: Date; end: Date } {
  const parts = istanbulParts(now);
  const anchor = parts.hour < 6 ? shiftIstanbulDate(parts, -1) : isoFromParts(parts.year, parts.month, parts.day);
  const [year, month, day] = anchor.split('-').map(Number);
  const next = shiftIstanbulDate({ year: year ?? 0, month: month ?? 1, day: day ?? 1 }, 1);
  return {
    start: istanbulLocalToUtc(anchor, '18:00'),
    end: istanbulLocalToUtc(next, '06:00'),
  };
}

export function overlapsTonight(start: Date, end: Date, now: Date): boolean {
  const window = tonightBounds(now);
  return start.getTime() < window.end.getTime() && end.getTime() > window.start.getTime();
}

export type NightPhase = 'soon' | 'live' | 'later' | 'over';

export function nightPhase(start: Date, end: Date, now: Date): NightPhase {
  if (now.getTime() >= end.getTime()) return 'over';
  if (now.getTime() >= start.getTime()) return 'live';
  if (start.getTime() - now.getTime() <= 3 * 60 * 60 * 1000) return 'soon';
  return 'later';
}

/** When the hour is unknown, the night runs that evening until 06:00 the next day. */
export function unconfirmedNight(date: string): { start: Date; end: Date } {
  const [year, month, day] = date.split('-').map(Number);
  const next = shiftIstanbulDate({ year: year ?? 0, month: month ?? 1, day: day ?? 1 }, 1);
  return { start: istanbulLocalToUtc(date, '18:00'), end: istanbulLocalToUtc(next, '06:00') };
}

export function windowFromClocks(date: string, startTime: string, endTime: string): { start: Date; end: Date } {
  const start = istanbulLocalToUtc(date, startTime);
  let end = istanbulLocalToUtc(date, endTime);
  if (end.getTime() <= start.getTime()) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export type EventLife = 'scheduled' | 'cancelled' | 'postponed' | 'expired';
export type ScheduleError = 'needDate' | 'pastDate' | 'endAfterStart' | 'tooLong' | 'tooFar';

export interface EventSession {
  id: string;
  startAt: string;
  endAt: string;
}

export interface Schedulable {
  status: EventLife;
  startAt: string;
  endAt: string;
  sessions: EventSession[];
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  held: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 366 * DAY;

export function validateWindow(input: {
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  timeUnconfirmed: boolean;
  now: Date;
  editing?: boolean;
}): { ok: true; start: Date; end: Date } | { ok: false; error: ScheduleError } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: 'needDate' };
  const endDate = input.endDate ?? input.date;
  if (!input.timeUnconfirmed && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { ok: false, error: 'needDate' };
  const span = input.timeUnconfirmed ? unconfirmedNight(input.date) : clockSpan(input.date, input.startTime, endDate, input.endTime);
  if (!span) return { ok: false, error: 'needDate' };
  if (span.end.getTime() <= span.start.getTime()) return { ok: false, error: 'endAfterStart' };
  if (span.end.getTime() - span.start.getTime() > DAY) return { ok: false, error: 'tooLong' };
  if (!input.editing && span.start.getTime() < input.now.getTime()) return { ok: false, error: 'pastDate' };
  if (span.start.getTime() > input.now.getTime() + YEAR) return { ok: false, error: 'tooFar' };
  return { ok: true, start: span.start, end: span.end };
}

function clockSpan(startDate: string, startTime: string, endDate: string, endTime: string): { start: Date; end: Date } | null {
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ((sh ?? 99) > 23 || (eh ?? 99) > 23 || (sm ?? 99) > 59 || (em ?? 99) > 59) return null;
  return { start: istanbulLocalToUtc(startDate, startTime), end: istanbulLocalToUtc(endDate, endTime) };
}

export function activeSessions(event: Pick<Schedulable, 'startAt' | 'endAt' | 'sessions'>, now: Date): EventSession[] {
  const sessions = event.sessions.length > 0 ? event.sessions : [{ id: 'main', startAt: event.startAt, endAt: event.endAt }];
  return sessions.filter((session) => new Date(session.endAt).getTime() > now.getTime());
}

/** Map, feed, and search. Past, cancelled, rejected, and held nights stay out. */
export function isPubliclyListed(event: Schedulable, now: Date): boolean {
  if (event.held) return false;
  if (event.status !== 'scheduled') return false;
  if (event.verificationStatus !== 'verified' && event.verificationStatus !== 'unverified') return false;
  return activeSessions(event, now).length > 0;
}

/** The device clock is ignored. Listing follows the server instant. */
export function isPubliclyListedAt(event: Schedulable, serverNow: Date, _deviceNow: Date): boolean {
  return isPubliclyListed(event, serverNow);
}

export function expireIfEnded(event: Schedulable, now: Date): Schedulable {
  if (event.status !== 'scheduled') return event;
  if (activeSessions(event, now).length > 0) return event;
  return { ...event, status: 'expired' };
}

export function shouldAnonymise(endAt: string, now: Date): boolean {
  return new Date(endAt).getTime() < now.getTime() - YEAR;
}
