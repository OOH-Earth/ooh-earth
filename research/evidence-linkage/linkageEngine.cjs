'use strict';
// The primitive under evaluation: turn raw, independently-submitted
// observations (shaped like real Location/FieldCheck rows) into two kinds
// of derived evidence:
//
//  1. buildTimeline()      — deterministic field-diffing of repeat checks
//                             at the SAME location_id. No model, no
//                             similarity search: the FK already tells us
//                             these are the same physical placement.
//  2. findCandidateLinks() — geospatial + temporal + visual-similarity
//                             candidate retrieval ACROSS different
//                             location_ids, for "is this the same creative
//                             redeployed elsewhere" review queues.
//
// Per the AI-architecture rule: deterministic diffing needs no model at
// all; cross-location matching uses perceptual hashing (dHash) as the
// cheapest similarity layer, not an LLM. Every candidate carries its own
// evidence (distance_meters, days_apart, hash_distance) so a human or a
// downstream LLM step can audit *why* it was surfaced — nothing here
// asserts ground truth on its own.

const { GRID } = require('./fixtures.cjs');

// --- geospatial -------------------------------------------------------

const EARTH_RADIUS_M = 6371000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// --- temporal -----------------------------------------------------------

function daysBetween(isoA, isoB) {
  return Math.abs(new Date(isoA).getTime() - new Date(isoB).getTime()) / 86400000;
}

// --- visual similarity: difference hash (dHash) --------------------------
// Resize-free here because fixtures already emit a fixed GRID x GRID
// buffer; a real implementation would resize a decoded photo to
// (HASH_SIZE+1) x HASH_SIZE grayscale first. Encodes relative brightness
// gradients, not absolute pixel values, so mild global brightness shift
// (perturbNearDuplicate's brightnessShift) does not flip bits.

const HASH_SIZE = 8; // -> 64-bit hash, standard dHash size

function downsample(grid, srcSize, dstSize) {
  const out = new Float64Array(dstSize * dstSize);
  const scale = srcSize / dstSize;
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      const sx = Math.min(srcSize - 1, Math.floor(x * scale));
      const sy = Math.min(srcSize - 1, Math.floor(y * scale));
      out[y * dstSize + x] = grid[sy * srcSize + sx];
    }
  }
  return out;
}

function dHash(grid, srcSize = GRID) {
  const small = downsample(grid, srcSize, HASH_SIZE + 1);
  let hash = 0n;
  let bit = 0n;
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = small[y * (HASH_SIZE + 1) + x];
      const right = small[y * (HASH_SIZE + 1) + x + 1];
      if (left > right) hash |= 1n << bit;
      bit += 1n;
    }
  }
  return hash;
}

function hammingDistance(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

// --- 1. temporal evidence timeline ---------------------------------------

const DIFF_FIELDS = ['brand_name', 'parent_corp', 'campaign_name', 'condition', 'adbust_type'];

function classifyChange(prev, next) {
  const changed = DIFF_FIELDS.filter((f) => prev[f] !== next[f]);
  if (changed.length === 0) return { change_type: 'no_change', changed_fields: [] };
  if (changed.includes('adbust_type')) {
    if (prev.adbust_type === 'none' && next.adbust_type !== 'none') {
      return { change_type: 'intervention_appeared', changed_fields: changed };
    }
    if (prev.adbust_type !== 'none' && next.adbust_type === 'none') {
      return { change_type: 'intervention_removed', changed_fields: changed };
    }
  }
  if (
    changed.includes('brand_name') ||
    changed.includes('parent_corp') ||
    changed.includes('campaign_name')
  ) {
    return { change_type: 'advertiser_replaced', changed_fields: changed };
  }
  return { change_type: 'condition_changed', changed_fields: changed };
}

// observations: all rows (location + field_check) sharing one location_id,
// each already schema-shaped with created_date + the DIFF_FIELDS.
function buildTimeline(observations) {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime(),
  );
  const events = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    const { change_type, changed_fields } = classifyChange(prev, next);
    events.push({
      location_id: next.location_id,
      from_observation_id: prev.id,
      to_observation_id: next.id,
      from_date: prev.created_date,
      to_date: next.created_date,
      days_elapsed: Math.round(daysBetween(prev.created_date, next.created_date) * 10) / 10,
      change_type,
      changed_fields,
      // deterministic field-diff -- this is definitional, not a model
      // guess, so confidence is 1.0 for WHAT changed. It says nothing
      // about whether the underlying observations themselves are trustworthy
      // (that's the existing verification-status field's job).
      confidence: 1.0,
    });
  }
  return sorted.length === 0
    ? []
    : [
        { location_id: sorted[0].location_id, event: 'first_observed', at: sorted[0].created_date },
        ...events,
      ];
}

