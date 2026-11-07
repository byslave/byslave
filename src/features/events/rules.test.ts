import assert from 'node:assert/strict';
import { test } from 'node:test';

import { feedFlags } from './sources/config.ts';
import { disabledFeed } from './sources/skeleton.ts';
import {
  activeSessions,
  istanbulLocalToUtc,
  istanbulOffsetHours,
  isPubliclyListed,
  isPubliclyListedAt,
  nightPhase,
  overlapsTonight,
  validateWindow,
  type Schedulable,
} from './time.ts';
import { applyReport, checkTicketUrl, initialVerification, isDuplicateSlot, shouldNotify, ticketRequired, titlesTooSimilar, withinDailyCap } from './verification.ts';

function night(start: string, end: string, status: Schedulable['verificationStatus'] = 'verified'): Schedulable {
  return {
    status: 'scheduled',
    startAt: istanbulLocalToUtc('2026-10-31', start).toISOString(),
    endAt: istanbulLocalToUtc('2026-11-01', end).toISOString(),
    sessions: [],
    verificationStatus: status,
    held: false,
  };
}

test('a night that crosses midnight stays up until its end, then leaves the map', () => {
  const event = night('23:00', '05:00');
  const during = istanbulLocalToUtc('2026-11-01', '02:00');
  const after = istanbulLocalToUtc('2026-11-01', '05:01');
  assert.equal(isPubliclyListed(event, during), true);
  assert.equal(overlapsTonight(new Date(event.startAt), new Date(event.endAt), during), true);
  assert.equal(isPubliclyListed(event, after), false);
  assert.equal(nightPhase(new Date(event.startAt), new Date(event.endAt), during), 'live');
});

test('an end before the start is rejected', () => {
  const now = istanbulLocalToUtc('2026-10-30', '12:00');
  const reversed = validateWindow({
    date: '2026-10-31',
    endDate: '2026-10-31',
    startTime: '23:00',
    endTime: '22:00',
    timeUnconfirmed: false,
    now,
  });
  assert.deepEqual(reversed, { ok: false, error: 'endAfterStart' });
  const overnight = validateWindow({
    date: '2026-10-31',
    endDate: '2026-11-01',
    startTime: '23:00',
    endTime: '05:00',
    timeUnconfirmed: false,
    now,
  });
  assert.equal(overnight.ok, true);
  const missing = validateWindow({ date: '', startTime: '23:00', endTime: '05:00', timeUnconfirmed: false, now });
  assert.deepEqual(missing, { ok: false, error: 'needDate' });
  const tooLong = validateWindow({
    date: '2026-10-31',
    endDate: '2026-11-01',
    startTime: '12:00',
    endTime: '12:30',
    timeUnconfirmed: false,
    now,
  });
  assert.deepEqual(tooLong, { ok: false, error: 'tooLong' });
});

test('a new event cannot start in the past', () => {
  const now = istanbulLocalToUtc('2026-11-02', '15:00');
  const past = validateWindow({
    date: '2026-11-01',
    endDate: '2026-11-02',
    startTime: '23:00',
    endTime: '05:00',
    timeUnconfirmed: false,
    now,
  });
  assert.deepEqual(past, { ok: false, error: 'pastDate' });
  const editing = validateWindow({
    date: '2026-11-01',
    endDate: '2026-11-02',
    startTime: '23:00',
    endTime: '05:00',
    timeUnconfirmed: false,
    now,
    editing: true,
  });
  assert.equal(editing.ok, true);
});

test('the same venue and start cannot be saved twice', () => {
  const start = istanbulLocalToUtc('2026-11-06', '23:00').toISOString();
  const existing = [{ venueId: 'klein', startAt: start }];
  assert.equal(isDuplicateSlot(existing, 'klein', start), true);
  assert.equal(isDuplicateSlot(existing, 'silo', start), false);
  assert.equal(titlesTooSimilar('Pulse 01', 'pulse 01'), true);
});

test('a community night waits for review and only a verified night is on the map', () => {
  const now = istanbulLocalToUtc('2026-11-01', '02:00');
  assert.equal(initialVerification(false), 'pending');
  assert.equal(initialVerification(true), 'verified');
  assert.equal(isPubliclyListed(night('23:00', '05:00', 'unverified'), now), false);
  assert.equal(isPubliclyListed(night('23:00', '05:00', 'pending'), now), false);
  assert.equal(isPubliclyListed(night('23:00', '05:00', 'verified'), now), true);
});

