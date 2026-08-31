import { correlationHeaders, telemetryFor } from './telemetry.ts';

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  recordHealth?: (
    outcome: 'success' | 'failed',
    durationMs: number,
    errorCode?: string,
  ) => Promise<void> | void;
  getEnv?: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  inFlight?: Map<string, Promise<unknown>>;
};

const LEDGER_STALE_MS = 10 * 60 * 1000;
const TELEMETRY_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

function telemetryEventType(value: unknown) {
  return typeof value === 'string' && TELEMETRY_EVENT_TYPES.has(value) ? value : 'other';
}

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

function eventBusinessKey(event: any) {
  const object = event.data?.object || {};
  if (event.type === 'checkout.session.completed' && typeof object.id === 'string')
    return `checkout:${object.id}`;
  return `event:${event.id}`;
}

function ledgerEntity(base44: any) {
  const entity = base44.asServiceRole?.entities?.StripeEvent;
  if (!entity) throw new Error('stripe ledger unavailable');
  return entity;
}

async function updateLedger(ledger: any, id: string, patch: Record<string, unknown>) {
  await ledger.update(id, patch);
}

async function beginLedger(base44: any, event: any, now: number) {
  const ledger = ledgerEntity(base44);
  const eventId = String(event.id);
  const businessKey = eventBusinessKey(event);
  const existing = (
    await ledger.filter({ provider: 'stripe', event_id: eventId }, '-created_date', 1)
  )?.[0];
  if (existing?.status === 'completed') return { ledger, record: existing, duplicate: true };
  if (
    existing?.status === 'processing' &&
    Number(existing.processing_started_at || 0) > now - LEDGER_STALE_MS
  )
    return { ledger, record: existing, retryable: true };

  const priorBusiness =
    (
      await ledger.filter({ provider: 'stripe', business_key: businessKey }, '-created_date', 1)
    )?.[0] || null;
  const canonical = priorBusiness?.status === 'completed' ? priorBusiness : null;
  if (canonical && canonical.event_id !== eventId) {
    const record =
      existing ||
      (await ledger.create({
        provider: 'stripe',
        event_id: eventId,
        event_type: String(event.type || ''),
        business_key: businessKey,
        status: 'completed',
        canonical_event_id: canonical.event_id,
        processed_at: now,
      }));
    if (existing)
      await updateLedger(ledger, existing.id, { status: 'completed', processed_at: now });
    return { ledger, record, duplicate: true };
  }

  const prior = priorBusiness && priorBusiness.event_id !== eventId ? priorBusiness : null;
  const record =
    existing ||
    (await ledger.create({
      provider: 'stripe',
      event_id: eventId,
      event_type: String(event.type || ''),
      business_key: businessKey,
      session_id: businessKey.startsWith('checkout:') ? businessKey.slice(9) : undefined,
      status: 'processing',
      purchase_status: prior?.purchase_status || 'pending',
      inventory_status: prior?.inventory_status || 'pending',
      funding_status: prior?.funding_status || 'pending',
      subscription_status: prior?.subscription_status || 'pending',
      canonical_event_id: prior?.event_id,
      processing_started_at: now,
      retry_count: 0,
    }));
  if (existing)
    await updateLedger(ledger, existing.id, {
      status: 'processing',
      processing_started_at: now,
      retry_count: Number(existing.retry_count || 0) + 1,
      last_error_code: undefined,
    });
  return { ledger, record, canonical: prior, duplicate: false };
}

