import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildVerificationQueue,
  fieldIntelligenceRecommendations,
  findPossibleDuplicates,
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

test('malformed bounds (out-of-range lat) are rejected the same as inverted bounds', () => {
  const result = queryLocationIntelligence(
    [{ id: 'a', lat: 0, lng: 0, status: 'verified', status_updated_at: current }],
    { north: 91, south: -1, east: 1, west: -1, now },
  );
  assert.equal(result.state, 'INSUFFICIENT_DATA');
  assert.deepEqual(result.results, []);
});

test('a valid viewport with zero matching locations is EVIDENCE_PRESENT with an empty list, not INSUFFICIENT_DATA -- absence in a real query is not the same as a malformed query', () => {
  const result = queryLocationIntelligence([], { north: 1, south: -1, east: 1, west: -1, now });
  assert.equal(result.state, 'EVIDENCE_PRESENT');
  assert.deepEqual(result.results, []);
});

test('quality and status filters are explainable and exact -- no fuzzy scoring', () => {
  const locations = [
    { id: 'verified-fresh', lat: 0, lng: 0, status: 'verified', status_updated_at: current },
    { id: 'verified-old', lat: 0, lng: 0, status: 'verified', status_updated_at: old },
    { id: 'still-pending', lat: 0, lng: 0, status: 'pending', status_updated_at: current },
  ];
  const bounds = { north: 1, south: -1, east: 1, west: -1, now };
  const stale = queryLocationIntelligence(locations, { ...bounds, quality: 'STALE' });
  assert.deepEqual(
    stale.results.map((r) => r.id),
    ['verified-old'],
  );
  const pendingOnly = queryLocationIntelligence(locations, { ...bounds, status: 'pending' });
  assert.deepEqual(
    pendingOnly.results.map((r) => r.id),
    ['still-pending'],
  );
});

test('an explicit limit caps results without changing which records are eligible', () => {
  const locations = Array.from({ length: 10 }, (_, i) => ({
    id: `loc-${i}`,
    lat: 0,
    lng: 0,
    status: 'verified',
    status_updated_at: current,
  }));
  const result = queryLocationIntelligence(locations, {
    north: 1,
    south: -1,
    east: 1,
    west: -1,
    now,
    limit: 3,
  });
  assert.equal(result.results.length, 3);
});

test('repeated identical queries over frozen input are deterministic and never mutate the source', () => {
  const locations = Object.freeze([
    { id: 'b', lat: 0, lng: 0, status: 'verified', status_updated_at: current },
    { id: 'a', lat: 0.5, lng: 0, status: 'verified', status_updated_at: current },
  ]);
  const bounds = { north: 1, south: -1, east: 1, west: -1, now };
  const first = queryLocationIntelligence(locations, bounds);
  const second = queryLocationIntelligence(locations, bounds);
  assert.deepEqual(
    first.results.map((r) => r.id),
    second.results.map((r) => r.id),
  );
  assert.equal(locations.length, 2);
});

test('duplicate detection is bounded, explainable, never merges records, and excludes out-of-radius pairs', () => {
  const locations = Object.freeze([
    { id: 'b', lat: 51, lng: 0, status: 'pending' },
    { id: 'a', lat: 51.0002, lng: 0, status: 'verified' },
    { id: 'far', lat: 52, lng: 0, status: 'verified' },
    { id: 'bad', lat: 91, lng: 0 },
  ]);
  const result = findPossibleDuplicates({ maxDistanceMeters: 100, locations });
  assert.equal(result.state, 'POSSIBLE_DUPLICATES');
  assert.equal(result.radius_m, 100);
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.candidates[0].ids, ['a', 'b']);
  assert.equal(typeof result.candidates[0].distance_m, 'number');
  assert.ok(result.candidates[0].distance_m > 0 && result.candidates[0].distance_m <= 100);
  assert.match(result.candidates[0].reason, /review radius/);
  assert.match(result.candidates[0].next_action, /Review/);
  assert.equal('merged' in result.candidates[0], false);
  // 'far' (~111km away) and 'bad' (invalid coordinate) must not appear.
  const allIds = result.candidates.flatMap((c) => c.ids);
  assert.equal(allIds.includes('far'), false);
  assert.equal(allIds.includes('bad'), false);
  // Input array is never mutated by a read-only detection call.
  assert.equal(locations.length, 4);
});

test('duplicate detection reuses its own justified default radius when unset', () => {
  const result = findPossibleDuplicates({
    locations: [
      { id: 'a', lat: 51, lng: 0, status: 'verified' },
      { id: 'b', lat: 51.0001, lng: 0, status: 'verified' },
    ],
  });
  assert.equal(result.radius_m, 50);
});

test('duplicate detection returns an honest empty state for no evidence', () => {
  const result = findPossibleDuplicates({ locations: [] });
  assert.equal(result.state, 'NO_DUPLICATES_DETECTED');
  assert.deepEqual(result.candidates, []);
});

test('a single location can never be its own duplicate', () => {
  const result = findPossibleDuplicates({
    locations: [{ id: 'only', lat: 51, lng: 0, status: 'verified' }],
  });
  assert.equal(result.state, 'NO_DUPLICATES_DETECTED');
  assert.deepEqual(result.candidates, []);
});

test('duplicate candidates are capped and deterministically ordered by distance then id', () => {
  // Five locations at 0m, ~11m, ~22m, ~33m, ~44m spacing (well under the 100m radius);
  // this produces 10 candidate pairs, capped by `limit`.
  const locations = Array.from({ length: 5 }, (_, i) => ({
    id: `loc-${i}`,
    lat: 51 + i * 0.0001,
    lng: 0,
    status: 'verified',
  }));
  const result = findPossibleDuplicates({ maxDistanceMeters: 100, locations, limit: 3 });
  assert.equal(result.candidates.length, 3);
  for (let i = 1; i < result.candidates.length; i++) {
    const prev = result.candidates[i - 1];
    const curr = result.candidates[i];
    assert.ok(
      prev.distance_m < curr.distance_m ||
        (prev.distance_m === curr.distance_m &&
          prev.ids.join(':').localeCompare(curr.ids.join(':')) <= 0),
    );
  }
  // Re-running is deterministic: identical input yields identical output.
  const rerun = findPossibleDuplicates({ maxDistanceMeters: 100, locations, limit: 3 });
  assert.deepEqual(result.candidates, rerun.candidates);
});
