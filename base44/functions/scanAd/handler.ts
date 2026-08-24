const MAX_FILE_URL_LENGTH = 2048;
const MEDIA_HOST = 'media.base44.com';

const isAuthenticated = (user: any) => !!user?.id;

export function validateMediaUrl(value: unknown) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_FILE_URL_LENGTH) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' && url.hostname === MEDIA_HOST && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
};

export async function handleScanAd(
  req: Request,
  { createClientFromRequest }: Dependencies,
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
    if (!validateMediaUrl(file_url)) {
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
