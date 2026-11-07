import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isCanvasJpeg } from './stripExif.ts';

test('a redrawn photo is a jpeg data url with no location sidecar', () => {
  assert.equal(isCanvasJpeg('data:image/jpeg;base64,abc'), true);
  assert.equal(isCanvasJpeg('data:image/png;base64,abc'), false);
});
