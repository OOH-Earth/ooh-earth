import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalLocationUrl,
  shareAvailability,
  shareLocation,
  shareLocationUrl,
} from './shareLocation.js';

test('canonical location URLs use the public domain and encode the id', () => {
  assert.equal(
    canonicalLocationUrl('location/one'),
    'https://oohearth.app/location/location%2Fone',
  );
});

test('native share receives safe public metadata only', async () => {
  let payload;
  const navigatorObject = {
    share: async (data) => {
      payload = data;
    },
  };

  const result = await shareLocation(
    {
      id: 'loc-1',
      title: 'Digital display',
      address: '1 Public Way',
      notes: 'private note',
    },
    navigatorObject,
  );

  assert.equal(result.method, 'native');
  assert.deepEqual(payload, {
    title: 'Digital display',
    text: 'Digital display — 1 Public Way',
    url: shareLocationUrl('loc-1'),
  });
  assert.equal('notes' in payload, false);
});

test('copy fallback writes only the canonical URL', async () => {
  let copied;
  const navigatorObject = {
    clipboard: { writeText: async (value) => (copied = value) },
  };

  const result = await shareLocation({ id: 'loc-2', title: 'Wall' }, navigatorObject);
  assert.equal(result.method, 'copy');
  assert.equal(copied, shareLocationUrl('loc-2'));
});

test('share delivery keeps the canonical Location identity separate', () => {
  assert.equal(
    shareLocationUrl('location/one'),
    'https://oohearth.app/api/apps/6a62213cff3ccbca88c04ff5/functions/locationShare?id=location%2Fone',
  );
  assert.equal(
    canonicalLocationUrl('location/one'),
    'https://oohearth.app/location/location%2Fone',
  );
});

test('only verified records are shareable; pending/rejected explain why', () => {
  assert.deepEqual(shareAvailability({ status: 'verified' }), { shareable: true, reason: '' });
  assert.equal(shareAvailability({ status: 'pending' }).shareable, false);
  assert.match(shareAvailability({ status: 'pending' }).reason, /after approval/i);
  assert.equal(shareAvailability({}).shareable, false);
  assert.equal(shareAvailability({ status: 'rejected' }).shareable, false);
  assert.match(shareAvailability({ status: 'rejected' }).reason, /not approved/i);
});

test('native share cancellation is not an error; real failures propagate', async () => {
  const abort = Object.assign(new Error('x'), { name: 'AbortError' });
  const cancelled = await shareLocation(
    { id: 'a' },
    {
      share: async () => {
        throw abort;
      },
    },
  );
  assert.equal(cancelled.method, 'cancelled');
  await assert.rejects(
    shareLocation(
      { id: 'a' },
      {
        share: async () => {
          throw new Error('boom');
        },
      },
    ),
  );
});

test('copy failure rejects so the UI never claims "copied"', async () => {
  await assert.rejects(
    shareLocation(
      { id: 'a' },
      {
        clipboard: {
          writeText: async () => {
            throw new Error('denied');
          },
        },
      },
    ),
  );
});
