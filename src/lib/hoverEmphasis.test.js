import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOVER_RING_NONE,
  resolveHoverRingTarget,
  resolveRowEmphasis,
  parseChannelColor,
} from './hoverEmphasis.js';

test('hover ring targets the hovered marker', () => {
  assert.equal(resolveHoverRingTarget({ hoverId: 'loc-1', selectedId: null }), 'loc-1');
  assert.equal(resolveHoverRingTarget({ hoverId: 'loc-1', selectedId: 'loc-2' }), 'loc-1');
});

test('hover ring clears when nothing is hovered', () => {
  assert.equal(resolveHoverRingTarget({ hoverId: null, selectedId: null }), HOVER_RING_NONE);
  assert.equal(
    resolveHoverRingTarget({ hoverId: undefined, selectedId: 'loc-2' }),
    HOVER_RING_NONE,
  );
});

test('hover ring defers to selection -- a selected marker never re-shows its own hover ring', () => {
  assert.equal(resolveHoverRingTarget({ hoverId: 'loc-1', selectedId: 'loc-1' }), HOVER_RING_NONE);
});

test('row emphasis: selected always wins over hover/focus', () => {
  assert.equal(resolveRowEmphasis({ selected: true, isEmphasized: true }), 'selected');
  assert.equal(resolveRowEmphasis({ selected: true, isEmphasized: false }), 'selected');
});

test('row emphasis: hover/focus shows when not selected', () => {
  assert.equal(resolveRowEmphasis({ selected: false, isEmphasized: true }), 'emphasized');
});

test('row emphasis: idle when neither selected nor emphasized', () => {
  assert.equal(resolveRowEmphasis({ selected: false, isEmphasized: false }), 'idle');
});

test('parseChannelColor converts a space-separated token to rgb()', () => {
  assert.equal(parseChannelColor('255 0 200'), 'rgb(255,0,200)');
});

test('parseChannelColor trims whitespace from a live CSS custom property read', () => {
  assert.equal(parseChannelColor('  255   92   0  '), 'rgb(255,92,0)');
});

test('parseChannelColor falls back when the token is unset (e.g. no stylesheet loaded)', () => {
  assert.equal(parseChannelColor(''), 'rgb(255,92,0)');
  assert.equal(parseChannelColor(null), 'rgb(255,92,0)');
  assert.equal(parseChannelColor(undefined, '10 20 30'), 'rgb(10,20,30)');
});
