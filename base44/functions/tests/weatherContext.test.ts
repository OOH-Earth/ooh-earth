import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { resolveWeatherContext } from '../weatherContext/handler.ts';

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/geo+json' },
  });
}

const points = { properties: { gridId: 'LWX', gridX: 96, gridY: 70 } };
const forecast = {
  properties: {
    periods: [
      {
        temperature: 12,
        temperatureUnit: 'C',
        shortForecast: 'Light Rain',
        windSpeed: '10 mph',
        startTime: '2026-09-05T12:00:00-04:00',
      },
    ],
  },
};

Deno.test('normalizes NWS forecast data with temporal provenance and units', async () => {
  const urls: string[] = [];
  const result = await resolveWeatherContext({
    lat: 38.89,
    lng: -77.03,
    now: () => new Date('2026-09-05T16:00:00.000Z'),
    fetchImpl: async (input, init) => {
      urls.push(input);
      assertEquals(init?.headers?.['user-agent'], 'OOH-Earth/1.0 (+https://oohearth.app)');
      return response(urls.length === 1 ? points : forecast);
    },
  });
  assertEquals(result.status, 'available');
  assertEquals(result.evidence.length, 3);
  assertEquals(result.evidence[0].evidence_status, 'FORECAST');
  assertEquals(result.evidence[0].observed_at, '2026-09-05T16:00:00.000Z');
  assertEquals(result.evidence[1].value, 12);
  assertEquals(result.evidence[2].value, 16.1);
  assertEquals(
    result.evidence[0].source_url,
    'https://www.weather.gov/documentation/services-web-api',
  );
  assertMatch(urls[1], /gridpoints\/LWX\/96,70\/forecast\/hourly/);
});

Deno.test('unsupported, malformed and provider failures stay optional', async () => {
  const unsupported = await resolveWeatherContext({
    lat: 51.5,
    lng: -0.12,
    fetchImpl: async () => response({}, 404),
  });
  assertEquals(unsupported.status, 'unavailable');

  const malformed = await resolveWeatherContext({
    lat: 38,
    lng: -77,
    fetchImpl: async () => response({ properties: { gridId: 'LWX', gridX: 'bad', gridY: 1 } }),
  });
  assertEquals(malformed.status, 'unavailable');

  const failed = await resolveWeatherContext({
    lat: 38,
    lng: -77,
    fetchImpl: async () => response({}, 429),
  });
  assertEquals(failed.status, 'unavailable');
  const thrown = await resolveWeatherContext({
    lat: 38,
    lng: -77,
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  assertEquals(thrown.status, 'unavailable');
});

Deno.test('invalid coordinates never reach NWS', async () => {
  let called = false;
  const result = await resolveWeatherContext({
    lat: Number.NaN,
    lng: -77,
    fetchImpl: async () => {
      called = true;
      return response(points);
    },
  });
  assertEquals(result.reason, 'invalid_coordinates');
  assertEquals(called, false);
});
