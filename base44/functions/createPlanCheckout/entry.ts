import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// createPlanCheckout — server-authoritative supporter-subscription checkout.
// The price + interval come from the PLANS table here, never from the client.
// A logged-in user is required (subscriptions attach to an account so we can
// grant benefits and let them manage/cancel later). Stripe Checkout runs in
// subscription mode; the webhook records the grant on completion.

const CURRENCY = 'usd';
// Server-authoritative supporter tiers. Three tiers × two billing periods.
// Annual = 10× monthly (two months free). Amounts in cents.
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }
    if (!caller?.id) return Response.json({ error: 'login_required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tier = String(body?.tier || '');
    const period = body?.period === 'year' ? 'year' : 'month';
    const plan = PLANS[tier];
    if (!plan) return Response.json({ error: 'Invalid plan' }, { status: 400 });
    const amount = plan[period];

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
    params.set('line_items[0][price_data][recurring][interval]', period);
    params.set('line_items[0][price_data][recurring][interval_count]', '1');
    params.set(
      'line_items[0][price_data][product_data][name]',
      `OOH Earth · ${plan.label} (${period === 'year' ? 'annual' : 'monthly'})`,
    );
    if (caller.email) params.set('customer_email', caller.email);
    params.set('client_reference_id', caller.id);
    params.set('metadata[base44_app_id]', Deno.env.get('BASE44_APP_ID') || '');
    params.set('metadata[user_id]', caller.id);
    params.set('metadata[plan_tier]', tier);
    params.set('metadata[plan_period]', period);
    // propagate to the subscription object so lifecycle events carry the user
    params.set('subscription_data[metadata][user_id]', caller.id);
    params.set('subscription_data[metadata][plan_tier]', tier);
    params.set('subscription_data[metadata][plan_period]', period);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('createPlanCheckout error:', JSON.stringify(data));
      return Response.json({ error: data?.error?.message || 'Checkout failed' }, { status: 400 });
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error('createPlanCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
