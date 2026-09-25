const OFF_ENDPOINT = 'https://world.openfoodfacts.org/api/v3/product';
const OFF_SOURCE = 'Open Food Facts';
const OFF_LICENSE = 'Open Food Facts Database Contents License / ODbL database';
const OFF_ATTRIBUTION = 'Open Food Facts contributors';
const MAX_RESPONSE_BYTES = 256_000;
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_TEXT = 300;
const FIELDS = [
  'code',
  'product_name',
  'brands',
  'categories',
  'quantity',
  'countries',
  'origins',
  'manufacturing_places',
  'packaging',
  'labels',
];

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function text(value: unknown, max = MAX_TEXT) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function unavailable(reason: string) {
  return { status: 'unavailable', product: null, reason } as const;
}

function validCode(value: unknown) {
  return typeof value === 'string' && /^\d{8,14}$/.test(value);
}

function assertion(
  field: string,
  label: string,
  value: unknown,
  code: string,
  retrievedAt: string,
) {
  const safeValue = text(value);
  if (!safeValue) {
    return {
      field,
      label,
      value: null,
      evidence_status: 'UNKNOWN',
      evidence_class: 'UNKNOWN',
      source: null,
      source_id: null,
      source_url: null,
      retrieved_at: retrievedAt,
      license: null,
      attribution: null,
      method: 'No source-backed value was returned for this field',
    };
  }
  return {
    field,
    label,
    value: safeValue,
    evidence_status: 'REPORTED',
    evidence_class: 'DATASET_REPORTED',
    source: OFF_SOURCE,
    source_id: code,
    source_url: `https://world.openfoodfacts.org/product/${code}`,
    retrieved_at: retrievedAt,
    license: OFF_LICENSE,
    attribution: OFF_ATTRIBUTION,
    method:
      'Field returned by the Open Food Facts product record; community data may be incomplete or incorrect',
  };
}

async function readJson(response: Response) {
  if (!response.ok) return { status: `provider_status_${response.status}` };
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_RESPONSE_BYTES) return { status: 'provider_response_too_large' };
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
    return { status: 'provider_response_too_large' };
  }
  try {
    return { payload: JSON.parse(body) as Record<string, unknown> };
  } catch {
    return { status: 'malformed_provider_response' };
  }
}

export async function resolveProductLookup({
  code,
  fetchImpl = fetch,
  now = () => new Date(),
}: {
  code: unknown;
  fetchImpl?: FetchLike;
  now?: () => Date;
}) {
  if (!validCode(code)) return unavailable('invalid_identifier');
  const retrievedAt = now().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const query = new URLSearchParams({ fields: FIELDS.join(',') });
    const response = await fetchImpl(`${OFF_ENDPOINT}/${code}.json?${query}`, {
      headers: {
        accept: 'application/json',
        'user-agent': 'OOH-Earth/1.0 (https://oohearth.app)',
      },
      signal: controller.signal,
    });
    const parsed = await readJson(response);
    if (!parsed.payload) {
      if (parsed.status === 'provider_status_404') {
        return { status: 'empty', product: null, reason: 'product_not_found' } as const;
      }
      return unavailable(parsed.status || 'provider_unavailable');
    }
    if (parsed.payload.status !== 'success' || !parsed.payload.product) {
      return { status: 'empty', product: null, reason: 'product_not_found' } as const;
    }
    const product = parsed.payload.product as Record<string, unknown>;
    const fields = Object.freeze({
      product_name: assertion(
        'product_name',
        'Product name',
        product.product_name,
        String(code),
        retrievedAt,
      ),
      brand: assertion('brand', 'Brand', product.brands, String(code), retrievedAt),
      category: assertion('category', 'Category', product.categories, String(code), retrievedAt),
      quantity: assertion('quantity', 'Quantity', product.quantity, String(code), retrievedAt),
      countries: assertion(
        'countries',
        'Countries on record',
        product.countries,
        String(code),
        retrievedAt,
      ),
      origins: assertion('origins', 'Declared origin', product.origins, String(code), retrievedAt),
      manufacturing_places: assertion(
        'manufacturing_places',
        'Manufacturing places',
        product.manufacturing_places,
        String(code),
        retrievedAt,
      ),
      packaging: assertion('packaging', 'Packaging', product.packaging, String(code), retrievedAt),
      labels: assertion('labels', 'Labels', product.labels, String(code), retrievedAt),
    });
    return {
      status: 'available',
      retrieved_at: retrievedAt,
      product: { gtin: String(code), fields },
    } as const;
  } catch {
    return unavailable('provider_unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleProductLookup(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'method not allowed' }, { status: 405 });
  const body = await req.json().catch(() => null);
  return Response.json(await resolveProductLookup({ code: body?.code }));
}
