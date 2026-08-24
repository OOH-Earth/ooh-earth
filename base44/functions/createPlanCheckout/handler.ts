const CURRENCY = 'usd';
const PLANS = {
  accomplice: { label: 'Accomplice', month: 500, year: 5000 },
  sustainer: { label: 'Sustainer', month: 1500, year: 15000 },
  patron: { label: 'Patron', month: 5000, year: 50000 },
};
const ALLOWED_ORIGINS = new Set([
  'https://oohearth.app',
  'https://www.oohearth.app',
  'https://ooh.earth',
  'http://localhost:5173',
  'http://localhost:3000',
]);

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  fetchImpl?: typeof fetch;
  getEnv?: (name: string) => string | undefined;
  timeoutMs?: number;
};

export async function handleCreatePlanCheckout(
  req: Request,
  {
    createClientFromRequest,
    fetchImpl = fetch,
    getEnv = (name) => Deno.env.get(name),
    timeoutMs = 10_000,
  }: Dependencies,
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
  const base44 = createClientFromRequest(req);
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  if (!caller?.id) return Response.json({ error: 'login_required' }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body?.tier !== 'string' || typeof body?.period !== 'string')
    return Response.json({ error: 'Invalid plan selection' }, { status: 400 });
  const tier = body.tier.toLowerCase();
  const period = body.period.toLowerCase();
  const plan = PLANS[tier as keyof typeof PLANS];
  if (!plan || (period !== 'month' && period !== 'year'))
    return Response.json({ error: 'Invalid plan' }, { status: 400 });
  const billingPeriod = period as 'month' | 'year';
  const amount = plan[billingPeriod];
  const rawOrigin = req.headers.get('origin');
  const origin = rawOrigin && ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://oohearth.app';
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${origin}/plans?status=subscribed`);
  params.set('cancel_url', `${origin}/plans?status=cancelled`);
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', CURRENCY);
  params.set('line_items[0][price_data][unit_amount]', String(amount));
  params.set('line_items[0][price_data][recurring][interval]', billingPeriod);
  params.set('line_items[0][price_data][recurring][interval_count]', '1');
  params.set(
    'line_items[0][price_data][product_data][name]',
    `OOH Earth · ${plan.label} (${billingPeriod === 'year' ? 'annual' : 'monthly'})`,
  );
  if (typeof caller.email === 'string' && caller.email.length <= 320)
    params.set('customer_email', caller.email);
  params.set('client_reference_id', caller.id);
  params.set('metadata[base44_app_id]', getEnv('BASE44_APP_ID') || '');
  params.set('metadata[user_id]', caller.id);
  params.set('metadata[plan_tier]', tier);
  params.set('metadata[plan_period]', billingPeriod);
  params.set('subscription_data[metadata][user_id]', caller.id);
  params.set('subscription_data[metadata][plan_tier]', tier);
  params.set('subscription_data[metadata][plan_period]', billingPeriod);
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
      console.error('Stripe plan checkout failed:', response.status);
      return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error('createPlanCheckout failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Checkout unavailable' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
