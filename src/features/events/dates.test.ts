import assert from 'node:assert/strict';
import { test } from 'node:test';

import { eventMatchesDate, weekendDates } from './dates.ts';

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
