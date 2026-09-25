import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionMatchesFilter, MAP_ATTENTION_FILTERS } from './mapAttention.js';

const high = {
  priority: 'HIGH',
  verification_state: 'PENDING',
  field_evidence: 'STALE',
  photo_state: 'MISSING',
};
const current = {
  priority: 'CURRENT',
  verification_state: 'VERIFIED',
  field_evidence: 'FRESH',
  photo_state: 'FRESH',
};

test('map attention filters reuse deterministic queue states', () => {
  assert.equal(attentionMatchesFilter(high, MAP_ATTENTION_FILTERS.NEEDS_ATTENTION), true);
  assert.equal(attentionMatchesFilter(high, MAP_ATTENTION_FILTERS.PENDING), true);
  assert.equal(attentionMatchesFilter(high, MAP_ATTENTION_FILTERS.STALE), true);
  assert.equal(attentionMatchesFilter(high, MAP_ATTENTION_FILTERS.MISSING_PHOTOS), true);
  assert.equal(attentionMatchesFilter(current, MAP_ATTENTION_FILTERS.CURRENT), true);
  assert.equal(attentionMatchesFilter(current, MAP_ATTENTION_FILTERS.NEEDS_ATTENTION), false);
});

test('missing attention metadata is fail-closed for filtered maps', () => {
  assert.equal(attentionMatchesFilter(null, MAP_ATTENTION_FILTERS.NEEDS_ATTENTION), false);
  assert.equal(attentionMatchesFilter(null, MAP_ATTENTION_FILTERS.ALL), false);
});
