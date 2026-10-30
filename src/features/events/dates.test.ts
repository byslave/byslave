import assert from 'node:assert/strict';
import { test } from 'node:test';

import { eventMatchesDate, isInCurrentWeek, nearestEventDate, weekendDates } from './dates.ts';

test('Tuesday points the weekend at the coming Saturday and Sunday', () => {
  const tuesday = new Date(2026, 9, 13);
  assert.deepEqual(weekendDates(tuesday), ['2026-10-17', '2026-10-18']);
  assert.equal(eventMatchesDate('2026-10-17', { kind: 'weekend' }, tuesday), true);
  assert.equal(eventMatchesDate('2026-10-13', { kind: 'weekend' }, tuesday), false);
  assert.equal(eventMatchesDate('2026-10-13', { kind: 'tonight' }, tuesday), true);
});

test('Sunday weekend is that Sunday', () => {
  const sunday = new Date(2026, 9, 18);
  assert.deepEqual(weekendDates(sunday), ['2026-10-18']);
});

test('nearest night is the next listed date, or the latest if all have passed', () => {
  const friday = new Date(2026, 9, 30);
  assert.equal(nearestEventDate(['2026-10-17', '2026-10-18'], friday), '2026-10-18');
  assert.equal(nearestEventDate(['2026-11-02', '2026-10-31'], friday), '2026-10-31');
  assert.equal(nearestEventDate([], friday), null);
});

test('a night from mid-October is outside the week of 30 October', () => {
  const friday = new Date(2026, 9, 30);
  assert.equal(isInCurrentWeek('2026-10-17', friday), false);
  assert.equal(isInCurrentWeek('2026-10-30', friday), true);
  assert.equal(isInCurrentWeek('2026-10-26', friday), true);
});
