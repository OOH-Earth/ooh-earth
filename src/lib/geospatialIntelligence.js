import { classifyLocationQuality, freshnessOf, validCoordinate } from './locationQuality.js';

const MAX_INPUT = 5000;
const MAX_OUTPUT = 1000;
const DEFAULT_FRESHNESS_MS = 365 * 24 * 60 * 60 * 1000;

const boundedRows = (rows) => (Array.isArray(rows) ? rows.slice(0, MAX_INPUT) : []);

function observedAt(record) {
  return record?.status_updated_at || record?.updated_date || record?.created_date || null;
}

function safeLocation(record, now, freshnessMs) {
  if (!validCoordinate(record)) return null;
  const quality = classifyLocationQuality(record, { now, maxAgeMs: freshnessMs });
  return {
    id: typeof record.id === 'string' ? record.id.slice(0, 96) : 'UNKNOWN',
    lat: Number(record.lat ?? record.latitude),
    lng: Number(record.lng ?? record.longitude),
    status: ['verified', 'pending', 'rejected'].includes(record.status) ? record.status : 'unknown',
    quality: quality.quality,
    freshness: quality.freshness || freshnessOf(observedAt(record), now, freshnessMs),
    observed_at: observedAt(record),
  };
}

export function profileGeospatialEvidence({
  locations = [],
  fieldChecks = [],
  now = Date.now(),
  freshnessMs = DEFAULT_FRESHNESS_MS,
} = {}) {
  const boundedLocations = boundedRows(locations);
  const boundedChecks = boundedRows(fieldChecks);
  const locationQuality = boundedLocations.map((record) => safeLocation(record, now, freshnessMs));
  const validLocations = locationQuality.filter(Boolean);
  const checksForLocation = new Set(
    boundedChecks
      .filter((check) => typeof check?.location_id === 'string')
      .map((check) => check.location_id),
  );
  return {
    locations_seen: boundedLocations.length,
    field_checks_seen: boundedChecks.length,
    valid_coordinates: validLocations.length,
    invalid_coordinates: boundedLocations.length - validLocations.length,
    verified_locations: validLocations.filter((item) => item.quality === 'VERIFIED').length,
    stale_locations: validLocations.filter((item) => item.quality === 'STALE').length,
    never_verified_locations: validLocations.filter((item) => item.status !== 'verified').length,
    locations_with_field_checks: validLocations.filter((item) => checksForLocation.has(item.id))
      .length,
    evidence_state: boundedLocations.length ? 'EVIDENCE_PRESENT' : 'NO_EVIDENCE',
    caveat: 'NO_EVIDENCE does not prove NO INVENTORY.',
  };
}

export function buildVerificationQueue({
  locations = [],
  fieldChecks = [],
  now = Date.now(),
  freshnessMs = DEFAULT_FRESHNESS_MS,
  limit = 100,
} = {}) {
  const checks = new Set(
    boundedRows(fieldChecks)
      .filter((check) => typeof check?.location_id === 'string')
      .map((check) => check.location_id),
  );
  const queue = boundedRows(locations).flatMap((record) => {
    const item = safeLocation(record, now, freshnessMs);
    if (!item || item.status === 'rejected') return [];
    const reasons = [];
    let priority = 'P3';
    if (item.quality === 'STALE') {
      reasons.push('evidence is stale');
      priority = 'P1';
    }
    if (item.status !== 'verified') {
      reasons.push('location is not verified');
      priority = priority === 'P1' ? 'P1' : 'P2';
    }
    if (!checks.has(item.id)) reasons.push('no linked FieldCheck evidence');
    if (!reasons.length) return [];
    return [
      {
        id: item.id,
        priority,
        quality: item.quality,
        freshness: item.freshness,
        reasons: reasons.slice(0, 3),
        next_action: 'Perform a bounded field verification.',
      },
    ];
  });
  const rank = { P1: 0, P2: 1, P3: 2 };
  return queue
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id))
    .slice(0, Math.min(MAX_OUTPUT, Math.max(1, Number(limit) || 100)));
}

/**
 * @param {Array} locations
 * @param {{ north?: number, south?: number, east?: number, west?: number, quality?: string, status?: string, limit?: number, now?: number, freshnessMs?: number }} [options]
 */
export function queryLocationIntelligence(
  locations = [],
  {
    north,
    south,
    east,
    west,
    quality,
    status,
    limit = 100,
    now = Date.now(),
    freshnessMs = DEFAULT_FRESHNESS_MS,
  } = {},
) {
  const values = [north, south, east, west].map(Number);
  const boundedLimit = Math.min(MAX_OUTPUT, Math.max(1, Number(limit) || 100));
  const hasBounds =
    values.every(Number.isFinite) &&
    values[0] >= -90 &&
    values[0] <= 90 &&
    values[1] >= -90 &&
    values[1] <= 90 &&
    values[2] >= -180 &&
    values[2] <= 180 &&
    values[3] >= -180 &&
    values[3] <= 180 &&
    values[0] >= values[1];
  if (!hasBounds)
    return { state: 'INSUFFICIENT_DATA', results: [], reason: 'valid bounded viewport required' };
  const results = boundedRows(locations)
    .map((record) => safeLocation(record, now, freshnessMs))
    .filter(Boolean)
    .filter((item) => {
      const inLongitude =
        west <= east ? item.lng >= west && item.lng <= east : item.lng >= west || item.lng <= east;
      return (
        item.lat <= north &&
        item.lat >= south &&
        inLongitude &&
        (!quality || item.quality === quality) &&
        (!status || item.status === status)
      );
    })
    .slice(0, boundedLimit);
  return { state: 'EVIDENCE_PRESENT', results };
}

export function fieldIntelligenceRecommendations(profile) {
  if (!profile || profile.evidence_state === 'NO_EVIDENCE')
    return [
      {
        priority: 'P2',
        action: 'Obtain an approved bounded inventory read before inferring coverage.',
      },
    ];
  if (profile.stale_locations > 0)
    return [{ priority: 'P1', action: 'Prioritize field verification for stale locations.' }];
  if (profile.never_verified_locations > 0)
    return [{ priority: 'P2', action: 'Review unverified locations with bounded field evidence.' }];
  return [{ priority: 'P3', action: 'Continue bounded freshness monitoring.' }];
}
