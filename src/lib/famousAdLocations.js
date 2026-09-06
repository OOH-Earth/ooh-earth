/**
 * Small, reviewed V1 registry for OOH-significant places.
 * This is not a claim about global fame. Each record is source-backed and
 * matched conservatively by distance. No media is copied or proxied.
 */
export const FAMOUS_AD_LOCATION_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'piccadilly-lights',
    title: 'Piccadilly Lights',
    latitude: 51.51,
    longitude: -0.13444,
    match_radius_m: 350,
    relationship: 'NEAR',
    category: 'OOH significance',
    summary:
      'A long-running illuminated advertising display documented at Piccadilly Circus; the official operator records the site’s advertising history from 1908.',
    historical_period: 'Since 1908',
    source: 'Piccadilly Lights official site',
    source_id: 'piccadilly-lights-official',
    source_url: 'https://www.piccadillylights.co.uk/en/',
    evidence_status: 'REPORTED',
    method: 'Reviewed source claim; NEAR is derived from the reference-point distance',
    geographic_scope: 'Piccadilly Circus, London, United Kingdom',
    license: 'Factual metadata only; no third-party media reused',
    attribution: 'Piccadilly Lights / Ocean Outdoor',
    reviewed_at: '2026-09-06',
  }),
]);

const MAX_RESULTS = 3;

function validCoordinates(location) {
  return (
    Number.isFinite(Number(location?.lat)) &&
    Number.isFinite(Number(location?.lng)) &&
    Number(location.lat) >= -90 &&
    Number(location.lat) <= 90 &&
    Number(location.lng) >= -180 &&
    Number(location.lng) <= 180
  );
}

export function distanceInMeters(latitudeA, longitudeA, latitudeB, longitudeB) {
  const earthRadiusM = 6_371_000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const latA = toRadians(latitudeA);
  const latB = toRadians(latitudeB);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latA) * Math.cos(latB);
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function roundedDistance(distanceM) {
  return Math.max(0, Math.round(distanceM / 10) * 10);
}

export function famousAdEvidenceFor(location) {
  if (!validCoordinates(location)) return [];

  return FAMOUS_AD_LOCATION_REGISTRY.filter((record) => {
    const distanceM = distanceInMeters(
      Number(location.lat),
      Number(location.lng),
      record.latitude,
      record.longitude,
    );
    return distanceM <= record.match_radius_m;
  })
    .map((record) => {
      const distanceM = distanceInMeters(
        Number(location.lat),
        Number(location.lng),
        record.latitude,
        record.longitude,
      );
      return {
        source: record.source,
        source_id: record.source_id,
        source_url: record.source_url,
        category: record.category,
        label: record.title,
        value: `${record.relationship} — ${record.summary}`,
        unit: null,
        observed_at: record.historical_period,
        retrieved_at: record.reviewed_at,
        evidence_status: record.evidence_status,
        method: record.method,
        distance_m: roundedDistance(distanceM),
        geographic_scope: record.geographic_scope,
        license: record.license,
        attribution: record.attribution,
        freshness: `Curated registry reviewed ${record.reviewed_at}`,
        relationship: record.relationship,
        historical_period: record.historical_period,
      };
    })
    .sort((a, b) => a.distance_m - b.distance_m || a.source_id.localeCompare(b.source_id))
    .slice(0, MAX_RESULTS);
}

export { MAX_RESULTS as FAMOUS_AD_RESULT_CAP };
