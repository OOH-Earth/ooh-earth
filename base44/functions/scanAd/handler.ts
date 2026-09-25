const MAX_FILE_URL_LENGTH = 2048;
const MEDIA_HOST = 'media.base44.com';
// Base44's UploadFile integration returns files under this API host, which
// redirects to MEDIA_HOST — the redirect isn't followed here, so the API
// shape itself is allowlisted, scoped tightly to this app's own public files.
const API_HOST = 'base44.app';
const API_FILE_PATH = /^\/api\/apps\/([^/]+)\/files\/mp\/public\/([^/]+)\/[^/]+$/;

const isAuthenticated = (user: any) => !!user?.id;

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
};

export async function handleScanAd(
  req: Request,
  { createClientFromRequest, getEnv = (name) => Deno.env.get(name) }: Dependencies,
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

    const body = await req.json().catch(() => ({}));
    const { file_url } = body;
    if (!validateMediaUrl(file_url, getEnv('BASE44_APP_ID'))) {
      return Response.json(
        { error: 'file_url must be an HTTPS Base44 media image URL' },
        { status: 400 },
      );
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: 'claude_sonnet_4_6',
      response_json_schema: detectionSchema,
    });
    return Response.json({ detection: result });
  } catch (error) {
    console.error('scanAd error:', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'Scan unavailable' }, { status: 502 });
  }
}
