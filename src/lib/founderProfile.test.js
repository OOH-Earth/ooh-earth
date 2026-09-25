import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOCUS_AREAS,
  focusAreaLabel,
  normalizeHandle,
  isValidHandle,
  initialsFrom,
  MAX_FOCUS_AREAS,
} from './founderProfile.js';

test('FOCUS_AREAS is a small, non-empty, deduplicated taxonomy', () => {
  assert.ok(FOCUS_AREAS.length > 0 && FOCUS_AREAS.length <= 12);
  assert.equal(new Set(FOCUS_AREAS).size, FOCUS_AREAS.length);
});

test('focusAreaLabel falls back to the raw value for an unknown key', () => {
  assert.equal(focusAreaLabel('mapping'), 'Mapping');
  assert.equal(focusAreaLabel('made_up'), 'made_up');
});

test('normalizeHandle trims and strips a leading @, but never collapses internal characters', () => {
  assert.equal(normalizeHandle('@ghostsignal'), 'ghostsignal');
  assert.equal(normalizeHandle('  ghostsignal '), 'ghostsignal');
  // An internal space must survive normalization so isValidHandle can
  // correctly reject it -- silently collapsing it would let a value like
  // 'has a space' pass validation as 'hasaspace'.
  assert.equal(normalizeHandle('  ghost signal '), 'ghost signal');
  assert.equal(normalizeHandle(''), '');
});

test('isValidHandle accepts URL-safe handles and rejects unsafe ones', () => {
  assert.equal(isValidHandle('ghost-signal_99'), true);
  assert.equal(isValidHandle('a'), false); // too short
  assert.equal(isValidHandle('has a space'), false);
  assert.equal(isValidHandle('has/slash'), false);
  assert.equal(isValidHandle(''), false);
});

test('initialsFrom prefers the display name, falls back to handle, then ?', () => {
  assert.equal(initialsFrom('Ghost Signal', 'ghostsignal'), 'GS');
  assert.equal(initialsFrom('', 'ghostsignal'), 'GH');
  assert.equal(initialsFrom('', ''), '?');
  assert.equal(initialsFrom('Cher', ''), 'CH');
});

test('MAX_FOCUS_AREAS is a small, sane cap', () => {
  assert.ok(MAX_FOCUS_AREAS >= 1 && MAX_FOCUS_AREAS <= FOCUS_AREAS.length);
});
