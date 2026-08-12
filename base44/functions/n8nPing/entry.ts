// n8nPing — Base44 → n8n bridge test.
// Proves the Base44 -> n8n webhook end-to-end: hitting this endpoint POSTs a
// test payload to the n8n Webhook node URL stored in Base44 Secrets as
// N8N_WEBHOOK_URL, then returns n8n's response so we can confirm the round trip.
//
// Once the bridge is proven, real functions (donation events, record changes,
// etc.) reuse this same forward() pattern instead of calling n8n inline.

async function forward(url: string, payload: unknown) {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body: unknown = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text; // n8n often replies with a plain string or empty 200
  }
  return { status: res.status, ok: res.ok, ms: Date.now() - started, body };
}

Deno.serve(async (req) => {
  const url = Deno.env.get('N8N_WEBHOOK_URL') || '';
  if (!url) {
    return Response.json(
      {
        ok: false,
        reason: 'N8N_WEBHOOK_URL not set',
        hint: 'Add the n8n Webhook node URL to Base44 Secrets, then call this endpoint again.',
      },
      { status: 200 },
    );
  }

  // Allow a custom note via ?note= or JSON body {note}, otherwise default.
  let note = new URL(req.url).searchParams.get('note') || '';
  if (!note && req.method === 'POST') {
    try {
      const j = await req.json();
      note = j && typeof j.note === 'string' ? j.note : '';
    } catch {
      /* no/invalid body — fine */
    }
  }

  const payload = {
    source: 'base44',
    app: 'MAIN',
    appId: Deno.env.get('BASE44_APP_ID') || null,
    event: 'bridge.ping',
    note: note || 'hello from OOH Earth MAIN',
    ts: Date.now(),
  };

  try {
    const forwarded = await forward(url, payload);
    return Response.json({ ok: forwarded.ok, sent: payload, n8n: forwarded }, { status: 200 });
  } catch (error) {
    return Response.json(
      { ok: false, sent: payload, error: (error as Error).message },
      { status: 200 },
    );
  }
});