function buildAllTimelines(observations) {
  const byLocation = new Map();
  for (const obs of observations) {
    if (!byLocation.has(obs.location_id)) byLocation.set(obs.location_id, []);
    byLocation.get(obs.location_id).push(obs);
  }
  const timelines = new Map();
  for (const [locationId, obsList] of byLocation) {
    timelines.set(locationId, buildTimeline(obsList));
  }
  return timelines;
}

// --- 2. cross-location candidate linkage ---------------------------------

function confidenceTier(distanceMeters, daysApart, hashDistance, opts) {
  const visualScore = 1 - hashDistance / 64; // 1.0 = identical hash
  if (hashDistance <= opts.highBits && distanceMeters <= opts.maxDistanceMeters * 0.5)
    return 'high';
  if (hashDistance <= opts.hashDistanceThreshold) return 'medium';
  return 'low';
}

function findCandidateLinks(observations, opts = {}) {
  const options = {
    maxDistanceMeters: opts.maxDistanceMeters ?? 5000,
    maxTimeWindowDays: opts.maxTimeWindowDays ?? 21,
    hashDistanceThreshold: opts.hashDistanceThreshold ?? 20, // best-F1 operating point measured in benchmark.cjs, out of 64 bits — not the only valid choice, see README
    highBits: opts.highBits ?? 4,
  };

  const withHash = observations.map((o) => ({ ...o, _hash: dHash(o.image_grid) }));
  const candidates = [];

  for (let i = 0; i < withHash.length; i++) {
    for (let j = i + 1; j < withHash.length; j++) {
      const a = withHash[i];
      const b = withHash[j];
      if (a.location_id === b.location_id) continue; // same-placement case is buildTimeline's job, not this

      const distance_meters = Math.round(haversineMeters(a.lat, a.lng, b.lat, b.lng));
      if (distance_meters > options.maxDistanceMeters) continue; // geospatial gate first — cheapest reject

      const days_apart = Math.round(daysBetween(a.created_date, b.created_date) * 10) / 10;
      if (days_apart > options.maxTimeWindowDays) continue; // temporal gate second

      const hash_distance = hammingDistance(a._hash, b._hash);
      if (hash_distance > options.hashDistanceThreshold) continue; // visual gate last — most expensive semantically

      candidates.push({
        observation_a: a.id,
        observation_b: b.id,
        distance_meters,
        days_apart,
        hash_distance,
        similarity_score: Math.round((1 - hash_distance / 64) * 1000) / 1000,
        confidence_tier: confidenceTier(distance_meters, days_apart, hash_distance, options),
        explanation: {
          geospatial: `${distance_meters}m apart (limit ${options.maxDistanceMeters}m)`,
          temporal: `${days_apart}d apart (limit ${options.maxTimeWindowDays}d)`,
          visual: `dHash distance ${hash_distance}/64 (limit ${options.hashDistanceThreshold})`,
        },
      });
    }
  }
  return candidates.sort((x, y) => y.similarity_score - x.similarity_score);
}

module.exports = {
  haversineMeters,
  daysBetween,
  dHash,
  hammingDistance,
  buildTimeline,
  buildAllTimelines,
  findCandidateLinks,
};
