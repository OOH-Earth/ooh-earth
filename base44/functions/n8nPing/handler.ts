const NOTE_MAX = 500;
const WEBHOOK_TIMEOUT_MS = 5000;
const isPlatformAdmin = (user: any) => (user?.role ?? user?.data?.role) === 'admin';

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  fetchImpl?: typeof fetch;
  getEnv?: (name: string) => string | undefined;
  timeoutMs?: number;
};

async function forward(url: string, payload: unknown, fetchImpl: typeof fetch, timeoutMs: number) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    return { status: res.status, ok: res.ok, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleN8nPing(
  req: Request,
  {
    createClientFromRequest,
    fetchImpl = fetch,
    getEnv = (name) => Deno.env.get(name),
    timeoutMs = WEBHOOK_TIMEOUT_MS,
  }: Dependencies,
) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!isPlatformAdmin(caller)) {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }
  } catch {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const url = getEnv('N8N_WEBHOOK_URL') || '';
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

  let note = '';
  try {
    const j = await req.json();
    if (j?.note !== undefined && typeof j.note !== 'string') {
      return Response.json({ error: 'note must be a string' }, { status: 400 });
    }
    note = String(j?.note || '').trim();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (note.length > NOTE_MAX) {
    return Response.json(
      { error: `note must be ${NOTE_MAX} characters or fewer` },
      { status: 400 },
    );
  }

  const payload = {
    source: 'base44',
    app: 'MAIN',
    appId: getEnv('BASE44_APP_ID') || null,
    event: 'bridge.ping',
    note: note || 'hello from OOH Earth MAIN',
    ts: Date.now(),
  };

  try {
    const forwarded = await forward(url, payload, fetchImpl, timeoutMs);
    return Response.json({ ok: forwarded.ok, n8n: forwarded }, { status: 200 });
  } catch (error) {
    console.error('n8nPing forward failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ ok: false, error: 'Webhook unavailable' }, { status: 502 });
  }
}
