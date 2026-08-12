import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.item_id || '');
    if (!itemId) return Response.json({ error: 'Missing item_id' }, { status: 400 });

    // Server-authoritative lookup: never trust a client-sent price.
    const base44 = createClientFromRequest(req);
    // Durable entitlement: a paid purchase must be tied to an account so the
    // buyer gets lasting access to what they bought.
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }
    if (!caller?.id) return Response.json({ error: 'login_required' }, { status: 401 });
    const item = await base44.asServiceRole.entities.StoreItem.get(itemId);
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.status !== 'available')
      return Response.json({ error: 'Item not available for purchase' }, { status: 400 });

    const amount = Math.round(Number(item.price_usd) * 100);
    if (!amount || amount < 100) return Response.json({ error: 'Invalid price' }, { status: 400 });

    const ALLOWED_ORIGINS = new Set([
      'https://oohearth.app',
      'https://www.oohearth.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ]);
    const rawOrigin = req.headers.get('origin');
    const origin = rawOrigin && ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://oohearth.app';

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${origin}/store?status=thanks&item=${itemId}`);
    params.set('cancel_url', `${origin}/store?status=cancelled`);
    params.set('payment_method_types[0]', 'card');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(amount));
    params.set('line_items[0][price_data][product_data][name]', `OOH Earth — ${item.title}`);
    if (item.image_url)
      params.set('line_items[0][price_data][product_data][images][0]', item.image_url);
    params.set('metadata[base44_app_id]', Deno.env.get('BASE44_APP_ID') || '');
    params.set('metadata[item_id]', itemId);
    params.set('metadata[item_title]', item.title);
    params.set('metadata[user_id]', caller.id);

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
      console.error('Stripe product checkout error:', JSON.stringify(data));
      return Response.json({ error: data?.error?.message || 'Checkout failed' }, { status: 400 });
    }

    return Response.json({ url: data.url });
  } catch (error) {
    console.error('createProductCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
