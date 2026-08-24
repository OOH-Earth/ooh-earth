const CURRENCY = 'usd';
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  fetchImpl?: typeof fetch;
  getEnv?: (name: string) => string | undefined;
  timeoutMs?: number;
};

export async function handleCreateProductCheckout(
  req: Request,
  {
    createClientFromRequest,
    fetchImpl = fetch,
    getEnv = (name) => Deno.env.get(name),
    timeoutMs = 10_000,
  }: Dependencies,
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body?.item_id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(body.item_id)) {
    return Response.json({ error: 'Invalid item_id' }, { status: 400 });
  }
  const base44 = createClientFromRequest(req);
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  if (!caller?.id) return Response.json({ error: 'login_required' }, { status: 401 });
  const item = await base44.asServiceRole.entities.StoreItem.get(body.item_id);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
  if (item.status !== 'available')
    return Response.json({ error: 'Item not available for purchase' }, { status: 400 });
  const amount = Number(item.price_usd);
  const amountCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(amountCents) || amountCents < 100) {
    return Response.json({ error: 'Invalid price' }, { status: 400 });
  }
  if (
    Number.isFinite(Number(item.edition_size)) &&
    Number(item.edition_size) > 0 &&
    (Number(item.edition_sold) || 0) >= Number(item.edition_size)
  ) {
    return Response.json({ error: 'Item sold out' }, { status: 409 });
  }
  const rawOrigin = req.headers.get('origin');
  const origin = rawOrigin && ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://oohearth.app';
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${origin}/store?status=thanks&item=${body.item_id}`);
  params.set('cancel_url', `${origin}/store?status=cancelled`);
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', CURRENCY);
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set(
    'line_items[0][price_data][product_data][name]',
    `OOH Earth — ${String(item.title).slice(0, 200)}`,
  );
  if (typeof item.image_url === 'string' && item.image_url.startsWith('https://'))
    params.set('line_items[0][price_data][product_data][images][0]', item.image_url);
  params.set('metadata[base44_app_id]', getEnv('BASE44_APP_ID') || '');
  params.set('metadata[item_id]', body.item_id);
  params.set('metadata[item_title]', String(item.title).slice(0, 200));
  params.set('metadata[user_id]', caller.id);
  const idempotencyKey = req.headers.get('idempotency-key') || '';
  if (idempotencyKey && !/^[A-Za-z0-9._:-]{1,255}$/.test(idempotencyKey))
    return Response.json({ error: 'Invalid idempotency key' }, { status: 400 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getEnv('STRIPE_SECRET_KEY') || ''}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: params,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data?.url !== 'string') {
      console.error('Stripe product checkout failed:', response.status);
      return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error('createProductCheckout failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
