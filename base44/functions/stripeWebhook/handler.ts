type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  getEnv?: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  inFlight?: Map<string, Promise<unknown>>;
};

export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  now = Date.now(),
) {
  if (!signatureHeader || !secret) return null;
  let timestamp = '';
  let signature = '';
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key === 't') timestamp = value || '';
    if (key === 'v1') signature = value || '';
  }
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || !signature) return null;
  const age = Math.floor(now / 1000) - timestampSeconds;
  if (age > 300 || age < -5) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const computed = Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  if (computed.length !== signature.length) return null;
  let difference = 0;
  for (let index = 0; index < computed.length; index++)
    difference |= computed.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0 ? timestampSeconds : null;
}

async function forwardToN8n(
  payload: unknown,
  getEnv: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
) {
  const url = getEnv('N8N_WEBHOOK_URL') || '';
  if (!url) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    console.log(`n8n forward: ${response.status}`);
  } catch (error) {
    console.error(
      'n8n forward failed (non-fatal):',
      error instanceof Error ? error.name : 'unknown',
    );
  } finally {
    clearTimeout(timer);
  }
}

async function getStripeSub(
  id: string,
  getEnv: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${getEnv('STRIPE_SECRET_KEY') || ''}` },
  });
  if (!response.ok) throw new Error(`Stripe subscription fetch ${response.status}`);
  return response.json();
}

function subRecord(userId: string, email: string, tier: string, period: string, sub: any) {
  return {
    user_id: userId,
    email: email || undefined,
    plan_tier: tier || sub.metadata?.plan_tier || undefined,
    plan_period: period || sub.metadata?.plan_period || undefined,
    status: sub.status,
    current_period_end: sub.current_period_end ? sub.current_period_end * 1000 : undefined,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    amount: sub.items?.data?.[0]?.price?.unit_amount ?? undefined,
    currency: sub.currency || 'usd',
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '',
    stripe_subscription_id: sub.id,
    created_by_id: userId,
  };
}

async function grantSubscription(
  base44: any,
  userId: string,
  email: string,
  tier: string,
  period: string,
  sub: any,
) {
  const record = subRecord(userId, email, tier, period, sub);
  const existing = await base44.asServiceRole.entities.Subscription.filter(
    { stripe_subscription_id: sub.id },
    '-created_date',
    1,
  );
  if (existing?.length)
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, record);
  else await base44.asServiceRole.entities.Subscription.create(record);
}

async function syncSubscription(base44: any, sub: any) {
  const existing = await base44.asServiceRole.entities.Subscription.filter(
    { stripe_subscription_id: sub.id },
    '-created_date',
    1,
  );
  if (existing?.length) {
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
      status: sub.status,
      current_period_end: sub.current_period_end ? sub.current_period_end * 1000 : undefined,
      cancel_at_period_end: !!sub.cancel_at_period_end,
    });
  } else if (sub.metadata?.user_id) {
    await grantSubscription(
      base44,
      sub.metadata.user_id,
      '',
      sub.metadata.plan_tier || '',
      sub.metadata.plan_period || '',
      sub,
    );
  }
}

async function processEvent(
  event: any,
  base44: any,
  getEnv: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
) {
  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data?.object || {};
    if (sub.id) await syncSubscription(base44, sub);
    return { received: true };
  }
  if (event.type !== 'checkout.session.completed') return { received: true, ignored: true };
  const session = event.data?.object || {};
  const sessionId = typeof session.id === 'string' ? session.id : '';
  if (!sessionId) throw new Error('missing session id');
  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

  if (session.mode === 'subscription' || metadata.plan_tier) {
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const userId =
      typeof metadata.user_id === 'string'
        ? metadata.user_id
        : typeof session.client_reference_id === 'string'
          ? session.client_reference_id
          : '';
    const email = session.customer_details?.email || session.customer_email || '';
    if (!subscriptionId || !userId) return { received: true, ignored: true };
    const sub = await getStripeSub(subscriptionId, getEnv, fetchImpl);
    await grantSubscription(
      base44,
      userId,
      email,
      metadata.plan_tier || '',
      metadata.plan_period || '',
      sub,
    );
    await forwardToN8n(
      {
        source: 'base44',
        app: 'main',
        event: 'subscription.started',
        user_id: userId,
        tier: metadata.plan_tier || null,
        period: metadata.plan_period || null,
        sessionId,
        ts: Date.now(),
      },
      getEnv,
      fetchImpl,
    );
    return { received: true };
  }

  const amountTotal = Number(session.amount_total || 0);
  if (!Number.isFinite(amountTotal) || amountTotal < 0) throw new Error('invalid amount');
  const amountUsd = amountTotal / 100;
  const email =
    typeof session.customer_details?.email === 'string'
      ? session.customer_details.email
      : typeof session.customer_email === 'string'
        ? session.customer_email
        : '';
  const funding = base44.asServiceRole.entities.FundingLead;
  const purchase = base44.asServiceRole.entities.Purchase;
  const duplicateFunding = await funding.filter({ ext_ref: sessionId }, '-created_date', 1);
  if (duplicateFunding?.length) return { received: true, duplicate: true };
  const existingPurchases = metadata.item_id
    ? await purchase.filter({ stripe_session_id: sessionId }, '-created_date', 1)
    : [];
  const hasPurchase = !!existingPurchases?.length;

  if (metadata.item_id) {
    if (metadata.user_id && !hasPurchase) {
      await purchase.create({
        user_id: metadata.user_id,
        item_id: metadata.item_id,
        item_title: typeof metadata.item_title === 'string' ? metadata.item_title : undefined,
        amount_usd: amountUsd || undefined,
        stripe_session_id: sessionId,
        status: 'paid',
      });
    }
    if (!hasPurchase) {
      const item = await base44.asServiceRole.entities.StoreItem.get(metadata.item_id);
      if (!item) throw new Error('store item not found');
      await base44.asServiceRole.entities.StoreItem.update(metadata.item_id, {
        edition_sold: (Number(item.edition_sold) || 0) + 1,
      });
    }
  }

  await funding.create({
    email: email || 'unknown',
    amount: amountUsd || undefined,
    channel: 'stripe',
    message: metadata.item_id
      ? `Purchase: ${metadata.item_title || metadata.item_id}`
      : 'Donation — Field Offensive',
    ext_ref: sessionId,
  });
  await forwardToN8n(
    {
      source: 'base44',
      app: 'main',
      event: metadata.item_id ? 'purchase.completed' : 'donation.completed',
      amountUsd,
      email: email || 'unknown',
      item: metadata.item_id ? { id: metadata.item_id, title: metadata.item_title || null } : null,
      sessionId,
      ts: Date.now(),
    },
    getEnv,
    fetchImpl,
  );
  return { received: true };
}

export async function handleStripeWebhook(
  req: Request,
  {
    createClientFromRequest,
    getEnv = (name) => Deno.env.get(name),
    fetchImpl = fetch,
    now = () => Date.now(),
    inFlight = new Map(),
  }: Dependencies,
) {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
  const rawBody = await req.text();
  const timestamp = await verifyStripeSignature(
    rawBody,
    req.headers.get('stripe-signature') || '',
    getEnv('STRIPE_WEBHOOK_SECRET') || '',
    now(),
  );
  if (!timestamp) return Response.json({ error: 'Invalid signature' }, { status: 401 });
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid event body' }, { status: 400 });
  }
  const key =
    typeof event.id === 'string' ? event.id : `${event.type || ''}:${event.data?.object?.id || ''}`;
  if (!key || key === ':') return Response.json({ error: 'Invalid event' }, { status: 400 });
  const existing = inFlight.get(key);
  if (existing) return Response.json(await existing);
  const operation = (async () => {
    try {
      const result = await processEvent(event, createClientFromRequest(req), getEnv, fetchImpl);
      return { status: 200, body: result };
    } catch (error) {
      console.error('stripeWebhook failed:', error instanceof Error ? error.name : 'unknown');
      return { status: 500, body: { error: 'Webhook processing unavailable' } };
    }
  })();
  inFlight.set(key, operation);
  try {
    const result = await operation;
    return Response.json(result.body, { status: result.status });
  } finally {
    inFlight.delete(key);
  }
}
