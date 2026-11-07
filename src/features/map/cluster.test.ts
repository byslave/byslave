import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clusterPins, type MapPin } from './cluster.ts';

const pins: MapPin[] = [
  { id: 'a', lng: 29.02, lat: 41.11, label: 'A', count: 10 },
  { id: 'b', lng: 29.03, lat: 41.12, label: 'B', count: 5 },
  { id: 'c', lng: 27.14, lat: 38.43, label: 'C', count: 7 },
];

test('keeps pins separate when zoomed in', () => {
  const groups = clusterPins(pins, 12);
  assert.equal(groups.length, 3);
  assert.equal(
    groups.reduce((sum, group) => sum + group.count, 0),
    22,
  );
});

test('sums nearby pins when zoomed out and leaves distant pins alone', () => {
  const groups = clusterPins(pins, 8);
  const counts = groups.map((group) => group.count).sort((a, b) => a - b);
  assert.deepEqual(counts, [7, 15]);
});
