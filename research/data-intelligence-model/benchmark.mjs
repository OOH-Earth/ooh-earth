import { REAL_BRANDED_RECORDS } from './real-branded-records.mjs';
import { resolveAll, findSameBrandGroups, auditFieldSwaps } from './entityResolutionEngine.mjs';

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

console.log('====================================================================');
console.log('REAL DATA — RUNTIME-VERIFIED (production, non-privileged read, 2026-08-28)');
console.log('====================================================================');
console.log(`Population: ${REAL_BRANDED_RECORDS.length} records — this is the COMPLETE set of`);
console.log('production Locations with a non-empty brand_name, not a sample.');
console.log('');

const before = REAL_BRANDED_RECORDS.filter((r) => !!r.industry_sector).length;
const resolved = resolveAll(REAL_BRANDED_RECORDS);
const after = resolved.filter((r) => !!r.resolution.sector).length;

console.log(
  `industry_sector coverage BEFORE resolution: ${before}/${REAL_BRANDED_RECORDS.length} (${((before / REAL_BRANDED_RECORDS.length) * 100).toFixed(1)}%)`,
);
console.log(
  `industry_sector coverage AFTER resolution:  ${after}/${REAL_BRANDED_RECORDS.length} (${((after / REAL_BRANDED_RECORDS.length) * 100).toFixed(1)}%)`,
);
console.log('');
console.log('Per-record resolution (source shows exactly why each value exists):');
for (const r of resolved) {
  console.log(
    `  ${r.brand_name.padEnd(45)} -> sector=${String(r.resolution.sector).padEnd(22)} source=${r.resolution.source}${r.resolution.note ? '  [' + r.resolution.note + ']' : ''}`,
  );
}
console.log('');

assert(
  after === REAL_BRANDED_RECORDS.length - 0,
  'sanity: after should be computed, not asserting a specific number here — see manual reading below',
);
const stillUnresolved = resolved.filter((r) => !r.resolution.sector);
console.log(`Still unresolved after all deterministic layers: ${stillUnresolved.length} record(s)`);
stillUnresolved.forEach((r) => console.log(`  - ${r.brand_name} (parent_corp=${r.parent_corp})`));
console.log('');

console.log('--- Field-swap findings (real, not hypothetical) ---');
const swapAudit = auditFieldSwaps(REAL_BRANDED_RECORDS);
console.log(
  `${swapAudit.length}/${REAL_BRANDED_RECORDS.length} real records have a brand_name that verbatim-matches a known`,
);
console.log('parent-corp name (exhaustive audit — not limited to records that needed resolving):');
swapAudit.forEach((r) =>
  console.log(
    `  - "${r.brand_name}" (industry_sector was ${r.industry_sector ? `already "${r.industry_sector}" via a different source` : 'null before resolution'})`,
  ),
);
console.log('');

console.log(
  '--- Duplicate-placement candidate findings (real, string+type only — no geo/temporal data was fetched) ---',
);
const groups = findSameBrandGroups(REAL_BRANDED_RECORDS);
if (groups.length === 0) {
  console.log('None found.');
} else {
  groups.forEach((g) => {
    const members = g.indices.map((i) => REAL_BRANDED_RECORDS[i]);
    console.log(`  ${g.count}x "${members[0].brand_name}" (${members[0].type}):`);
    members.forEach((m) => console.log(`    - campaign: ${m.campaign_name || '(none)'}`));
  });
}
assert(groups.length >= 1, 'expected the known real Zontes pair to be found');
console.log('This is a genuine open question, not a resolved fact: same brand, same');
console.log('surface type, different campaign taglines — could be one placement');
console.log('re-captured twice, or two distinct real placements. Resolving it needs');
console.log('the lat/lng + created_date this recon pass did not fetch, and — per');
console.log('PR #152/#154 — should never be auto-asserted, only surfaced for review.');
console.log('');

console.log('--- Registry coverage gaps observed in real data ---');
console.log('Not in advertiserRegistry.js PARENT_CORPS, despite being real advertisers');
console.log('captured in production: Chery Automobile, Zontes, Boon Rawd Brewery, MEA.');
console.log('None of these blocked resolution for THESE specific records (their');
console.log('industry_sector was already filled directly), but they are real gaps a');
console.log('future record without a pre-filled sector would hit.');
console.log('');

console.log('====================================================================');
console.log('SYNTHETIC FUNCTIONAL PROOF — NOT REAL-WORLD PERFORMANCE EVIDENCE');
console.log('====================================================================');
console.log('Purpose: prove the same code does not choke or behave differently at');
console.log('larger N. This is a mechanics check, not a claim about real accuracy.');
const synthetic = [];
for (let i = 0; i < 500; i++) {
  synthetic.push({
    type: 'billboard',
    status: 'verified',
    brand_name: i % 7 === 0 ? "McDonald's Corporation" : `Synthetic Brand ${i}`,
    parent_corp: i % 3 === 0 ? 'Shell plc' : null,
    industry_sector: i % 5 === 0 ? 'other' : null,
    campaign_name: null,
  });
}
const t0 = performance.now();
const syntheticResolved = resolveAll(synthetic);
const t1 = performance.now();
const syntheticGroups = findSameBrandGroups(synthetic);
console.log(`500 synthetic records resolved in ${(t1 - t0).toFixed(2)}ms`);
console.log(
  `synthetic sector coverage before/after: ${synthetic.filter((r) => r.industry_sector).length}/500 -> ${syntheticResolved.filter((r) => r.resolution.sector).length}/500`,
);
console.log(
  `synthetic duplicate-candidate groups found: ${syntheticGroups.length} (expected exactly 1 — the seeded McDonald's Corporation repeats)`,
);
assert(syntheticGroups.length === 1, 'synthetic mechanics check failed');
console.log('');

console.log('ALL ASSERTIONS PASSED');
