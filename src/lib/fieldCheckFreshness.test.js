import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChanges, computeFreshness, CONDITION_LABELS } from './fieldCheckFreshness.js';

// ---------------------------------------------------------------------------
// detectChanges — only ever compares two VERIFIED observations. Every case
// here asserts against fabrication: a change must never be reported unless
// both sides genuinely carry a value and those values genuinely differ.
// ---------------------------------------------------------------------------

test('detectChanges: null/undefined inputs produce no changes', () => {
  assert.deepEqual(detectChanges(null, { condition: 'damaged' }), []);
  assert.deepEqual(detectChanges({ condition: 'damaged' }, undefined), []);
  assert.deepEqual(detectChanges(null, null), []);
});

test('detectChanges: identical fields produce no changes', () => {
  const check = { condition: 'functional', adbust_type: 'none', brand_name: 'Acme' };
  assert.deepEqual(detectChanges(check, { ...check }), []);
});

test('detectChanges: single condition change uses CONDITION_LABELS display', () => {
  const changes = detectChanges({ condition: 'damaged' }, { condition: 'functional' });
  assert.deepEqual(changes, [
    {
      key: 'condition',
      label: 'Condition',
      before: CONDITION_LABELS.functional,
      after: CONDITION_LABELS.damaged,
    },
  ]);
});

test('detectChanges: adbust_type change strips underscores for display', () => {
  const changes = detectChanges({ adbust_type: 'painted_over' }, { adbust_type: 'none' });
  assert.deepEqual(changes, [
    { key: 'adbust_type', label: 'Intervention', before: 'none', after: 'painted over' },
  ]);
});

test('detectChanges: brand_name change is reported verbatim', () => {
  const changes = detectChanges({ brand_name: 'NewCo' }, { brand_name: 'OldCo' });
  assert.deepEqual(changes, [
    { key: 'brand_name', label: 'Brand', before: 'OldCo', after: 'NewCo' },
  ]);
});

test('detectChanges: case-only difference is not a real change', () => {
  assert.deepEqual(detectChanges({ condition: 'Functional' }, { condition: 'functional' }), []);
});

// Adversarial: it would be tempting to read "earlier had a value, latest
// doesn't mention it" as "removed" or "unset" -- but an unobserved field on
// one side is not proof of an actual transition. Must NOT fabricate a change.
test('detectChanges: field missing on latest side is never reported as a change', () => {
  const changes = detectChanges({ condition: undefined }, { condition: 'damaged' });
  assert.deepEqual(changes, []);
});

test('detectChanges: field missing on earlier side is never reported as a change', () => {
  const changes = detectChanges({ condition: 'damaged' }, { condition: undefined });
  assert.deepEqual(changes, []);
});

test('detectChanges: whitespace-only values are treated as absent, not a change', () => {
  assert.deepEqual(detectChanges({ brand_name: '   ' }, { brand_name: 'OldCo' }), []);
  assert.deepEqual(detectChanges({ brand_name: 'NewCo' }, { brand_name: '   ' }), []);
});

test('detectChanges: multiple simultaneous changes are all reported, field order preserved', () => {
  const changes = detectChanges(
    { brand_name: 'NewCo', condition: 'damaged', adbust_type: 'stickered' },
    { brand_name: 'OldCo', condition: 'functional', adbust_type: 'none' },
  );
  assert.deepEqual(
    changes.map((c) => c.key),
    ['brand_name', 'condition', 'adbust_type'],
  );
});

// ---------------------------------------------------------------------------
// computeFreshness — must never claim confirmation from evidence that isn't
// actually verified, and must always pick the most recent genuine
// confirmation, not just whichever source happens to be checked first.
// ---------------------------------------------------------------------------

test('computeFreshness: no checks, unverified location -> null (nothing confirmed)', () => {
  assert.equal(computeFreshness({ status: 'pending' }, []), null);
});

test('computeFreshness: verified location, no checks -> confirmed at intake', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-01T00:00:00Z' };
  const result = computeFreshness(location, []);
  assert.deepEqual(result, {
    lastConfirmedAt: '2026-08-01T00:00:00Z',
    source: 'report',
    pendingNewer: false,
    hasAnyCheck: false,
  });
});

test('computeFreshness: newer verified re-check supersedes intake confirmation', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-01T00:00:00Z' };
  const checks = [{ status: 'verified', created_date: '2026-08-15T00:00:00Z' }];
  const result = computeFreshness(location, checks);
  assert.equal(result.source, 'recheck');
  assert.equal(result.lastConfirmedAt, '2026-08-15T00:00:00Z');
});

test('computeFreshness: older verified re-check does not override newer intake date', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-15T00:00:00Z' };
  const checks = [{ status: 'verified', created_date: '2026-08-01T00:00:00Z' }];
  const result = computeFreshness(location, checks);
  assert.equal(result.source, 'report');
  assert.equal(result.lastConfirmedAt, '2026-08-15T00:00:00Z');
});

// Adversarial: a rejected (or pending) check must never count as
// confirmation on its own -- only a verified check or verified intake can.
test('computeFreshness: rejected-only checks on an unverified location -> null', () => {
  const location = { status: 'pending' };
  const checks = [{ status: 'rejected', created_date: '2026-08-15T00:00:00Z' }];
  assert.equal(computeFreshness(location, checks), null);
});

test('computeFreshness: pendingNewer true only when the most recent submission is pending and newer', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-01T00:00:00Z' };
  const checks = [
    { status: 'pending', created_date: '2026-08-20T00:00:00Z' },
    { status: 'verified', created_date: '2026-08-10T00:00:00Z' },
  ];
  const result = computeFreshness(location, checks);
  assert.equal(result.pendingNewer, true);
  assert.equal(result.lastConfirmedAt, '2026-08-10T00:00:00Z');
});

test('computeFreshness: pendingNewer false when the most recent submission is itself verified', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-01T00:00:00Z' };
  const checks = [{ status: 'verified', created_date: '2026-08-20T00:00:00Z' }];
  const result = computeFreshness(location, checks);
  assert.equal(result.pendingNewer, false);
});

test('computeFreshness: duplicate timestamps between intake and re-check do not throw and stay deterministic', () => {
  const location = { status: 'verified', status_updated_at: '2026-08-15T00:00:00Z' };
  const checks = [{ status: 'verified', created_date: '2026-08-15T00:00:00Z' }];
  const result = computeFreshness(location, checks);
  // Equal timestamps: the re-check is not strictly newer, so intake stays
  // the source of record rather than flip-flopping on tie.
  assert.equal(result.source, 'report');
  assert.equal(result.lastConfirmedAt, '2026-08-15T00:00:00Z');
});

test('computeFreshness: hasAnyCheck is true from raw submission count even when no check itself is verified', () => {
  // Confirmation here comes entirely from the location's own verified
  // intake, not from either check -- but a pending/rejected submission
  // still means the spot HAS been checked, which is a distinct claim from
  // "confirmed" and must not be silently dropped.
  const location = { status: 'verified', status_updated_at: '2026-08-01T00:00:00Z' };
  const checks = [
    { status: 'pending', created_date: '2026-08-20T00:00:00Z' },
    { status: 'rejected', created_date: '2026-08-10T00:00:00Z' },
  ];
  const result = computeFreshness(location, checks);
  assert.equal(result.source, 'report');
  assert.equal(result.hasAnyCheck, true);
});
