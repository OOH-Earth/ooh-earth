import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_SPACE_TYPES,
  isPublicSpaceType,
  SETTING_OPTIONS,
  PUBLIC_ACCESS_OPTIONS,
  settingLabel,
  publicAccessLabel,
  RELATIONSHIP_TYPES,
  relationshipTypeLabel,
} from './publicSpace.js';

// ---------------------------------------------------------------------------
// Test 1/2/3 (mission spec): skatepark + basketball court can be
// represented; unknown/unset facility values safely fall back.
// ---------------------------------------------------------------------------

test('isPublicSpaceType recognizes all three minimum facility types', () => {
  assert.equal(isPublicSpaceType('skatepark'), true);
  assert.equal(isPublicSpaceType('basketball_court'), true);
  assert.equal(isPublicSpaceType('multi_use_court'), true);
});

test('isPublicSpaceType is false for existing OOH ad-surface types and unset values', () => {
  assert.equal(isPublicSpaceType('billboard'), false);
  assert.equal(isPublicSpaceType('other'), false);
  assert.equal(isPublicSpaceType(undefined), false);
  assert.equal(isPublicSpaceType(null), false);
  assert.equal(isPublicSpaceType(''), false);
});

test('PUBLIC_SPACE_TYPES exposes exactly the minimum required set (extensible, not closed)', () => {
  assert.deepEqual(PUBLIC_SPACE_TYPES, ['skatepark', 'basketball_court', 'multi_use_court']);
});

test('settingLabel/publicAccessLabel fall back to Unknown for unset/unrecognized values', () => {
  assert.equal(settingLabel(undefined), 'Unknown');
  assert.equal(settingLabel(null), 'Unknown');
  assert.equal(settingLabel('bogus'), 'Unknown');
  assert.equal(settingLabel('outdoor'), 'Outdoor');
  assert.equal(publicAccessLabel(undefined), 'Unknown');
  assert.equal(publicAccessLabel('bogus'), 'Unknown');
  assert.equal(publicAccessLabel('free'), 'Free');
});

test('setting/public_access option lists both default to an explicit Unknown entry', () => {
  assert.equal(SETTING_OPTIONS[0].value, 'unknown');
  assert.equal(PUBLIC_ACCESS_OPTIONS[0].value, 'unknown');
});

// ---------------------------------------------------------------------------
// Test 4/5 (mission spec): a visible logo alone never implies sponsorship —
// 'unknown' is the only safe default relationship type, and every other
// value requires evidence + moderator verification (enforced by
// LocationRelationship.jsonc's status RLS, exercised in the e2e suite;
// here we just prove the label/type list itself defaults safely).
// ---------------------------------------------------------------------------

test('RELATIONSHIP_TYPES leads with unknown and never implies a claim by default', () => {
  assert.equal(RELATIONSHIP_TYPES[0], 'unknown');
  assert.ok(RELATIONSHIP_TYPES.includes('sponsor'));
  assert.ok(RELATIONSHIP_TYPES.includes('funder'));
});

test('relationshipTypeLabel falls back to Unknown for unset/unrecognized values', () => {
  assert.equal(relationshipTypeLabel(undefined), 'Unknown');
  assert.equal(relationshipTypeLabel('bogus'), 'Unknown');
  assert.equal(relationshipTypeLabel('sponsor'), 'Sponsor');
  assert.equal(relationshipTypeLabel('community_partner'), 'Community Partner');
});
