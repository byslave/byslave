import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { searchPlaces, type DirectoryPlace } from './search.ts';

const places = JSON.parse(
  readFileSync(new URL('../../data/venueDirectory.json', import.meta.url), 'utf8'),
) as DirectoryPlace[];

test('klein phoenix resolves to Maslak, north of the Bosphorus', () => {
  const hits = searchPlaces(places, 'klein phoenix', 'istanbul');
  assert.equal(hits[0]?.name, 'Klein Phönix');
  assert.equal(hits[0]?.district, 'Maslak');
  assert.match(hits[0]?.street ?? '', /52\. Sokak/);
  assert.ok(hits[0] && hits[0].lat > 41.11);
  assert.ok(hits[0] && hits[0].lng > 29.01);
});

test('a short klein query still prefers the Maslak club', () => {
  const hits = searchPlaces(places, 'klein', 'istanbul');
  assert.equal(hits[0]?.district, 'Maslak');
});
