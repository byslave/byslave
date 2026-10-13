import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isAtLeastAge, isRealDate } from './age.ts';

const now = new Date(2026, 9, 13);

test('rejects impossible calendar dates', () => {
  assert.equal(isRealDate(2026, 2, 31), false);
  assert.equal(isAtLeastAge(2026, 2, 31, now, 18), false);
});

test('requires a full 18 years', () => {
  assert.equal(isAtLeastAge(2008, 10, 13, now, 18), true);
  assert.equal(isAtLeastAge(2008, 10, 14, now, 18), false);
  assert.equal(isAtLeastAge(2010, 1, 1, now, 18), false);
});
