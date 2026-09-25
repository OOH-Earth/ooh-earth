import test from 'node:test';
import assert from 'node:assert/strict';
import { contextEvidenceFor, DEMO_LOCATION_ID } from './locationContextEvidence.js';
import { isSafeSourceUrl } from './contextSourceRegistry.js';

test('controlled fixture exposes attributable evidence states without network access', () => {
  const evidence = contextEvidenceFor(DEMO_LOCATION_ID);
  assert.equal(evidence.length, 3);
  assert.deepEqual(
    evidence.map((item) => item.evidence_status),
    ['OBSERVED', 'DERIVED', 'UNKNOWN'],
  );
  assert.equal(evidence[1].distance_m, 0);
  assert.match(evidence[1].method, /Distance/);
  assert.equal(evidence[0].attribution, 'OOH Earth');
});

test('unknown Locations use the intentional unavailable state', () => {
  assert.deepEqual(contextEvidenceFor('not-a-fixture'), []);
});

test('source links accept HTTPS only', () => {
  assert.equal(isSafeSourceUrl('https://example.com/source'), true);
  assert.equal(isSafeSourceUrl('http://example.com/source'), false);
  assert.equal(isSafeSourceUrl('javascript:alert(1)'), false);
  assert.equal(isSafeSourceUrl('not a URL'), false);
});
