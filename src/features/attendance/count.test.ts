import assert from 'node:assert/strict';
import { test } from 'node:test';

import { confirmedCount } from './count.ts';

test('only going and checked in increase the public count', () => {
  assert.equal(confirmedCount(184, null), 184);
  assert.equal(confirmedCount(184, 'interested'), 184);
  assert.equal(confirmedCount(184, 'left'), 184);
  assert.equal(confirmedCount(184, 'going'), 185);
  assert.equal(confirmedCount(184, 'checked_in'), 185);
});
