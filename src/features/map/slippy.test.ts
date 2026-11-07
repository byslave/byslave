import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lngLatToWorld, screenPoint, visibleTiles, worldToLngLat } from './slippy.ts';

test('round-trips a venue coordinate through web mercator', () => {
  const zoom = 12;
  const world = lngLatToWorld(29.0204, 41.1128, zoom);
  const back = worldToLngLat(world.x, world.y, zoom);
  assert.ok(Math.abs(back.lng - 29.0204) < 1e-8);
  assert.ok(Math.abs(back.lat - 41.1128) < 1e-8);
});

test('keeps the map center in the middle of the viewport', () => {
  const center = { lng: 29.005, lat: 41.045 };
  const point = screenPoint(center, center, 11.55, 430, 800);
  assert.ok(Math.abs(point.x - 215) < 0.01);
  assert.ok(Math.abs(point.y - 400) < 0.01);
});

test('asks for a small set of dark tiles around Istanbul', () => {
  const tiles = visibleTiles({ lng: 29.005, lat: 41.045 }, 11.55, 430, 800);
  assert.ok(tiles.length > 4);
  assert.ok(tiles.length < 40);
  assert.ok(tiles.every((tile) => tile.z === 12 && tile.x >= 0 && tile.y >= 0));
});
