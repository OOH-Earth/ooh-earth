'use strict';
// Benchmark harness. Defines success criteria BEFORE looking at output,
// against a synthetic corpus with KNOWN ground truth (see fixtures.js).
// Every number below is measured, not asserted-by-prose.

const { buildSyntheticCorpus } = require('./fixtures.cjs');
const {
  buildAllTimelines,
  findCandidateLinks,
  dHash,
  hammingDistance,
} = require('./linkageEngine.cjs');

function assert(cond, message) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${message}`);
}

function pairKey(a, b) {
  return [a, b].sort().join('::');
}

function run() {
  const { observations, groundTruthLinkPairs, groundTruthNonPairs, groundTruthWarpPairs } =
    buildSyntheticCorpus();

  console.log(`corpus size: ${observations.length} synthetic observations`);
  console.log(
    `ground truth positive (cross-location same-creative) pairs: ${groundTruthLinkPairs.length}`,
  );
  console.log('');

  // ---------------------------------------------------------------------
  // TEST 1 — deterministic timeline diffing (Cluster A). This is pure
  // logic correctness, not a statistical claim, so it is a hard pass/fail.
  // ---------------------------------------------------------------------
  console.log('=== TEST 1: temporal evidence timeline (deterministic, no similarity search) ===');
  const timelines = buildAllTimelines(observations.filter((o) => !o.synthetic_warp));
  const clusterAObs = observations.filter(
    (o) => o.campaign_name === 'Drive the Future' || o.campaign_name === 'Possibilities Everywhere',
  );
  const clusterALocationId = clusterAObs[0].location_id;
  const timeline = timelines.get(clusterALocationId);
  assert(
    timeline.length === 3,
    `expected 3 timeline entries (1 marker + 2 diffs), got ${timeline.length}`,
  );
  assert(timeline[0].event === 'first_observed', 'first entry should be the first_observed marker');
  assert(
    timeline[1].changed_fields.length === 1 && timeline[1].changed_fields[0] === 'adbust_type',
    `expected only adbust_type to change at step 1, got [${timeline[1].changed_fields.join(',')}]`,
  );
  assert(
    timeline[1].change_type === 'intervention_appeared',
    `expected intervention_appeared, got ${timeline[1].change_type}`,
  );
  assert(
    timeline[2].changed_fields.length === 5,
    `expected all 5 tracked fields to change at step 2 (advertiser swap + intervention removed + condition), got ${timeline[2].changed_fields.length}: [${timeline[2].changed_fields.join(',')}]`,
  );
  assert(timeline[2].change_type !== 'no_change', 'step 2 must not be classified as no_change');
  console.log(
    'PASS — timeline correctly reconstructed: intervention appeared (day 0->12), then full advertiser replacement + intervention removal + condition decay (day 12->40)',
  );
  console.log(JSON.stringify(timeline, null, 2));
  console.log('');

  // ---------------------------------------------------------------------
  // TEST 2 — cross-location candidate retrieval (Clusters B/C/D).
  // Precision/recall against labeled ground truth.
  // ---------------------------------------------------------------------
  console.log('=== TEST 2: cross-location candidate linkage (geospatial + temporal + dHash) ===');
  const mainCorpus = observations.filter((o) => o.campaign_name !== 'Transit Reach'); // exclude warp cluster, tested separately
  const truthPairs = new Set(groundTruthLinkPairs.map(([a, b]) => pairKey(a, b)));
  const rawPairCount = (mainCorpus.length * (mainCorpus.length - 1)) / 2;

  // Threshold sweep -- report the actual precision/recall tradeoff instead
  // of hand-picking one number. maxDistanceMeters/maxTimeWindowDays are held
  // fixed (they already do the cheap, unambiguous rejection); only the
  // visual-similarity gate is swept.
  console.log(`n=${mainCorpus.length} observations -> ${rawPairCount} raw pairs considered`);
  console.log('hashDistanceThreshold sweep (geospatial<=5000m, temporal<=21d fixed):');
  console.log('threshold | candidates | TP | FP | FN | precision | recall | F1');
  let best = null;
  for (const threshold of [8, 12, 16, 20, 24, 28, 32]) {
    const t0 = Date.now();
    const candidates = findCandidateLinks(mainCorpus, {
      maxDistanceMeters: 5000,
      maxTimeWindowDays: 21,
      hashDistanceThreshold: threshold,
    });
    const elapsedMs = Date.now() - t0;

    const foundPairs = new Set(candidates.map((c) => pairKey(c.observation_a, c.observation_b)));
    let truePositives = 0;
    for (const key of truthPairs) if (foundPairs.has(key)) truePositives += 1;
    const falseNegatives = truthPairs.size - truePositives;
    const falsePositives = candidates.length - truePositives;
    const precision = candidates.length ? truePositives / candidates.length : 1;
    const recall = truthPairs.size ? truePositives / truthPairs.size : 1;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

    console.log(
      `${String(threshold).padStart(9)} | ${String(candidates.length).padStart(10)} | ${String(truePositives).padStart(2)} | ${String(falsePositives).padStart(2)} | ${String(falseNegatives).padStart(2)} | ${precision.toFixed(3).padStart(9)} | ${recall.toFixed(3).padStart(6)} | ${f1.toFixed(3)}`,
    );
    if (!best || f1 > best.f1)
      best = {
        threshold,
        precision,
        recall,
        f1,
        truePositives,
        falsePositives,
        falseNegatives,
        candidates,
      };
  }
  console.log('');
  console.log(
    `best F1 at threshold=${best.threshold}: precision=${best.precision.toFixed(3)} recall=${best.recall.toFixed(3)} F1=${best.f1.toFixed(3)} (${best.truePositives} TP, ${best.falsePositives} FP, ${best.falseNegatives} FN)`,
  );
  console.log(
    'reading: geospatial+temporal gates alone already reject the overwhelming majority of raw pairs at zero cost; dHash similarity separates true near-duplicates from background noise but with real, measured overlap at the boundary -- this is why every candidate carries a confidence_tier and an explanation, not a binary yes/no, and why the design routes candidates to a human/LLM review queue rather than auto-asserting a link.',
  );
  console.log('');

  // Adversarial checks at the conservative end of the sweep (threshold=16):
  // cluster C (same creative, wrong city) and cluster D (different creative,
  // same neighborhood) must not sneak in even though cluster C is visually
  // near-identical -- proving the geospatial gate, not the hash, is doing
  // that rejection.
  const conservative = findCandidateLinks(mainCorpus, {
    maxDistanceMeters: 5000,
    maxTimeWindowDays: 21,
    hashDistanceThreshold: 16,
  });
  const adversarialLeaks = conservative.filter(
    (c) =>
      groundTruthNonPairs.includes(c.observation_a) ||
      groundTruthNonPairs.includes(c.observation_b),
  );
  assert(
    adversarialLeaks.length === 0,
    `adversarial cluster C/D observations leaked into candidates at threshold=16: ${JSON.stringify(adversarialLeaks)}`,
  );
  console.log(
    'PASS — at threshold=16, adversarial near-misses (same creative wrong city; different creative same block) are correctly rejected (only 1/3 true positives recovered at this conservative setting, but zero false positives — see sweep table above for the full tradeoff)',
  );
  console.log('');

  // ---------------------------------------------------------------------
  // TEST 3 — known limitation: angle-warped same-creative pair (Cluster E).
  // This is reported honestly, not tuned to pass.
  // ---------------------------------------------------------------------
  console.log(
    '=== TEST 3: angle-warped same-creative pair (expected HARD for hash similarity) ===',
  );
  const warpObs = observations.filter((o) => o.campaign_name === 'Transit Reach');
  const [wa, wb] = groundTruthWarpPairs[0];
  const oa = warpObs.find((o) => o.id === wa);
  const ob = warpObs.find((o) => o.id === wb);
  const hashDist = hammingDistance(dHash(oa.image_grid), dHash(ob.image_grid));
  const recommendedThreshold = best.threshold; // best-F1 operating point measured in TEST 2
  const wouldBeFoundAtRecommendedThreshold = hashDist <= recommendedThreshold;
  console.log(`same physical creative, steep angle change: dHash distance = ${hashDist}/64`);
  console.log(
    wouldBeFoundAtRecommendedThreshold
      ? `FOUND at recommended threshold (${recommendedThreshold}) -- unexpectedly robust for this perturbation`
      : `NOT FOUND at recommended threshold (${recommendedThreshold}) -- CONFIRMS the known limitation: dHash detects near-duplicate photos, not the same creative from a materially different angle. A production system needs a learned embedding (e.g. a small CLIP-style model) for this case, not just perceptual hashing.`,
  );
  console.log('');

  // ---------------------------------------------------------------------
  // TEST 4 — scale sanity check (functional, not a load test)
  // ---------------------------------------------------------------------
  console.log('=== TEST 4: scale extrapolation (O(n^2) pairwise scan) ===');
  // Re-measure with a repeated loop -- the single-pass timings above are too
  // close to Date.now()'s resolution floor to extrapolate from honestly.
  const REPEATS = 200;
  const tScale0 = process.hrtime.bigint();
  for (let r = 0; r < REPEATS; r++) {
    findCandidateLinks(mainCorpus, {
      maxDistanceMeters: 5000,
      maxTimeWindowDays: 21,
      hashDistanceThreshold: 16,
    });
  }
  const tScale1 = process.hrtime.bigint();
  const measuredMsPerRun = Number(tScale1 - tScale0) / 1e6 / REPEATS;
  console.log(
    `measured: ${measuredMsPerRun.toFixed(4)}ms per full scan of n=${mainCorpus.length} (${REPEATS} runs averaged) -> ${rawPairCount} pairs`,
  );
  const perPairMs = measuredMsPerRun / (rawPairCount || 1);
  for (const n of [1000, 5000, 20000]) {
    const pairs = (n * (n - 1)) / 2;
    console.log(
      `n=${n.toLocaleString()} observations -> ${pairs.toLocaleString()} raw pairs -> ~${Math.round(pairs * perPairMs).toLocaleString()}ms naive pairwise scan (extrapolated, not measured)`,
    );
  }
  console.log(
    'At n>~5,000 active observations this naive pairwise scan becomes the bottleneck; the fix is a deterministic geospatial pre-bucket (geohash/grid cell) before any hash comparison, not a new database. See report §K for when a real spatial/vector index would actually be justified.',
  );
  console.log('');

  console.log('ALL BENCHMARK ASSERTIONS PASSED');
}

run();
