import { events as demoEvents, type DemoEvent } from '@/src/data/demo';

import type { DateFilter } from './dates';
import type { EventOverride, PulseEvent } from './model';
import { isPubliclyListed, overlapsTonight, windowFromClocks, type Schedulable } from './schedule';
import { istanbulDateISO, istanbulWeekendDates } from './time';

export function toSchedule(event: PulseEvent): Schedulable {
  return {
    status: event.status,
    startAt: event.startAt,
    endAt: event.endAt,
    sessions: event.sessions,
    verificationStatus: event.verificationStatus,
    held: event.held,
  };
}

export function demoToPulse(event: DemoEvent): PulseEvent {
  const span = windowFromClocks(event.date, event.startTime, event.endTime);
  return {
    ...event,
    concept: event.genres.join(' · '),
    endDate: istanbulDateISO(span.end),
    startAt: span.start.toISOString(),
    endAt: span.end.toISOString(),
    source: 'community',
    sourceName: null,
    externalId: null,
    ticketUrl: null,
    verificationStatus: 'unverified',
    verifiedAt: null,
    verifiedBy: null,
    verificationNote: null,
    status: 'scheduled',
    timeUnconfirmed: false,
    sessions: [],
    held: false,
    reporters: [],
    createdBy: null,
    createdAt: span.start.toISOString(),
    sample: true,
  };
}

export function applyOverride(event: PulseEvent, override: EventOverride | undefined): PulseEvent {
  if (!override) return event;
  return {
    ...event,
    reporters: override.reporters,
    held: override.held,
    verificationStatus: override.verificationStatus ?? event.verificationStatus,
    verifiedAt: override.verifiedAt === undefined ? event.verifiedAt : override.verifiedAt,
    verifiedBy: override.verifiedBy === undefined ? event.verifiedBy : override.verifiedBy,
    verificationNote: override.verificationNote === undefined ? event.verificationNote : override.verificationNote,
    status: override.status ?? event.status,
    startAt: override.startAt ?? event.startAt,
    endAt: override.endAt ?? event.endAt,
    date: override.date ?? event.date,
    endDate: override.endDate ?? event.endDate,
    startTime: override.startTime ?? event.startTime,
    endTime: override.endTime ?? event.endTime,
    sessions: override.sessions ?? event.sessions,
  };
}

export function assembleEvents(local: PulseEvent[], overrides: Record<string, EventOverride>): PulseEvent[] {
  const localIds = new Set(local.map((event) => event.id));
  const samples = demoEvents
    .filter((event) => !localIds.has(event.id))
    .map((event) => applyOverride(demoToPulse(event), overrides[event.id]));
  return [...local, ...samples];
}

export function findPulseEvent(id: string, local: PulseEvent[], overrides: Record<string, EventOverride>): PulseEvent | undefined {
  return assembleEvents(local, overrides).find((event) => event.id === id);
}

function touchedDays(event: PulseEvent): string[] {
  const sessions = event.sessions.length > 0 ? event.sessions : [{ startAt: event.startAt, endAt: event.endAt }];
  const days = new Set<string>();
  for (const session of sessions) {
    days.add(istanbulDateISO(new Date(session.startAt)));
    days.add(istanbulDateISO(new Date(session.endAt)));
  }
  return [...days];
}

/** Map, feed, and search. The instant is the server clock. */
export function matchesListing(event: PulseEvent, filter: DateFilter, now: Date): boolean {
  if (!isPubliclyListed(toSchedule(event), now)) return false;
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  if (filter.kind === 'tonight') return overlapsTonight(start, end, now);
  const days = filter.kind === 'day' ? [filter.iso] : istanbulWeekendDates(now);
  return touchedDays(event).some((day) => days.includes(day));
}

export function nextListedDate(rows: PulseEvent[], now: Date): string | null {
  const today = istanbulDateISO(now);
  const dates = rows
    .filter((event) => isPubliclyListed(toSchedule(event), now))
    .map((event) => event.date)
    .filter((date) => date >= today)
    .sort();
  return dates[0] ?? null;
}
