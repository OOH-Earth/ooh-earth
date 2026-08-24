const MIN_DONATION_USD = 1;
const MAX_DONATION_USD = 10_000;
const CURRENCY = 'usd';
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = {
  fetchImpl?: typeof fetch;
  getEnv?: (name: string) => string | undefined;
  timeoutMs?: number;
};

function checkoutOrigin(req: Request) {
  const raw = req.headers.get('origin');
  return raw && ALLOWED_ORIGINS.has(raw) ? raw : 'https://oohearth.app';
}

export async function handleCreateDonationCheckout(
  req: Request,
  {
    fetchImpl = fetch,
    getEnv = (name) => Deno.env.get(name),
    timeoutMs = 10_000,
  }: Dependencies = {},
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const value = body?.amount;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }
  if (value < MIN_DONATION_USD || value > MAX_DONATION_USD) {
    return Response.json(
      { error: `Amount must be between $${MIN_DONATION_USD} and $${MAX_DONATION_USD}.` },
      { status: 400 },
    );
  }
  const amount = Math.round(value * 100);
  if (!Number.isSafeInteger(amount) || amount < MIN_DONATION_USD * 100) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const params = new URLSearchParams();
  const origin = checkoutOrigin(req);
  params.set('mode', 'payment');
  params.set('success_url', `${origin}/campaign?status=thanks`);
  params.set('cancel_url', `${origin}/campaign?status=cancelled`);
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', CURRENCY);
  params.set('line_items[0][price_data][unit_amount]', String(amount));
  params.set('line_items[0][price_data][product_data][name]', 'OOH Earth — Field Offensive');
  params.set('metadata[base44_app_id]', getEnv('BASE44_APP_ID') || '');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const idempotencyKey = req.headers.get('idempotency-key') || '';
  if (idempotencyKey && !/^[A-Za-z0-9._:-]{1,255}$/.test(idempotencyKey)) {
    clearTimeout(timer);
    return Response.json({ error: 'Invalid idempotency key' }, { status: 400 });
  }
  try {
    const response = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getEnv('STRIPE_SECRET_KEY') || ''}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: params,
      signal: ctrl.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data?.url !== 'string' || !data.url) {
      console.error('Stripe donation checkout failed:', response.status);
      return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error(
      'createDonationCheckout failed:',
      error instanceof Error ? error.name : 'unknown',
    );
    return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