async function failLedger(ledger: any, record: any, error: unknown, now: number) {
  try {
    await updateLedger(ledger, record.id, {
      status: 'failed_retryable',
      failed_at: now,
      last_error_code: error instanceof Error ? error.name.slice(0, 80) : 'processing_failed',
    });
  } catch (ledgerError) {
    console.error(
      'stripe ledger failure update:',
      ledgerError instanceof Error ? ledgerError.name : 'unknown',
    );
  }
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
  ledger: any,
  record: any,
) {
  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data?.object || {};
    if (sub.id) {
      await syncSubscription(base44, sub);
      await updateLedger(ledger, record.id, { subscription_status: 'completed' });
    }
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
    if (record.subscription_status !== 'completed') {
      const sub = await getStripeSub(subscriptionId, getEnv, fetchImpl);
      await grantSubscription(
        base44,
        userId,
        email,
        metadata.plan_tier || '',
        metadata.plan_period || '',
        sub,
      );
      await updateLedger(ledger, record.id, {
        subscription_id: subscriptionId,
        subscription_status: 'completed',
      });
    }
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
  if (record.funding_status !== 'completed' && duplicateFunding?.length)
    await updateLedger(ledger, record.id, { funding_status: 'completed' });

  if (metadata.item_id) {
    const existingPurchases = await purchase.filter(
      { stripe_session_id: sessionId },
      '-created_date',
      1,
    );
    if (record.purchase_status !== 'completed') {
      if (!existingPurchases?.length && metadata.user_id) {
        await purchase.create({
          user_id: metadata.user_id,
          item_id: metadata.item_id,
          item_title: typeof metadata.item_title === 'string' ? metadata.item_title : undefined,
          amount_usd: amountUsd || undefined,
          stripe_session_id: sessionId,
          status: 'paid',
        });
      }
      await updateLedger(ledger, record.id, { purchase_status: 'completed' });
    }
    if (record.inventory_status !== 'completed') {
      const item = await base44.asServiceRole.entities.StoreItem.get(metadata.item_id);
      if (!item) throw new Error('store item not found');
      await base44.asServiceRole.entities.StoreItem.update(metadata.item_id, {
        edition_sold: (Number(item.edition_sold) || 0) + 1,
      });
      await updateLedger(ledger, record.id, { inventory_status: 'completed' });
    }
  }

  if (record.funding_status !== 'completed') {
    if (!duplicateFunding?.length) {
      await funding.create({
        email: email || 'unknown',
        amount: amountUsd || undefined,
        channel: 'stripe',
        message: metadata.item_id
          ? `Purchase: ${metadata.item_title || metadata.item_id}`
          : 'Donation — Field Offensive',
        ext_ref: sessionId,
      });
    }
    await updateLedger(ledger, record.id, { funding_status: 'completed' });
  }
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
    recordHealth,
  }: Dependencies,
) {
  const telemetry = telemetryFor(req, { functionName: 'stripeWebhook', now, getEnv });
  telemetry.emit('received');
  const startedAt = now();
  if (req.method !== 'POST') {
    telemetry.finish('rejected', { error_code: 'INVALID_METHOD' });
    return Response.json(
      { error: 'POST only' },
      { status: 405, headers: correlationHeaders(telemetry) },
    );
  }
  const rawBody = await req.text();
  const currentTime = now();
  const timestamp = await verifyStripeSignature(
    rawBody,
    req.headers.get('stripe-signature') || '',
    getEnv('STRIPE_WEBHOOK_SECRET') || '',
    currentTime,
  );
  if (!timestamp) {
    telemetry.finish('rejected', { error_code: 'AUTH_REQUIRED' });
    return Response.json(
      { error: 'Invalid signature' },
      { status: 401, headers: correlationHeaders(telemetry) },
    );
  }
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return Response.json(
      { error: 'Invalid event body' },
      { status: 400, headers: correlationHeaders(telemetry) },
    );
  }
  const key = typeof event.id === 'string' ? event.id : '';
  if (!key || typeof event.type !== 'string') {
    telemetry.finish('rejected', { error_code: 'INVALID_INPUT' });
    return Response.json(
      { error: 'Invalid event' },
      { status: 400, headers: correlationHeaders(telemetry) },
    );
  }
  const existing = inFlight.get(key);
  if (existing) {
    const result: any = await existing;
    telemetry.finish(result.status === 200 ? 'success' : 'failed', {
      operation: 'replay',
      event_type: telemetryEventType(event.type),
      error_code: result.status === 200 ? undefined : 'REPLAY_CONFLICT',
    });
    await recordHealth?.(
      result.status === 200 ? 'success' : 'failed',
      now() - startedAt,
      result.status === 200 ? undefined : 'DEPENDENCY_FAILURE',
    );
    return Response.json(result.body, {
      status: result.status,
      headers: correlationHeaders(telemetry),
    });
  }
  const operation = (async () => {
    let ledger: any;
    let record: any;
    let canonical: any;
    try {
      const base44 = createClientFromRequest(req);
      const started = await beginLedger(base44, event, currentTime);
      ledger = started.ledger;
      record = started.record;
      canonical = started.canonical;
      if (started.duplicate) return { status: 200, body: { received: true, duplicate: true } };
      if (started.retryable)
        return { status: 500, body: { error: 'Webhook processing unavailable' } };
      const result = await processEvent(event, base44, getEnv, fetchImpl, ledger, record);
      await updateLedger(ledger, record.id, { status: 'completed', processed_at: now() });
      if (canonical)
        await updateLedger(ledger, canonical.id, { status: 'completed', processed_at: now() });
      return { status: 200, body: result };
    } catch (error) {
      if (ledger && record) await failLedger(ledger, record, error, now());
      console.error('stripeWebhook failed:', error instanceof Error ? error.name : 'unknown');
      return { status: 500, body: { error: 'Webhook processing unavailable' } };
    }
  })();
  inFlight.set(key, operation);
  try {
    const result: any = await operation;
    telemetry.finish(result.status === 200 ? 'success' : 'failed', {
      operation: result.status === 200 ? 'process' : 'retry',
      event_type: telemetryEventType(event.type),
      error_code: result.status === 200 ? undefined : 'DEPENDENCY_FAILURE',
      retryable: result.status >= 500,
    });
    await recordHealth?.(
      result.status === 200 ? 'success' : 'failed',
      now() - startedAt,
      result.status === 200 ? undefined : 'DEPENDENCY_FAILURE',
    );
    return Response.json(result.body, {
      status: result.status,
      headers: correlationHeaders(telemetry),
    });
  } finally {
    inFlight.delete(key);
  }
}
