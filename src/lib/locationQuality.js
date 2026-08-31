/** Small deterministic data-quality primitives for Location/FieldCheck data. */
export const LOCATION_QUALITY = Object.freeze({
  VERIFIED: 'VERIFIED',
  LIKELY_VALID: 'LIKELY_VALID',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  STALE: 'STALE',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
});

const MAX_RECORDS = 5000;
const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

export function validCoordinate(record) {
  const lat = toNumber(record?.lat ?? record?.latitude);
  const lng = toNumber(record?.lng ?? record?.longitude);
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function freshnessOf(value, now = Date.now(), maxAgeMs = 365 * 24 * 60 * 60 * 1000) {
  const observed = Date.parse(String(value || ''));
  if (!Number.isFinite(observed) || observed > now) return 'UNKNOWN';
  return now - observed <= maxAgeMs ? 'CURRENT' : 'STALE';
}

/** @param {any} record @param {{ now?: number, maxAgeMs?: number }} options */
export function classifyLocationQuality(record, { now = Date.now(), maxAgeMs } = {}) {
  if (!record || !validCoordinate(record))
    return {
      quality: LOCATION_QUALITY.INSUFFICIENT_DATA,
      reasons: ['valid coordinates unavailable'],
    };
  const freshness = freshnessOf(
    record.status_updated_at || record.updated_date || record.created_date,
    now,
    maxAgeMs,
  );
  if (freshness === 'STALE')
    return {
      quality: LOCATION_QUALITY.STALE,
      freshness,
      reasons: ['field evidence is older than the configured threshold'],
    };
  if (record.status === 'verified' && freshness === 'CURRENT')
    return {
      quality: LOCATION_QUALITY.VERIFIED,
      freshness,
      reasons: ['valid coordinates and verified current record'],
    };
  if (freshness === 'CURRENT')
    return {
      quality: LOCATION_QUALITY.LIKELY_VALID,
      freshness,
      reasons: ['valid coordinates with current but unverified record'],
    };
  return {
    quality: LOCATION_QUALITY.NEEDS_REVIEW,
    freshness,
    reasons: ['coordinate is valid but evidence freshness is unknown'],
  };
}

export function possibleDuplicatePairs(records = [], radiusDegrees = 0.0005) {
  const bounded = Array.isArray(records) ? records.slice(0, MAX_RECORDS) : [];
  const pairs = [];
  for (let i = 0; i < bounded.length; i++) {
    const a = bounded[i];
    const alat = toNumber(a?.lat),
      alng = toNumber(a?.lng);
    if (alat === null || alng === null) continue;
    for (let j = i + 1; j < bounded.length; j++) {
      const b = bounded[j];
      const blat = toNumber(b?.lat),
        blng = toNumber(b?.lng);
      if (blat === null || blng === null) continue;
      if (Math.abs(alat - blat) <= radiusDegrees && Math.abs(alng - blng) <= radiusDegrees) {
        pairs.push({
          first: String(a.id || i),
          second: String(b.id || j),
          reason: 'coordinates within bounded proximity',
        });
      }
    }
  }
  return pairs.slice(0, 1000);
}

export function geographicCoverage(records = []) {
  const bounded = Array.isArray(records) ? records.slice(0, MAX_RECORDS) : [];
  const valid = bounded.filter(validCoordinate);
  const verified = valid.filter((record) => record.status === 'verified');
  return {
    total_seen: bounded.length,
    valid_coordinates: valid.length,
    verified_coordinates: verified.length,
    state:
      bounded.length === 0
        ? 'NO_EVIDENCE'
        : valid.length
          ? 'EVIDENCE_PRESENT'
          : 'INSUFFICIENT_DATA',
    caveat: 'NO_EVIDENCE does not prove NO INVENTORY.',
  };
}
