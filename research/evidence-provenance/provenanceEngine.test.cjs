'use strict';
// Demonstrates the exact gap closed: same two-observation transition,
// classified three ways depending on what provenance is available.

const { buildProvenanceRows, classifyTimelineStep } = require('./provenanceEngine.cjs');

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

const prev = {
  id: 'obs_1',
  brand_name: 'Shell',
  parent_corp: 'Shell plc',
  campaign_name: 'Drive the Future',
  condition: 'functional',
  adbust_type: 'none',
};

console.log('=== SCENARIO 1: genuine field re-check (real-world advertiser swap) ===');
{
  const next = {
    ...prev,
    id: 'obs_2',
    brand_name: 'BP',
    parent_corp: 'BP plc',
    campaign_name: 'Possibilities Everywhere',
  };
  const provenance = buildProvenanceRows({
    targetEntity: 'FieldCheck',
    targetId: next.id,
    eventType: 'field_recheck',
    fields: {
      brand_name: {
        value: next.brand_name,
        source: 'ai',
        confidence: 0.91,
        modelVersion: 'claude_sonnet_4_6',
      },
      parent_corp: { value: next.parent_corp, source: 'registry' },
      campaign_name: {
        value: next.campaign_name,
        source: 'ai',
        confidence: 0.85,
        modelVersion: 'claude_sonnet_4_6',
      },
    },
  });
  const result = classifyTimelineStep(prev, next, provenance);
  assert(
    result.change_type === 'advertiser_replaced',
    `expected advertiser_replaced, got ${result.change_type}`,
  );
  assert(
    result.provenance_basis === 'field_recheck',
    `expected field_recheck basis, got ${result.provenance_basis}`,
  );
  console.log('PASS —', JSON.stringify(result));
}
console.log('');

console.log('=== SCENARIO 2: moderator typo fix (must NOT count as a real-world change) ===');
{
  // "Shell" was a typo for "Shell plc" formatting fix — same underlying
  // advertiser, a human just cleaned up the brand_name string.
  const next = { ...prev, id: 'obs_2', brand_name: 'Shell Global' };
  const provenance = buildProvenanceRows({
    targetEntity: 'Location',
    targetId: next.id,
    eventType: 'human_correction',
    fields: {
      brand_name: { value: next.brand_name, source: 'human', previousValue: prev.brand_name },
    },
  });
  const result = classifyTimelineStep(prev, next, provenance);
  assert(
    result.change_type === 'data_corrected',
    `expected data_corrected, got ${result.change_type}`,
  );
  assert(
    result.provenance_basis === 'human_correction',
    `expected human_correction basis, got ${result.provenance_basis}`,
  );
  console.log(
    'PASS — correctly suppressed as a data fix, not a real advertiser swap:',
    JSON.stringify(result),
  );
  console.log(
    'This exact transition (brand_name changed) would have been mislabeled "advertiser_replaced" by PR #152\'s classifyChange() — the defect the Truth Table identified.',
  );
}
console.log('');

console.log('=== SCENARIO 3: real data today (no provenance rows exist at all) ===');
{
  const next = { ...prev, id: 'obs_2', brand_name: 'BP', parent_corp: 'BP plc' };
  const result = classifyTimelineStep(prev, next, []); // <- the actual state of every Location/FieldCheck in production right now
  assert(
    result.change_type === 'ambiguous_change',
    `expected ambiguous_change, got ${result.change_type}`,
  );
  assert(
    result.provenance_basis === 'none_available',
    `expected none_available, got ${result.provenance_basis}`,
  );
  console.log(
    'PASS — honestly reports it cannot distinguish, rather than guessing:',
    JSON.stringify(result),
  );
  console.log(
    'This is the realistic case for ALL current production data: the provenance model only helps observations captured AFTER it ships. It does not retroactively improve existing history.',
  );
}
console.log('');

console.log('=== SCENARIO 4: mixed — some fields provenanced, some not ===');
{
  const next = { ...prev, id: 'obs_2', brand_name: 'BP', condition: 'neglected' };
  const provenance = buildProvenanceRows({
    targetEntity: 'FieldCheck',
    targetId: next.id,
    eventType: 'field_recheck',
    fields: { brand_name: { value: 'BP', source: 'ai', confidence: 0.7 } },
    // condition intentionally has no provenance row, simulating a partial
    // write-path rollout
  });
  const result = classifyTimelineStep(prev, next, provenance);
  assert(
    result.changed_fields.includes('condition'),
    'condition must still be listed as changed even without provenance for it',
  );
  assert(
    result.provenance_basis === 'field_recheck',
    `mixed case should still resolve via the provenanced field, got ${result.provenance_basis}`,
  );
  console.log(
    'PASS — mixed provenance resolves via whatever is available rather than failing closed:',
    JSON.stringify(result),
  );
}
console.log('');

console.log('=== VALIDATION: malformed provenance rows are rejected ===');
{
  let threw = false;
  try {
    buildProvenanceRows({
      targetEntity: 'Location',
      targetId: 'x',
      eventType: 'not_a_real_event_type',
      fields: { brand_name: { value: 'X', source: 'human' } },
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, 'invalid event_type must throw, not silently accept');

  threw = false;
  try {
    buildProvenanceRows({
      targetEntity: 'Location',
      targetId: 'x',
      eventType: 'human_correction',
      fields: { brand_name: { value: 'X', source: 'definitely_not_a_valid_source' } },
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, 'invalid source must throw, not silently accept');
  console.log(
    'PASS — schema violations fail loudly at construction time, not silently at query time',
  );
}
console.log('');

console.log('ALL PROVENANCE ENGINE ASSERTIONS PASSED');
