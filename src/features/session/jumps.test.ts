import assert from 'node:assert/strict';
import { test } from 'node:test';

import { acceptJumps } from './jumps.ts';

test('the sample night stays inside a human cap', () => {
  const result = acceptJumps({ jumps: 1248, minutes: 138 });
  assert.equal(result.accepted, true);
  assert.equal(result.jumps, 1248);
});

test('a burst past the 15 minute ceiling is rejected', () => {
  const result = acceptJumps({ jumps: 900, minutes: 15 });
  assert.deepEqual(result, { accepted: false, jumps: 0 });
});

test('negative or empty recordings are rejected', () => {
  assert.equal(acceptJumps({ jumps: -1, minutes: 40 }).accepted, false);
  assert.equal(acceptJumps({ jumps: 10, minutes: 0 }).accepted, false);
  assert.equal(acceptJumps({ jumps: Number.NaN, minutes: 20 }).accepted, false);
});
