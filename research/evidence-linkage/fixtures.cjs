'use strict';
// SYNTHETIC DATA ONLY. Every record produced here has synthetic: true and
// exists solely to exercise linkageEngine.js against known ground truth.
// Shapes mirror the real Location/FieldCheck schemas (base44/entities/
// Location.jsonc, FieldCheck.jsonc) read directly from origin/main — field
// names match; values do not represent any real observation.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRID = 32; // small synthetic "image" — enough structure for dHash, cheap to generate

// A deterministic pseudo-random grayscale pattern standing in for one
// distinct creative design. Same seed -> same base pattern every time.
function generatePattern(seed) {
  const rand = mulberry32(seed);
  const grid = new Float64Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      // low-frequency blobs, not pure noise -- a real creative has coherent
      // regions (logo block, background, text band), not per-pixel static
      const blobX = Math.sin((x / GRID) * Math.PI * (1 + (seed % 3))) * 0.5 + 0.5;
      const blobY = Math.cos((y / GRID) * Math.PI * (1 + ((seed >> 2) % 3))) * 0.5 + 0.5;
      grid[y * GRID + x] = clamp01(blobX * blobY * 0.7 + rand() * 0.3);
    }
  }
  return grid;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Simulates re-photographing the SAME physical creative: minor crop offset,
// exposure/brightness drift, sensor noise. This is the case dHash is
// actually good at.
function perturbNearDuplicate(
  base,
  { seedOffset = 0, brightnessShift = 0, noiseAmt = 0.05, cropShift = 1 } = {},
) {
  const rand = mulberry32(1000 + seedOffset);
  const out = new Float64Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const sx = clampIdx(x + cropShift, GRID);
      const sy = clampIdx(y + cropShift, GRID);
      const v = base[sy * GRID + sx] + brightnessShift + (rand() - 0.5) * noiseAmt;
      out[y * GRID + x] = clamp01(v);
    }
  }
  return out;
}

// Simulates a materially different viewing angle / heavy perspective skew --
// deliberately harder than a near-duplicate. Used to honestly demonstrate
// where hash-based similarity stops working, not to flatter the benchmark.
function perturbAngleWarp(base, seedOffset = 0) {
  const rand = mulberry32(2000 + seedOffset);
  const out = new Float64Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      // shear + nonlinear remap, approximating a steep off-axis photograph
      const sx = clampIdx(Math.round(x * 0.6 + y * 0.35 + rand() * 3), GRID);
      const sy = clampIdx(Math.round(y * 0.6 + rand() * 3), GRID);
      out[y * GRID + x] = clamp01(base[sy * GRID + sx] * 0.8 + rand() * 0.2);
    }
  }
  return out;
}

function clampIdx(v, size) {
  return ((v % size) + size) % size;
}

let _id = 0;
function nextId(prefix) {
  _id += 1;
  return `${prefix}_${_id}`;
}

function iso(daysFromEpoch) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, 0) + daysFromEpoch * 86400000).toISOString();
}

