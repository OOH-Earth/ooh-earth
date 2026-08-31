import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyLocationQuality,
  geographicCoverage,
  possibleDuplicatePairs,
  validCoordinate,
} from './locationQuality.js';

const now = Date.parse('2026-08-31T12:00:00Z');
const current = new Date(now - 60_000).toISOString();

test('coordinate validation rejects malformed and out-of-range values', () => {
  assert.equal(validCoordinate({ lat: 1, lng: 2 }), true);
  assert.equal(validCoordinate({ lat: 91, lng: 2 }), false);
  assert.equal(validCoordinate({ lat: 'bad', lng: 2 }), false);
});

test('quality remains explainable and conservative', () => {
  assert.equal(
    classifyLocationQuality(
      { lat: 1, lng: 2, status: 'verified', status_updated_at: current },
      { now },
    ).quality,
    'VERIFIED',
  );
  assert.equal(
    classifyLocationQuality(
      { lat: 1, lng: 2, status: 'pending', status_updated_at: current },
      { now },
    ).quality,
    'LIKELY_VALID',
  );
  assert.equal(
    classifyLocationQuality(
      { lat: 1, lng: 2, status: 'verified', status_updated_at: '2020-01-01' },
      { now },
    ).quality,
    'STALE',
  );
  assert.equal(classifyLocationQuality({ lat: 200, lng: 2 }, { now }).quality, 'INSUFFICIENT_DATA');
});

test('duplicate intelligence only proposes bounded coordinate candidates', () => {
  assert.deepEqual(
    possibleDuplicatePairs([
      { id: 'a', lat: 1, lng: 2 },
      { id: 'b', lat: 1.0001, lng: 2.0001 },
    ]),
    [{ first: 'a', second: 'b', reason: 'coordinates within bounded proximity' }],
  );
});

test('empty geography is no evidence, not no inventory', () => {
  assert.deepEqual(geographicCoverage([]), {
    total_seen: 0,
    valid_coordinates: 0,
    verified_coordinates: 0,
    state: 'NO_EVIDENCE',
    caveat: 'NO_EVIDENCE does not prove NO INVENTORY.',
  });
});
