const MAX_FILE_URL_LENGTH = 2048;
const MEDIA_HOST = 'media.base44.com';
// Base44's UploadFile integration returns files under this API host, which
// redirects to MEDIA_HOST — the redirect isn't followed here, so the API
// shape itself is allowlisted, scoped tightly to this app's own public files.
const API_HOST = 'base44.app';
const API_FILE_PATH = /^\/api\/apps\/([^/]+)\/files\/mp\/public\/([^/]+)\/[^/]+$/;

// Request/response bounds. The file URL is the only client input, so a small body is plenty.
// The timeout bounds how long *this function* waits; it cannot cancel the provider call (the SDK
// exposes no documented abort option), so a timed-out call may still consume credits.
const MAX_BODY_BYTES = 8 * 1024;
const MAX_RESULT_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 45_000;

// Identity comes only from the verified request token via auth.me(); body fields such as
// user_id / role / authenticated are never read.
const isAuthenticated = (user: any) => !!user?.id;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

class ScanTimeout extends Error {}

export function validateMediaUrl(value: unknown, currentAppId?: string) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_FILE_URL_LENGTH) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const isHttps = url.protocol === 'https:';
  if (!isHttps || url.username || url.password) return false;
  if (url.hostname === MEDIA_HOST) return true;
  if (url.hostname === API_HOST) {
    if (!currentAppId) return false;
    const match = url.pathname.match(API_FILE_PATH);
    if (!match) return false;
    const [, routeAppId, fileAppId] = match;
    return routeAppId === currentAppId && fileAppId === currentAppId;
  }
  return false;
}

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  getEnv?: (name: string) => string | undefined;
  timeoutMs?: number;
};

export async function handleScanAd(
  req: Request,
  {
    createClientFromRequest,
    getEnv = (name) => Deno.env.get(name),
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: Dependencies,
  detectionSchema: unknown,
  prompt: string,
) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }
    if (!isAuthenticated(caller)) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Identity is verified; only now read (bounded) input.
    const declared = Number(req.headers.get('content-length') || 0);
    if (declared > MAX_BODY_BYTES) {
      return Response.json({ error: 'Request too large' }, { status: 413 });
    }
    const raw = await req.text().catch(() => '');
    if (raw.length > MAX_BODY_BYTES) {
      return Response.json({ error: 'Request too large' }, { status: 413 });
    }
    let body: unknown = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }
    const { file_url } = isPlainObject(body) ? body : ({} as Record<string, unknown>);
    if (!validateMediaUrl(file_url, getEnv('BASE44_APP_ID'))) {
      return Response.json(
        { error: 'file_url must be an HTTPS Base44 media image URL' },
        { status: 400 },
      );
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: 'claude_sonnet_4_6',
        response_json_schema: detectionSchema,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ScanTimeout()), timeoutMs);
      }),
    ]).finally(() => clearTimeout(timer));
    if (JSON.stringify(result ?? null).length > MAX_RESULT_BYTES) {
      return Response.json({ error: 'Scan unavailable' }, { status: 502 });
    }
    return Response.json({ detection: result });
  } catch (error) {
    // Log a constant class name only: provider messages can echo prompts, URLs or internals.
    console.error('scanAd error:', error instanceof ScanTimeout ? 'timeout' : 'failure');
    if (error instanceof ScanTimeout) {
      return Response.json({ error: 'Scan timed out' }, { status: 504 });
    }
    return Response.json({ error: 'Scan unavailable' }, { status: 502 });
  }
}
