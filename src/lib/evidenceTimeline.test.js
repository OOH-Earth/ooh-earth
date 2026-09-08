import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEvidenceTimeline } from './evidenceTimeline.js';

const old = '2020-01-01T00:00:00.000Z';
const recent = '2026-09-08T00:00:00.000Z';

test('empty and unknown dates remain honest', () => {
  const result = buildEvidenceTimeline({
    location: { id: 'x', status: 'verified' },
    now: Date.parse(recent),
  });
  assert.equal(result.evidence_state, 'EVIDENCE_PRESENT');
  assert.equal(result.events[0].kind, 'LOCATION_CREATED');
  assert.equal(result.events[0].freshness, 'UNKNOWN');
  assert.equal(result.events[0].at, null);
});

test('field checks and moderated photos are chronological and bounded', () => {
  const result = buildEvidenceTimeline({
    location: { id: 'x', created_date: old, status: 'verified', status_updated_at: recent },
    fieldChecks: [
      { id: 'old-check', status: 'verified', created_date: old },
      { id: 'new-check', status: 'pending', created_date: recent },
    ],
    locationPhotos: [
      { id: 'private', status: 'pending', url: 'private.jpg', created_date: recent },
      { id: 'photo', status: 'verified', url: 'public.jpg', created_date: old },
    ],
    now: Date.parse(recent),
    cap: 2,
  });
  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].kind, 'FIELD_CHECK');
  assert.equal(
    result.events.some((item) => item.id === 'private'),
    false,
  );
  assert.equal(
    result.events.some((item) => item.id === 'photo'),
    false,
  );
});

test('only two comparable verified checks can establish a change', () => {
  const result = buildEvidenceTimeline({
    location: { id: 'x', created_date: old },
    fieldChecks: [
      {
        id: 'new',
        status: 'verified',
        created_date: recent,
        brand_name: 'New Brand',
        condition: 'functional',
      },
      {
        id: 'old',
        status: 'verified',
        created_date: old,
        brand_name: 'Old Brand',
        condition: 'functional',
      },
    ],
  });
  assert.deepEqual(
    result.changes.map((change) => change.key),
    ['brand_name'],
  );
});

test('format-only values and missing previous values do not become changes', () => {
  const result = buildEvidenceTimeline({
    fieldChecks: [
      { id: 'new', status: 'verified', created_date: recent, brand_name: ' Brand ' },
      {
        id: 'old',
        status: 'verified',
        created_date: old,
        brand_name: 'brand',
        condition: 'functional',
      },
    ],
  });
  assert.deepEqual(result.changes, []);
});
