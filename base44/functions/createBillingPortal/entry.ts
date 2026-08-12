import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// createBillingPortal — opens the Stripe Customer Portal so a supporter can
// manage or cancel their subscription. The customer id is looked up from the
// user's own Subscription record server-side; a client-sent id is never trusted.
//
// NOTE: the Customer Portal must be activated once in the Stripe Dashboard
// (Settings → Billing → Customer portal). If it isn't, Stripe returns an error.

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

    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { user_id: caller.id },
      '-created_date',
      1,
    );
    const sub = subs?.[0];
    if (!sub?.stripe_customer_id)
      return Response.json({ error: 'no_subscription' }, { status: 404 });

    const rawOrigin = req.headers.get('origin');
    const origin = rawOrigin && ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://oohearth.app';

    const params = new URLSearchParams();
    params.set('customer', sub.stripe_customer_id);
    params.set('return_url', `${origin}/plans`);

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('createBillingPortal error:', JSON.stringify(data));
      return Response.json(
        { error: data?.error?.message || 'Portal unavailable' },
        { status: 400 },
      );
    }
    return Response.json({ url: data.url });
  } catch (error) {
    console.error('createBillingPortal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
