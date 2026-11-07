const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'ow.ly']);
const OFFICIAL_TICKETS = ['bubilet.com', 'biletix.com', 'passo.com.tr', 'bugece.com', 'biletinial.com'];

export const NEW_ACCOUNT_DAYS = 14;
export const NEW_ACCOUNT_DAILY_CAP = 3;
export const REPORTS_BEFORE_HOLD = 3;

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'rejected';
export type EventSource = 'official_feed' | 'organizer' | 'community';

/** A new community night waits for review. A verified organiser is trusted. */
export function initialVerification(organizerVerified: boolean): VerificationStatus {
  return organizerVerified ? 'verified' : 'pending';
}

export function checkTicketUrl(value: string): { ok: true; official: boolean } | { ok: false; error: 'https' | 'shortener' | 'format' } {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return { ok: false, error: 'format' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'https' };
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (SHORTENERS.has(host)) return { ok: false, error: 'shortener' };
  const official = OFFICIAL_TICKETS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  return { ok: true, official };
}

export function ticketRequired(_organizerVerified: boolean, _verification: VerificationStatus): boolean {
  return true;
}

export function foldTitle(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function titlesTooSimilar(left: string, right: string): boolean {
  const a = foldTitle(left);
  const b = foldTitle(right);
  if (a.length < 4 || b.length < 4) return a === b && a.length > 0;
  return a === b || a.includes(b) || b.includes(a);
}

export function isDuplicateSlot(existing: { venueId: string; startAt: string }[], venueId: string, startAt: string): boolean {
  return existing.some((event) => event.venueId === venueId && event.startAt === startAt);
}

export function withinDailyCap(input: { accountCreatedAt: string; createdAt: string[]; now: Date }): boolean {
  const age = input.now.getTime() - new Date(input.accountCreatedAt).getTime();
  if (age > NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000) return true;
  const dayAgo = input.now.getTime() - 24 * 60 * 60 * 1000;
  const recent = input.createdAt.filter((stamp) => new Date(stamp).getTime() >= dayAgo).length;
  return recent < NEW_ACCOUNT_DAILY_CAP;
}

export function shouldNotify(kind: 'cancelled' | 'postponed', status: 'going' | 'interested' | 'checked_in' | 'left' | null): boolean {
  if (kind === 'cancelled') return status === 'going';
  return status === 'going' || status === 'interested';
}

export function applyReport(input: { reporters: string[]; reporterId: string; verification: VerificationStatus }): {
  reporters: string[];
  verification: VerificationStatus;
  held: boolean;
} {
  const reporters = input.reporters.includes(input.reporterId) ? input.reporters : [...input.reporters, input.reporterId];
  const held = reporters.length >= REPORTS_BEFORE_HOLD;
  return {
    reporters,
    verification: held && input.verification !== 'rejected' ? 'pending' : input.verification,
    held,
  };
}
