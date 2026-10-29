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
class BodyTooLarge extends Error {}

// Reads the request body as a stream and counts the bytes actually received, so a missing or
// wrong Content-Length (and multibyte text, where string length != byte length) cannot bypass
// the cap. The stream is cancelled as soon as the cap is exceeded.
async function readBoundedBody(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLarge();
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLarge();
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(all);
}

// Model output is untrusted text. Keep only the fields the schema declares, with the declared
// type, enum membership and a length bound; everything else is dropped. Strings stay plain text
// (the UI renders them as text, never as HTML).
const MAX_STRING_CHARS = 4000;
const MAX_ARRAY_ITEMS = 20;
const MAX_ARRAY_ITEM_CHARS = 100;

function cleanString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, max);
}

export function sanitizeDetection(raw: unknown, schema: any): Record<string, unknown> | null {
  const source =
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    typeof (raw as any).response === 'object'
      ? (raw as any).response
      : raw;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const props: Record<string, any> = schema?.properties ?? {};
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(props)) {
    const value = (source as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    if (def.type === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (def.type === 'number') {
      if (typeof value === 'number' && Number.isFinite(value))
        out[key] = Math.min(1, Math.max(0, value));
    } else if (def.type === 'string') {
      const text = cleanString(value, MAX_STRING_CHARS);
      if (text === undefined) continue;
      if (Array.isArray(def.enum) && !def.enum.includes(text)) continue;
      out[key] = text;
    } else if (def.type === 'array' && def.items?.type === 'string') {
      if (!Array.isArray(value)) continue;
      out[key] = value
        .map((item) => cleanString(item, MAX_ARRAY_ITEM_CHARS))
        .filter((item): item is string => !!item)
        .slice(0, MAX_ARRAY_ITEMS);
    }
  }
  for (const key of Array.isArray(schema?.required) ? schema.required : []) {
    if (!(key in out)) return null;
  }
  return out;
}

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

    // Identity is verified; only now read (byte-bounded) input.
    let raw: string;
    try {
      raw = await readBoundedBody(req, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLarge) {
        return Response.json({ error: 'Request too large' }, { status: 413 });
      }
      raw = '';
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
    const provider = Promise.resolve(
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: 'claude_sonnet_4_6',
        response_json_schema: detectionSchema,
      }),
    );
    // If the timeout wins, the provider promise may still settle (or reject) later; observe it so
    // a late failure is not an unhandled rejection. This does not cancel the provider call.
    provider.catch(() => {});
    const result = await Promise.race([
      provider,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ScanTimeout()), timeoutMs);
      }),
    ]).finally(() => clearTimeout(timer));
    const detection = sanitizeDetection(result, detectionSchema);
    if (!detection || JSON.stringify(detection).length > MAX_RESULT_BYTES) {
      return Response.json({ error: 'Scan unavailable' }, { status: 502 });
    }
    return Response.json({ detection });
  } catch (error) {
    // Log a constant class name only: provider messages can echo prompts, URLs or internals.
    console.error('scanAd error:', error instanceof ScanTimeout ? 'timeout' : 'failure');
    if (error instanceof ScanTimeout) {
      return Response.json({ error: 'Scan timed out' }, { status: 504 });
    }
    return Response.json({ error: 'Scan unavailable' }, { status: 502 });
  }
}