// Builds the full synthetic corpus with labeled ground truth, matching the
// real Location + FieldCheck field names.
function buildSyntheticCorpus() {
  const observations = [];
  const groundTruthLinkPairs = []; // pairs that SHOULD be surfaced as same-campaign-different-placement
  const groundTruthNonPairs = []; // adversarial near-misses that must NOT be surfaced
  const groundTruthWarpPairs = []; // same-creative pairs under angle warp (expected to be HARD)

  // --- Cluster A: one physical Location re-checked 3x over 40 days.
  // Tests buildTimeline() -- deterministic field-diffing, not similarity search.
  {
    const pattern = generatePattern(1);
    const locationId = nextId('loc');
    const base = {
      synthetic: true,
      location_id: locationId,
      lat: 13.7563,
      lng: 100.5018,
      brand_name: 'Shell',
      parent_corp: 'Shell plc',
      industry_sector: 'fossil_fuel',
      campaign_name: 'Drive the Future',
      condition: 'functional',
      adbust_type: 'none',
    };
    observations.push({
      id: nextId('obs'),
      kind: 'location',
      ...base,
      created_date: iso(0),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 1 }),
    });
    observations.push({
      id: nextId('obs'),
      kind: 'field_check',
      ...base,
      adbust_type: 'stickered', // intervention appears
      created_date: iso(12),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 2, brightnessShift: 0.03 }),
    });
    observations.push({
      id: nextId('obs'),
      kind: 'field_check',
      ...base,
      brand_name: 'BP', // advertiser swapped
      parent_corp: 'BP plc',
      campaign_name: 'Possibilities Everywhere',
      adbust_type: 'none', // intervention removed, ad replaced
      condition: 'neglected', // structure degraded
      created_date: iso(40),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 3, brightnessShift: -0.05 }),
    });
  }

  // --- Cluster B: SAME creative redeployed at 3 different nearby physical
  // placements within an 10-day window. This is the cross-location case the
  // candidate-linkage pipeline must catch.
  {
    const pattern = generatePattern(2);
    const centerLat = 13.73;
    const centerLng = 100.52;
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const locationId = nextId('loc');
      const obs = {
        id: nextId('obs'),
        kind: 'location',
        synthetic: true,
        location_id: locationId,
        lat: centerLat + i * 0.006, // ~600-700m apart
        lng: centerLng + i * 0.004,
        brand_name: 'AB InBev',
        parent_corp: 'AB InBev',
        industry_sector: 'alcohol',
        campaign_name: 'Summer Pour',
        condition: 'functional',
        adbust_type: 'none',
        created_date: iso(5 + i),
        image_grid: perturbNearDuplicate(pattern, {
          seedOffset: 10 + i,
          brightnessShift: i * 0.02,
          cropShift: i,
        }),
      };
      observations.push(obs);
      ids.push(obs.id);
    }
    groundTruthLinkPairs.push([ids[0], ids[1]], [ids[0], ids[2]], [ids[1], ids[2]]);
  }

  // --- Cluster C: SAME creative, but in a different city entirely (>50km
  // away) inside the same time window. Visually similar, must be rejected
  // by the geospatial constraint -- proves constraint composition matters,
  // not similarity alone.
  {
    const pattern = generatePattern(2); // reuse cluster B's creative on purpose
    const locationId = nextId('loc');
    const obs = {
      id: nextId('obs'),
      kind: 'location',
      synthetic: true,
      location_id: locationId,
      lat: 13.73 + 0.6, // ~67km north
      lng: 100.52,
      brand_name: 'AB InBev',
      parent_corp: 'AB InBev',
      industry_sector: 'alcohol',
      campaign_name: 'Summer Pour',
      condition: 'functional',
      adbust_type: 'none',
      created_date: iso(6),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 20, cropShift: 2 }),
    };
    observations.push(obs);
    groundTruthNonPairs.push(obs.id); // must not link to cluster B ids
  }

  // --- Cluster D: DIFFERENT creative, same neighborhood, same week.
  // Negative control for "proximity alone is enough" — it is not.
  {
    const pattern = generatePattern(3);
    const locationId = nextId('loc');
    const obs = {
      id: nextId('obs'),
      kind: 'location',
      synthetic: true,
      location_id: locationId,
      lat: 13.731,
      lng: 100.521,
      brand_name: "McDonald's",
      parent_corp: "McDonald's Corporation",
      industry_sector: 'ultra_processed_food',
      campaign_name: 'Local Value Menu',
      condition: 'functional',
      adbust_type: 'none',
      created_date: iso(6),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 30 }),
    };
    observations.push(obs);
    groundTruthNonPairs.push(obs.id);
  }

  // --- Cluster E: same creative, same neighborhood, same week, but the
  // second observation is angle-warped (steep off-axis photo). Expected to
  // be HARD for hash similarity -- this is the honesty check, not a win.
  {
    const pattern = generatePattern(4);
    const locA = nextId('loc');
    const locB = nextId('loc');
    const shared = {
      synthetic: true,
      brand_name: 'JCDecaux',
      parent_corp: 'JCDecaux SE',
      industry_sector: 'other',
      campaign_name: 'Transit Reach',
      condition: 'functional',
      adbust_type: 'none',
    };
    const obsA = {
      id: nextId('obs'),
      kind: 'location',
      location_id: locA,
      lat: 13.74,
      lng: 100.51,
      created_date: iso(8),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 40 }),
      ...shared,
    };
    const obsB = {
      id: nextId('obs'),
      kind: 'location',
      location_id: locB,
      lat: 13.7405,
      lng: 100.5103,
      created_date: iso(9),
      image_grid: perturbAngleWarp(pattern, 41),
      ...shared,
    };
    observations.push(obsA, obsB);
    groundTruthWarpPairs.push([obsA.id, obsB.id]);
  }

  // --- Background noise: unrelated observations scattered in time/space to
  // stress the candidate filter (must not explode into spurious matches).
  // Seeded PRNG, not Math.random() -- the benchmark must be reproducible
  // run-to-run, not a moving target.
  const bgRand = mulberry32(42);
  for (let i = 0; i < 25; i++) {
    const pattern = generatePattern(100 + i);
    const locationId = nextId('loc');
    observations.push({
      id: nextId('obs'),
      kind: 'location',
      synthetic: true,
      location_id: locationId,
      lat: 13.6 + bgRand() * 0.3,
      lng: 100.4 + bgRand() * 0.3,
      brand_name: `Advertiser_${i}`,
      parent_corp: `ParentCorp_${i}`,
      industry_sector: 'other',
      campaign_name: `Campaign_${i}`,
      condition: 'functional',
      adbust_type: 'none',
      created_date: iso(Math.floor(bgRand() * 60)),
      image_grid: perturbNearDuplicate(pattern, { seedOffset: 500 + i }),
    });
  }

  return { observations, groundTruthLinkPairs, groundTruthNonPairs, groundTruthWarpPairs };
}

module.exports = {
  buildSyntheticCorpus,
  generatePattern,
  perturbNearDuplicate,
  perturbAngleWarp,
  GRID,
};
