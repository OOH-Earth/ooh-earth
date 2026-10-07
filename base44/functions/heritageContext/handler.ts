const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_ITEM_PREFIXES = [
  'https://www.wikidata.org/entity/',
  'http://www.wikidata.org/entity/',
];
const MAX_RADIUS_KM = 5;
const MAX_RESULTS = 5;
const MAX_RESPONSE_BYTES = 512_000;
const REQUEST_TIMEOUT_MS = 4_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type HeritageSignal = {
  kind: 'heritage';
  category: 'heritage';
  label: string;
  value: string;
  summary: string;
  source: string;
  source_id: string;
  source_url: string;
  attribution: string;
  distance_m: number;
  observed_at: string;
  retrieved_at: string;
  freshness: string;
  confidence: 'reported';
  evidence_status: 'REPORTED';
  method: string;
  geographic_scope: 'NEAR';
  license: string;
};

function validCoordinate(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function buildQuery(lat: number, lng: number) {
  const point = `Point(${lng} ${lat})`;
  return `
SELECT ?item ?itemLabel ?coord WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:center "${point}"^^geo:wktLiteral ;
                    wikibase:radius "${MAX_RADIUS_KM}" ;
                    wikibase:distance ?distance .
  }
  FILTER EXISTS { ?item wdt:P1435 wd:Q9259 }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?distance
LIMIT ${MAX_RESULTS}`;
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

function parsePoint(value: unknown) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i);
  if (!match) return null;
  const lng = Number(match[1]);
  const lat = Number(match[2]);
  if (!validCoordinate(lat, -90, 90) || !validCoordinate(lng, -180, 180)) return null;
  return { lat, lng };
}

function parseResponse(payload: unknown, lat: number, lng: number, retrievedAt: string) {
  const bindings = (payload as { results?: { bindings?: unknown } })?.results?.bindings;
  if (!Array.isArray(bindings)) throw new Error('invalid provider response');

  const seen = new Set<string>();
  const evidence: HeritageSignal[] = [];
  for (const row of bindings) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, { value?: unknown }>;
    const item = record.item?.value;
    const label = record.itemLabel?.value;
    const coordinate = parsePoint(record.coord?.value);
    if (
      typeof item !== 'string' ||
      !WIKIDATA_ITEM_PREFIXES.some((prefix) => item.startsWith(prefix)) ||
      seen.has(item) ||
      typeof label !== 'string' ||
      !label.trim() ||
      !coordinate
    ) {
      continue;
    }
    seen.add(item);
    const sourceId = item.slice(item.lastIndexOf('/entity/') + '/entity/'.length);
    const sourceUrl = `https://www.wikidata.org/entity/${sourceId}`;
    const distance = distanceMeters(lat, lng, coordinate.lat, coordinate.lng);
    evidence.push({
      kind: 'heritage',
      category: 'heritage',
      label: label.trim().slice(0, 200),
      value: 'World Heritage context nearby',
      summary: 'World Heritage context nearby',
      source: 'Wikidata',
      source_id: sourceId,
      source_url: sourceUrl,
      attribution: 'Wikidata',
      distance_m: distance,
      observed_at: 'unknown',
      retrieved_at: retrievedAt,
      freshness: 'Retrieved at request time; source updates independently',
      confidence: 'reported',
      evidence_status: 'REPORTED',
      method: 'Wikidata World Heritage classification plus point-to-point haversine distance',
      geographic_scope: 'NEAR',
      license: 'CC0 structured data',
    });
  }
  return evidence.sort((a, b) => a.distance_m - b.distance_m).slice(0, MAX_RESULTS);
}

export async function resolveHeritageContext({
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
    return { status: 'unavailable', evidence: [], reason: 'invalid_coordinates' } as const;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const retrievedAt = now().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(
      `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(buildQuery(latitude, longitude))}&format=json`,
      {
        headers: {
          accept: 'application/sparql-results+json',
          'user-agent': 'OOH-Earth/1.0 (+https://oohearth.app)',
        },
        signal: controller.signal,
      },
    );
    if (!response.ok)
      return { status: 'unavailable', evidence: [], reason: 'provider_status' } as const;
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_RESPONSE_BYTES) {
      return {
        status: 'unavailable',
        evidence: [],
        reason: 'provider_response_too_large',
      } as const;
    }
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
      return {
        status: 'unavailable',
        evidence: [],
        reason: 'provider_response_too_large',
      } as const;
    }
    const evidence = parseResponse(JSON.parse(text), latitude, longitude, retrievedAt);
    return {
      status: evidence.length ? 'available' : 'empty',
      evidence,
      retrieved_at: retrievedAt,
    } as const;
  } catch {
    return { status: 'unavailable', evidence: [], reason: 'provider_unavailable' } as const;
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleHeritageContext(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'method not allowed' }, { status: 405 });
  const body = await req.json().catch(() => null);
  const result = await resolveHeritageContext({ lat: body?.lat, lng: body?.lng });
  return Response.json(result);
}
