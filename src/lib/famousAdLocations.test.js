import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMOUS_AD_LOCATION_REGISTRY,
  famousAdEvidenceFor,
  distanceInMeters,
} from './famousAdLocations.js';

const piccadilly = { id: 'fixture', lat: 51.51, lng: -0.13444 };

test('matches the reviewed Piccadilly record with derived NEAR semantics', () => {
  const evidence = famousAdEvidenceFor(piccadilly);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].relationship, 'NEAR');
  assert.equal(evidence[0].evidence_status, 'REPORTED');
  assert.equal(evidence[0].distance_m, 0);
  assert.equal(evidence[0].source_id, 'piccadilly-lights-official');
  assert.match(evidence[0].method, /derived/i);
});

test('does not match outside the reviewed radius or invalid coordinates', () => {
  assert.deepEqual(famousAdEvidenceFor({ lat: 51.52, lng: -0.13444 }), []);
  assert.deepEqual(famousAdEvidenceFor({ lat: 91, lng: -0.13444 }), []);
  assert.deepEqual(famousAdEvidenceFor({ lat: 51.51, lng: 'not-a-number' }), []);
});

test('distance calculation is deterministic and bounded', () => {
  assert.equal(distanceInMeters(51.51, -0.13444, 51.51, -0.13444), 0);
  assert.ok(distanceInMeters(51.51, -0.13444, 51.52, -0.13444) > 1000);
  assert.ok(FAMOUS_AD_LOCATION_REGISTRY[0].match_radius_m <= 500);
});

test('curated evidence retains provenance and does not include media', () => {
  const [evidence] = famousAdEvidenceFor(piccadilly);
  assert.equal(evidence.license, 'Factual metadata only; no third-party media reused');
  assert.match(evidence.source_url, /^https:\/\//);
  assert.equal('image_url' in evidence, false);
  assert.equal('notes' in evidence, false);
});
