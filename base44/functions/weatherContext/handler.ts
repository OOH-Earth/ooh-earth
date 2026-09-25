const NWS_API = 'https://api.weather.gov';
const NWS_SOURCE_URL = 'https://www.weather.gov/documentation/services-web-api';
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_RESPONSE_BYTES = 256_000;
const USER_AGENT = 'OOH-Earth/1.0 (+https://oohearth.app)';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function validCoordinate(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function text(value: unknown, max = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toKmh(windSpeed: unknown) {
  const raw = text(windSpeed, 80);
  if (!raw) return null;
  const match = raw.match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;
  const lower = raw.toLowerCase();
  const factor = lower.includes('mph') ? 1.609344 : lower.includes('kt') ? 1.852 : 1;
  return Math.round(value * factor * 10) / 10;
}

async function readJson(response: Response) {
  if (!response.ok) return null;
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_RESPONSE_BYTES) return null;
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) return null;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function unavailable(reason: string) {
  return { status: 'unavailable', evidence: [], reason } as const;
}

export async function resolveWeatherContext({
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = { accept: 'application/geo+json', 'user-agent': USER_AGENT };
  try {
    const points = await fetchImpl(`${NWS_API}/points/${latitude},${longitude}`, {
      headers,
      signal: controller.signal,
    });
    const pointPayload = await readJson(points);
    const properties = pointPayload?.properties as Record<string, unknown> | undefined;
    const gridId = properties?.gridId;
    const gridX = properties?.gridX;
    const gridY = properties?.gridY;
    if (
      !/^[A-Z0-9]{1,8}$/.test(String(gridId)) ||
      !Number.isInteger(gridX) ||
      !Number.isInteger(gridY)
    ) {
      return unavailable('unsupported_location');
    }
    if (Number(gridX) < 0 || Number(gridX) > 1000 || Number(gridY) < 0 || Number(gridY) > 1000) {
      return unavailable('invalid_provider_grid');
    }
    const forecast = await fetchImpl(
      `${NWS_API}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
      { headers, signal: controller.signal },
    );
    const forecastPayload = await readJson(forecast);
    const period = (forecastPayload?.properties as Record<string, unknown> | undefined)?.periods;
    const first = Array.isArray(period) ? (period[0] as Record<string, unknown>) : null;
    if (!first) return unavailable('missing_forecast');
    const temperature = number(first.temperature);
    const temperatureUnit = text(first.temperatureUnit, 4);
    const condition = text(first.shortForecast);
    const windKmh = toKmh(first.windSpeed);
    const start = text(first.startTime, 64);
    const observedAt =
      start && !Number.isNaN(Date.parse(start)) ? new Date(start).toISOString() : 'unknown';
    const retrievedAt = now().toISOString();
    const evidence = [
      condition && {
        kind: 'weather',
        category: 'weather',
        label: 'Forecast condition',
        value: condition,
        unit: null,
        source: 'National Weather Service',
        source_id: `${gridId}/${gridX},${gridY}`,
        source_url: NWS_SOURCE_URL,
        attribution: 'National Weather Service / NOAA',
        observed_at: observedAt,
        retrieved_at: retrievedAt,
        evidence_status: 'FORECAST',
        method: 'NWS hourly forecast period at the resolved grid point',
        distance_m: null,
        geographic_scope: 'FORECAST_GRID',
        license: 'U.S. Government open data',
        freshness: 'Retrieved at request time; forecast period begins at the recorded time',
        confidence: 'reported',
      },
      temperature != null &&
        temperatureUnit && {
          kind: 'weather',
          category: 'weather',
          label: 'Forecast temperature',
          value: temperature,
          unit: temperatureUnit,
          source: 'National Weather Service',
          source_id: `${gridId}/${gridX},${gridY}`,
          source_url: NWS_SOURCE_URL,
          attribution: 'National Weather Service / NOAA',
          observed_at: observedAt,
          retrieved_at: retrievedAt,
          evidence_status: 'FORECAST',
          method: 'NWS hourly forecast period at the resolved grid point',
          distance_m: null,
          geographic_scope: 'FORECAST_GRID',
          license: 'U.S. Government open data',
          freshness: 'Retrieved at request time; forecast period begins at the recorded time',
          confidence: 'reported',
        },
      windKmh != null && {
        kind: 'weather',
        category: 'weather',
        label: 'Forecast wind speed',
        value: windKmh,
        unit: 'km/h',
        source: 'National Weather Service',
        source_id: `${gridId}/${gridX},${gridY}`,
        source_url: NWS_SOURCE_URL,
        attribution: 'National Weather Service / NOAA',
        observed_at: observedAt,
        retrieved_at: retrievedAt,
        evidence_status: 'FORECAST',
        method: 'NWS hourly forecast period; normalized from provider wind units',
        distance_m: null,
        geographic_scope: 'FORECAST_GRID',
        license: 'U.S. Government open data',
        freshness: 'Retrieved at request time; forecast period begins at the recorded time',
        confidence: 'reported',
      },
    ].filter(Boolean);
    return { status: evidence.length ? 'available' : 'empty', evidence } as const;
  } catch {
    return unavailable('provider_unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleWeatherContext(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'method not allowed' }, { status: 405 });
  const body = await req.json().catch(() => null);
  return Response.json(await resolveWeatherContext({ lat: body?.lat, lng: body?.lng }));
}
