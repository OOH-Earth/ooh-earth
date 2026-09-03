import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalLocationUrl, shareLocation } from './shareLocation.js';

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
    url: 'https://oohearth.app/location/loc-1',
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
  assert.equal(copied, 'https://oohearth.app/location/loc-2');
});
