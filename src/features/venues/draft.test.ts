import assert from 'node:assert/strict';
import { test } from 'node:test';

import { venueDraftSchema } from './draft.ts';

test('accepts a venue suggestion with a short name and district', () => {
  const parsed = venueDraftSchema.safeParse({
    name: '  Arka Kapı  ',
    district: 'Kadıköy',
    type: 'club',
    rules: '18+',
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.name, 'Arka Kapı');
    assert.equal(parsed.data.type, 'club');
  }
});

test('rejects a one-character name', () => {
  const parsed = venueDraftSchema.safeParse({
    name: 'A',
    district: 'Kadıköy',
    type: 'warehouse',
    rules: '',
  });
  assert.equal(parsed.success, false);
});
