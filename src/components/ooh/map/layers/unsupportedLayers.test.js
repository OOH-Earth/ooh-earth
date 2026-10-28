import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNSUPPORTED_LAYER_IDS,
  isUnsupportedLayer,
  withoutUnsupportedLayers,
} from './unsupportedLayers.js';

test('the three AI-generated layers are unsupported; sourced/static layers are not', () => {
  assert.deepEqual([...UNSUPPORTED_LAYER_IDS].sort(), ['flora', 'mushrooms', 'war']);
  for (const id of ['ads', 'adbusting', 'graffiti', 'rivers', 'radio', 'heat', 'mine']) {
    assert.equal(isUnsupportedLayer(id), false, id);
  }
});

test('persisted selections drop removed layers and keep the rest in order', () => {
  assert.deepEqual(withoutUnsupportedLayers(['ads', 'war', 'rivers', 'flora', 'mushrooms']), [
    'ads',
    'rivers',
  ]);
  assert.deepEqual(withoutUnsupportedLayers([]), []);
  assert.equal(withoutUnsupportedLayers(undefined), undefined);
});
