import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('default map document uses Esri dark gray tiles and keeps MapLibre for Mapbox', () => {
  const source = readFileSync(new URL('./mapDocument.ts', import.meta.url), 'utf8');
  assert.match(source, /World_Dark_Gray_Base/);
  assert.match(source, /api\.mapbox\.com/);
  assert.match(source, /slippyRuntime/);
  const raster = source.slice(source.indexOf('function rasterDocument'), source.indexOf('function mapboxDocument'));
  assert.doesNotMatch(raster, /maplibregl/);
});