test('three different reports pull the event off the map and into review', () => {
  let state = applyReport({ reporters: [], reporterId: 'a', verification: 'unverified' });
  state = applyReport({ reporters: state.reporters, reporterId: 'a', verification: state.verification });
  assert.equal(state.held, false);
  state = applyReport({ reporters: state.reporters, reporterId: 'b', verification: state.verification });
  state = applyReport({ reporters: state.reporters, reporterId: 'c', verification: state.verification });
  assert.equal(state.held, true);
  assert.equal(state.verification, 'pending');
  assert.equal(state.reporters.length, 3);
  const event = { ...night('23:00', '05:00'), held: true, verificationStatus: state.verification };
  assert.equal(isPubliclyListed(event, istanbulLocalToUtc('2026-11-01', '02:00')), false);
});

test('a cancelled event leaves the map immediately', () => {
  const event = { ...night('23:00', '05:00'), status: 'cancelled' as const };
  assert.equal(isPubliclyListed(event, istanbulLocalToUtc('2026-11-01', '01:00')), false);
});

test('a wrong device clock does not keep an ended night on the map', () => {
  const event = night('23:00', '05:00');
  const server = istanbulLocalToUtc('2026-11-01', '05:01');
  const device = istanbulLocalToUtc('2026-11-01', '02:00');
  assert.equal(isPubliclyListedAt(event, server, device), false);
  assert.equal(isPubliclyListedAt(event, device, server), true);
});

test('Istanbul stays three hours ahead of UTC across the old daylight-saving weekends', () => {
  const spring = new Date('2026-03-29T00:30:00.000Z');
  const autumn = new Date('2026-10-25T00:30:00.000Z');
  assert.equal(istanbulOffsetHours(spring), 3);
  assert.equal(istanbulOffsetHours(autumn), 3);
  const local = istanbulLocalToUtc('2026-10-31', '23:00');
  assert.equal(local.toISOString(), '2026-10-31T20:00:00.000Z');
});

test('a finished session drops while a later session stays', () => {
  const earlyEnd = istanbulLocalToUtc('2026-11-01', '02:00').toISOString();
  const lateStart = istanbulLocalToUtc('2026-11-01', '18:00').toISOString();
  const lateEnd = istanbulLocalToUtc('2026-11-02', '01:00').toISOString();
  const event: Schedulable = {
    status: 'scheduled',
    startAt: istanbulLocalToUtc('2026-10-31', '22:00').toISOString(),
    endAt: lateEnd,
    verificationStatus: 'verified',
    held: false,
    sessions: [
      { id: 'one', startAt: istanbulLocalToUtc('2026-10-31', '22:00').toISOString(), endAt: earlyEnd },
      { id: 'two', startAt: lateStart, endAt: lateEnd },
    ],
  };
  const now = istanbulLocalToUtc('2026-11-01', '12:00');
  const visible = activeSessions(event, now);
  assert.deepEqual(visible.map((session) => session.id), ['two']);
  assert.equal(isPubliclyListed(event, now), true);
  assert.equal(isPubliclyListed(event, istanbulLocalToUtc('2026-11-02', '01:01')), false);
});

test('ticket links must be https and cannot be shorteners', () => {
  assert.equal(checkTicketUrl('http://biletix.com/e/1').ok, false);
  assert.equal(checkTicketUrl('https://bit.ly/abc').ok, false);
  const official = checkTicketUrl('https://www.biletix.com/etkinlik/pulse/1');
  assert.equal(official.ok && official.official, true);
});

test('every event submission needs a ticket link for review', () => {
  assert.equal(ticketRequired(false, 'pending'), true);
  assert.equal(ticketRequired(true, 'verified'), true);
});

test('a new account cannot publish a fourth event in a day', () => {
  const now = new Date('2026-11-02T12:00:00.000Z');
  const accountCreatedAt = new Date('2026-11-01T12:00:00.000Z').toISOString();
  const createdAt = [1, 2, 3].map((hour) => new Date(`2026-11-02T0${hour}:00:00.000Z`).toISOString());
  assert.equal(withinDailyCap({ accountCreatedAt, createdAt, now }), false);
  assert.equal(withinDailyCap({ accountCreatedAt, createdAt: createdAt.slice(0, 2), now }), true);
});

test('cancellation tells people who are going, and a postpone tells people who are interested', () => {
  assert.equal(shouldNotify('cancelled', 'going'), true);
  assert.equal(shouldNotify('cancelled', 'interested'), false);
  assert.equal(shouldNotify('postponed', 'interested'), true);
  assert.equal(shouldNotify('postponed', null), false);
});

test('disabled ticket feeds do not fetch', async () => {
  assert.equal(feedFlags.bubilet, false);
  assert.equal(feedFlags.biletix, false);
  assert.equal(feedFlags.passo, false);
  assert.equal(feedFlags.bugece, false);
  const feed = disabledFeed('bubilet', 'bubilet', false);
  assert.deepEqual(await feed.fetchEvents(), []);
});
