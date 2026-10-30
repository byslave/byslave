import assert from 'node:assert/strict';
import { test } from 'node:test';

import { visiblePrivacy } from './privacy.ts';

test('a local account uses the chosen mode, defaulting to friends', () => {
  assert.equal(
    visiblePrivacy({ privacy: 'friends', privacyOnServer: false, userId: 'local-1', serverConfigured: false }),
    'friends',
  );
});

test('a server account stays in ghost until the choice is saved', () => {
  assert.equal(
    visiblePrivacy({
      privacy: 'public',
      privacyOnServer: false,
      userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      serverConfigured: true,
    }),
    'ghost',
  );
  assert.equal(
    visiblePrivacy({
      privacy: 'public',
      privacyOnServer: true,
      userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      serverConfigured: true,
    }),
    'public',
  );
});
