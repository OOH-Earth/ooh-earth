const GBIF_ENDPOINT = 'https://api.gbif.org/v1/occurrence/search';
const GBIF_SOURCE_URL = 'https://www.gbif.org/occurrence';
const MAX_RADIUS_KM = 5;
const MAX_RESULTS = 5;
const MAX_RESPONSE_BYTES = 256_000;
const REQUEST_TIMEOUT_MS = 4_000;
const USER_AGENT = 'OOH-Earth/1.0 (+https://oohearth.app)';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function validCoordinate(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function text(value: unknown, max = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function identifier(value: unknown, max = 80) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return text(value, max);
}

function finiteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
    return Number(value);
  return null;
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6_371_000;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function acceptedLicense(value: unknown) {
  const normalized = text(value, 160)?.toLowerCase();
  if (!normalized) return null;
  if (
    normalized === 'cc0_1_0' ||
    normalized.includes('creativecommons.org/publicdomain/zero/1.0') ||
    normalized === 'cc0'
  ) {
    return 'CC0 1.0';
  }
  if (normalized === 'cc_by_4_0' || normalized.includes('creativecommons.org/licenses/by/4.0')) {
    return 'CC BY 4.0';
  }
  return null;
}

function unavailable(reason: string) {
  return { status: 'unavailable', evidence: [], reason } as const;
}

function parseResponse(payload: unknown, lat: number, lng: number, retrievedAt: string) {
  const raw = (payload as { results?: unknown })?.results;
  if (!Array.isArray(raw)) throw new Error('invalid provider response');
  const seen = new Set<string>();
  const evidence = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const key = identifier(record.key, 40);
    const datasetKey = text(record.datasetKey, 80);
    const license = acceptedLicense(record.license ?? record.datasetLicense);
    const occurrenceLat = finiteNumber(record.decimalLatitude);
    const occurrenceLng = finiteNumber(record.decimalLongitude);
    const scientificName = text(record.acceptedScientificName ?? record.scientificName, 200);
    const uncertainty = finiteNumber(record.coordinateUncertaintyInMeters);
    const generalized = Boolean(
      text(record.dataGeneralizations, 300) || text(record.informationWithheld, 300),
    );
    if (
      !key ||
      !datasetKey ||
      seen.has(key) ||
      !license ||
      !scientificName ||
      occurrenceLat === null ||
      occurrenceLng === null ||
      !validCoordinate(occurrenceLat, -90, 90) ||
      !validCoordinate(occurrenceLng, -180, 180) ||
      record.hasGeospatialIssues === true ||
      generalized ||
      (uncertainty !== null && (uncertainty < 0 || uncertainty > MAX_RADIUS_KM * 1000))
    ) {
      continue;
    }
    seen.add(key);
    const eventDate = text(record.eventDate, 80);
    const distance = distanceMeters(lat, lng, occurrenceLat, occurrenceLng);
    const sourceId = `${datasetKey}/${key}`;
    const uncertaintyText =
      uncertainty === null
        ? 'Coordinate uncertainty not reported'
        : `Coordinate uncertainty ${Math.round(uncertainty)} m`;
    evidence.push({
      kind: 'biodiversity',
      category: 'biodiversity',
      label: text(record.vernacularName, 160) || 'Nearby biodiversity record',
      value: scientificName,
      source: 'GBIF',
      source_id: sourceId,
      source_url: `${GBIF_SOURCE_URL}/${encodeURIComponent(key)}`,
      attribution:
        text(record.publisher) ||
        text(record.rightsHolder) ||
        'GBIF-mediated data; publisher attribution required',
      observed_at: eventDate || 'unknown',
      retrieved_at: retrievedAt,
      evidence_status: 'REPORTED',
      method: `GBIF occurrence search within ${MAX_RADIUS_KM} km; point-to-point haversine distance; ${uncertaintyText}`,
      distance_m: distance,
      geographic_scope: 'NEAR',
      license,
      freshness: `Occurrence event date preserved; retrieved at ${retrievedAt}`,
      confidence: 'reported',
      coordinate_uncertainty_m: uncertainty,
      basis_of_record: text(record.basisOfRecord, 80) || 'unknown',
    });
  }
  return evidence.sort((a, b) => a.distance_m - b.distance_m).slice(0, MAX_RESULTS);
}

export async function resolveBiodiversityContext({
  lat,
  lng,
  fetchImpl = fetch,
  now = () => new Date(),
}: {
  lat: unknown;
  lng: unknown;
  fetchImpl?: FetchLike;
  now?: () => Date;
}) {
  if (!validCoordinate(lat, -90, 90) || !validCoordinate(lng, -180, 180)) {
    return unavailable('invalid_coordinates');
  }
  const latitude = Number(lat);
  const longitude = Number(lng);
  const retrievedAt = now().toISOString();
  const query = new URLSearchParams({
    decimalLatitude: String(latitude),
    decimalLongitude: String(longitude),
    distance: `${MAX_RADIUS_KM}km`,
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    limit: String(MAX_RESULTS),
    offset: '0',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${GBIF_ENDPOINT}?${query}`, {
      headers: { accept: 'application/json', 'user-agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) return unavailable(`provider_status_${response.status}`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_RESPONSE_BYTES) return unavailable('provider_response_too_large');
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
      return unavailable('provider_response_too_large');
    }
    const evidence = parseResponse(JSON.parse(body), latitude, longitude, retrievedAt);
    return {
      status: evidence.length ? 'available' : 'empty',
      evidence,
      retrieved_at: retrievedAt,
    } as const;
  } catch {
    return unavailable('provider_unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleBiodiversityContext(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'method not allowed' }, { status: 405 });
  const body = await req.json().catch(() => null);
  return Response.json(await resolveBiodiversityContext({ lat: body?.lat, lng: body?.lng }));
}
