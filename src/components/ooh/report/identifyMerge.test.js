import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeDetection } from './identifyMerge.js';

const form = (o = {}) => ({
  brand_name: '',
  campaign_name: '',
  industry_sector: '',
  parent_corp: '',
  ...o,
});
const detected = {
  brand_name: 'Shell',
  campaign_name: 'Drive',
  industry_sector: 'fossil_fuel',
  parent_corp: 'Shell plc',
};

test('fills untouched fields and marks the form as AI scanned', () => {
  const patch = mergeDetection({ snapshot: form(), current: form(), detected });
  assert.deepEqual(patch, { ai_scanned: true, ...detected });
});
test('keeps a field the person edited while the scan ran', () => {
  const patch = mergeDetection({
    snapshot: form(),
    current: form({ campaign_name: 'My own tagline' }),
    detected,
  });
  assert.equal(patch.campaign_name, undefined);
  assert.equal(patch.brand_name, 'Shell');
});
test('a re-scan refreshes fields that are unchanged since it started', () => {
  const before = form({ brand_name: 'Old', parent_corp: 'Old plc' });
  const patch = mergeDetection({ snapshot: before, current: before, detected });
  assert.equal(patch.brand_name, 'Shell');
  assert.equal(patch.parent_corp, 'Shell plc');
});
test('ignores Unknown brand, empty and non-string values', () => {
  const patch = mergeDetection({
    snapshot: form({ brand_name: 'Mine' }),
    current: form({ brand_name: 'Mine' }),
    detected: { brand_name: 'Unknown', campaign_name: '', industry_sector: 5, parent_corp: null },
  });
  assert.deepEqual(patch, { ai_scanned: true });
});
