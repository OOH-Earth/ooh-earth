Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Math.round(Number(body?.amount) * 100);
    if (!amount || amount < 100) {
      return Response.json({ error: "Invalid amount (minimum $1)" }, { status: 400 });
    }

    const ALLOWED_ORIGINS = new Set([
      "https://oohearth.app",
      "https://www.oohearth.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ]);
    const rawOrigin = req.headers.get("origin");
    const origin = rawOrigin && ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : "https://oohearth.app";

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/campaign?status=thanks`);
    params.set("cancel_url", `${origin}/campaign?status=cancelled`);
    params.set("payment_method_types[0]", "card");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(amount));
    params.set("line_items[0][price_data][product_data][name]", "OOH Earth — Field Offensive");
    params.set("metadata[base44_app_id]", Deno.env.get("BASE44_APP_ID") || "");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Stripe checkout error:", JSON.stringify(data));
      return Response.json({ error: data?.error?.message || "Checkout failed" }, { status: 400 });
    }

    return Response.json({ url: data.url });
  } catch (error) {
    console.error("createDonationCheckout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});