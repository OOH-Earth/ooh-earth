import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveLogisticsEvidence,
  geodesicDistanceKm,
  isValidCoordinate,
} from './logisticsEvidence.js';

test('derives geodesic separation only from two valid evidenced points', () => {
  const evidence = deriveLogisticsEvidence(
    {
      origins: {
        value: 'Italy',
        evidence_class: 'DATASET_REPORTED',
        coordinates: { lat: 41.9, lng: 12.5 },
      },
    },
    { lat: 43.8, lng: 11.2 },
  );

  assert.equal(evidence.declaredOrigin, 'Italy');
  assert.ok(evidence.distanceKm > 200 && evidence.distanceKm < 250);
  assert.equal(evidence.route, null);
  assert.equal(evidence.mode, null);
  assert.equal(evidence.factory, null);
});

test('rejects invalid coordinates and preserves unknown logistics', () => {
  assert.equal(isValidCoordinate({ lat: 91, lng: 0 }), false);
  assert.equal(geodesicDistanceKm({ lat: 41, lng: 12 }, { lat: 91, lng: 12 }), null);
  const evidence = deriveLogisticsEvidence({ origins: { value: null } }, { lat: 41, lng: 12 });
  assert.equal(evidence.distanceKm, null);
  assert.equal(evidence.declaredOrigin, null);
  assert.equal(evidence.route, null);
});
