import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Stripe webhook — verifies signature via Web Crypto HMAC-SHA256 (no SDK needed).
// Handles: checkout.session.completed (one-time donations/purchases AND supporter
// subscriptions), and customer.subscription.updated/deleted (lifecycle → grant
// state on the Subscription entity).

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !secret) return null;
  const parts = signatureHeader.split(',');
  let ts = '',
    v1 = '';
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') ts = v;
    if (k === 'v1') v1 = v;
  }
  if (!ts || !v1) return null;

  // Reject replays older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (age > 300 || age < -5) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${rawBody}`));
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  if (computed.length !== v1.length) return null;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0 ? parseInt(ts, 10) : null;
}

// Forward a confirmed funding event to the n8n automation hub.
// Non-fatal by design: the donation/purchase must still succeed if n8n is down,
// so every error is swallowed and a 5s timeout prevents holding up Stripe's ack.
async function forwardToN8n(payload: unknown) {
  const url = Deno.env.get('N8N_WEBHOOK_URL') || '';
  if (!url) return; // bridge not configured — skip silently
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    console.log(`n8n forward: ${res.status}`);
  } catch (err) {
    console.error('n8n forward failed (non-fatal):', (err as Error)?.message);
  }
}

// ── subscription helpers ──────────────────────────────────────
async function getStripeSub(id: string) {
  const r = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
  });
  if (!r.ok) throw new Error(`Stripe subscription fetch ${r.status}`);
  return await r.json();
}

// Upsert a Subscription record from a full Stripe subscription object.
function subRecord(userId: string, email: string, tier: string, period: string, sub: any) {
  const planTier = tier || sub.metadata?.plan_tier || undefined;
  const planPeriod = period || sub.metadata?.plan_period || undefined;
  return {
    user_id: userId,
    email: email || undefined,
    plan_tier: planTier, // omit if unknown (enum-safe)
    plan_period: planPeriod,
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
  const rec = subRecord(userId, email, tier, period, sub);
  const existing = await base44.asServiceRole.entities.Subscription.filter(
    { stripe_subscription_id: sub.id },
    '-created_date',
    1,
  );
  if (existing && existing.length)
    await base44.asServiceRole.entities.Subscription.update(existing[0].id, rec);
  else await base44.asServiceRole.entities.Subscription.create(rec);
}

// Lifecycle event → patch status/period on the existing record (never clobber
// user_id/email); create from metadata only if we somehow never saw it.
async function syncSubscription(base44: any, sub: any) {
  const existing = await base44.asServiceRole.entities.Subscription.filter(
    { stripe_subscription_id: sub.id },
    '-created_date',
    1,
  );
  if (existing && existing.length) {
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

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('stripe-signature') || '';
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    const ts = await verifyStripeSignature(rawBody, signatureHeader, secret);
    if (!ts) {
      console.error('Stripe webhook: signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const base44 = createClientFromRequest(req);

    // ── subscription lifecycle ──
    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      try {
        const sub = event.data?.object || {};
        if (sub?.id) {
          await syncSubscription(base44, sub);
          console.log(`Stripe webhook: ${event.type} → sub ${sub.id} status ${sub.status}`);
        }
      } catch (err) {
        console.error(`Stripe webhook: ${event.type} failed:`, err?.message);
      }
      return Response.json({ received: true });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};

      // ── supporter subscription → record/grant the plan ──
      if (session.mode === 'subscription' || metadata.plan_tier) {
        try {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id;
          const userId = metadata.user_id || session.client_reference_id || '';
          const email = session.customer_details?.email || session.customer_email || '';
          if (subId && userId) {
            const sub = await getStripeSub(subId);
            await grantSubscription(
              base44,
              userId,
              email,
              metadata.plan_tier || '',
              metadata.plan_period || '',
              sub,
            );
            console.log(
              `Stripe webhook: subscription granted → user ${userId} (${metadata.plan_tier || sub.status})`,
            );
            await forwardToN8n({
              source: 'base44',
              app: 'main',
              event: 'subscription.started',
              user_id: userId,
              tier: metadata.plan_tier || null,
              period: metadata.plan_period || null,
              sessionId: session.id,
              ts: Date.now(),
            });
          } else {
            console.error('Stripe webhook: subscription checkout missing subId/userId');
          }
        } catch (err) {
          console.error('Stripe webhook: subscription grant failed:', err?.message);
        }
        return Response.json({ received: true });
      }

      // ── one-time donation / purchase ──
      const amountTotal = session.amount_total || 0;
      const amountUsd = amountTotal / 100;
      const email = session.customer_details?.email || session.customer_email || '';

      console.log(`Stripe webhook: session ${session.id} · $${amountUsd} · ${email || 'no email'}`);

      // Idempotency — Stripe guarantees at-least-once delivery, so a timeout or
      // retry can re-deliver this event. Skip if this session is already recorded.
      try {
        const dup = await base44.asServiceRole.entities.FundingLead.filter(
          { ext_ref: session.id },
          '-created_date',
          1,
        );
        if (dup && dup.length) {
          console.log(
            `Stripe webhook: duplicate session ${session.id} — already recorded, skipping`,
          );
          return Response.json({ received: true, duplicate: true });
        }
      } catch (err) {
        console.error('Stripe webhook: idempotency check failed, proceeding:', err?.message);
      }

      // Product purchase — increment edition_sold
      if (metadata.item_id) {
        try {
          const item = await base44.asServiceRole.entities.StoreItem.get(metadata.item_id);
          if (item) {
            const newSold = (item.edition_sold || 0) + 1;
            await base44.asServiceRole.entities.StoreItem.update(metadata.item_id, {
              edition_sold: newSold,
            });
            console.log(`Stripe webhook: StoreItem ${metadata.item_id} edition_sold → ${newSold}`);
          }
        } catch (err) {
          console.error('Stripe webhook: failed to update StoreItem:', err?.message);
        }
        // Entitlement — grant the buyer durable access. Idempotent via the outer
        // FundingLead ext_ref dedupe (this whole branch is skipped on retry).
        if (metadata.user_id) {
          try {
            await base44.asServiceRole.entities.Purchase.create({
              user_id: metadata.user_id,
              item_id: metadata.item_id,
              item_title: metadata.item_title || undefined,
              amount_usd: amountUsd || undefined,
              stripe_session_id: session.id,
              status: 'paid',
            });
            console.log(
              `Stripe webhook: Purchase granted → user ${metadata.user_id} · item ${metadata.item_id}`,
            );
          } catch (err) {
            console.error('Stripe webhook: failed to create Purchase:', err?.message);
          }
        }
      }

      // Record the funding lead (donation or purchase)
      try {
        await base44.asServiceRole.entities.FundingLead.create({
          email: email || 'unknown',
          amount: amountUsd || undefined,
          channel: metadata.item_id ? 'stripe' : 'stripe',
          message: metadata.item_id
            ? `Purchase: ${metadata.item_title || metadata.item_id}`
            : 'Donation — Field Offensive',
          ext_ref: session.id,
        });
        console.log('Stripe webhook: FundingLead created');
      } catch (err) {
        console.error('Stripe webhook: failed to create FundingLead:', err?.message);
      }

      // Fire the automation bridge — confirmed funding event → n8n hub.
      await forwardToN8n({
        source: 'base44',
        app: 'main',
        event: metadata.item_id ? 'purchase.completed' : 'donation.completed',
        amountUsd,
        email: email || 'unknown',
        item: metadata.item_id
          ? { id: metadata.item_id, title: metadata.item_title || null }
          : null,
        sessionId: session.id,
        ts: Date.now(),
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
