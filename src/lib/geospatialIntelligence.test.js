import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildVerificationQueue,
  fieldIntelligenceRecommendations,
  profileGeospatialEvidence,
  queryLocationIntelligence,
} from './geospatialIntelligence.js';

const now = Date.parse('2026-08-31T12:00:00Z');
const current = new Date(now - 60_000).toISOString();
const old = '2020-01-01T00:00:00Z';

test('profile is bounded and distinguishes invalid, verified, stale, and unverified evidence', () => {
  const result = profileGeospatialEvidence({
    now,
    locations: [
      { id: 'verified', lat: 1, lng: 2, status: 'verified', status_updated_at: current },
      { id: 'stale', lat: 1, lng: 2, status: 'verified', status_updated_at: old },
      { id: 'pending', lat: 1, lng: 2, status: 'pending', status_updated_at: current },
      { id: 'bad', lat: 200, lng: 2 },
    ],
    fieldChecks: [{ location_id: 'verified' }],
  });
  assert.deepEqual(result, {
    locations_seen: 4,
    field_checks_seen: 1,
    valid_coordinates: 3,
    invalid_coordinates: 1,
    verified_locations: 1,
    stale_locations: 1,
    never_verified_locations: 1,
    locations_with_field_checks: 1,
    evidence_state: 'EVIDENCE_PRESENT',
    caveat: 'NO_EVIDENCE does not prove NO INVENTORY.',
  });
});

test('verification queue explains next action and excludes rejected records', () => {
  const result = buildVerificationQueue({
    now,
    locations: [
      { id: 'b', lat: 1, lng: 2, status: 'pending', status_updated_at: current },
      { id: 'a', lat: 1, lng: 2, status: 'verified', status_updated_at: old },
      { id: 'x', lat: 1, lng: 2, status: 'rejected', status_updated_at: current },
    ],
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'a');
  assert.match(result[0].reasons.join(' '), /stale/);
  assert.equal(result[1].next_action, 'Perform a bounded field verification.');
});

test('viewport query supports dateline crossing and returns safe projections only', () => {
  const result = queryLocationIntelligence(
    [
      {
        id: 'east',
        lat: 0,
        lng: 179.5,
        status: 'verified',
        status_updated_at: current,
        address: 'private',
      },
      { id: 'west', lat: 0, lng: -179.5, status: 'verified', status_updated_at: current },
      { id: 'outside', lat: 0, lng: 0, status: 'verified', status_updated_at: current },
    ],
    { north: 1, south: -1, east: -179, west: 179, now },
  );
  assert.deepEqual(
    result.results.map((item) => item.id),
    ['east', 'west'],
  );
  assert.equal('address' in result.results[0], false);
});

test('invalid viewport and empty evidence fail conservatively', () => {
  assert.equal(
    queryLocationIntelligence([], { north: 1, south: 2, east: 3, west: 4 }).state,
    'INSUFFICIENT_DATA',
  );
  const profile = profileGeospatialEvidence({ locations: [] });
  assert.equal(profile.evidence_state, 'NO_EVIDENCE');
  assert.match(fieldIntelligenceRecommendations(profile)[0].action, /approved bounded inventory/);
});
