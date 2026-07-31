import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Stripe webhook — verifies signature via Web Crypto HMAC-SHA256 (no SDK needed).
// Handles checkout.session.completed: records donations + product purchases.

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !secret) return null;
  const parts = signatureHeader.split(",");
  let ts = "", v1 = "";
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") ts = v;
    if (k === "v1") v1 = v;
  }
  if (!ts || !v1) return null;

  // Reject replays older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (age > 300 || age < -5) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}.${rawBody}`)
  );
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison
  if (computed.length !== v1.length) return null;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0 ? parseInt(ts, 10) : null;
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("stripe-signature") || "";
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    const ts = await verifyStripeSignature(rawBody, signatureHeader, secret);
    if (!ts) {
      console.error("Stripe webhook: signature verification failed");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const base44 = createClientFromRequest(req);

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      const amountTotal = session.amount_total || 0;
      const amountUsd = amountTotal / 100;
      const email = session.customer_details?.email || session.customer_email || "";

      console.log(`Stripe webhook: session ${session.id} · $${amountUsd} · ${email || "no email"}`);

      // Idempotency — Stripe guarantees at-least-once delivery, so a timeout or
      // retry can re-deliver this event. Skip if this session is already recorded.
      try {
        const dup = await base44.asServiceRole.entities.FundingLead.filter({ ext_ref: session.id }, "-created_date", 1);
        if (dup && dup.length) {
          console.log(`Stripe webhook: duplicate session ${session.id} — already recorded, skipping`);
          return Response.json({ received: true, duplicate: true });
        }
      } catch (err) {
        console.error("Stripe webhook: idempotency check failed, proceeding:", err?.message);
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
          console.error("Stripe webhook: failed to update StoreItem:", err?.message);
        }
      }

      // Record the funding lead (donation or purchase)
      try {
        await base44.asServiceRole.entities.FundingLead.create({
          email: email || "unknown",
          amount: amountUsd || undefined,
          channel: metadata.item_id ? "stripe" : "stripe",
          message: metadata.item_id
            ? `Purchase: ${metadata.item_title || metadata.item_id}`
            : "Donation — Field Offensive",
          ext_ref: session.id,
        });
        console.log("Stripe webhook: FundingLead created");
      } catch (err) {
        console.error("Stripe webhook: failed to create FundingLead:", err?.message);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});