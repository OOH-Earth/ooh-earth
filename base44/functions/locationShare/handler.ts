const CANONICAL_ORIGIN = 'https://oohearth.app';
const FALLBACK_IMAGE =
  'https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/1625fc4b1_Screenshot2026-08-19at155752.png/v1/fill/w_1200,h_630/1625fc4b1_Screenshot2026-08-19at155752.png';
const APP_IDS = new Set(['6a62213cff3ccbca88c04ff5', '6a6748e009b947cb29591871']);
const LOCATION_FIELDS = ['id', 'title', 'type', 'status', 'image_url'];
const PHOTO_FIELDS = ['url', 'status', 'display_order'];
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function publicImage(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  if (parsed.hostname === 'media.base44.com') return parsed.toString();
  if (parsed.hostname !== 'base44.app') return null;
  const match = parsed.pathname.match(/^\/api\/apps\/([^/]+)\/files\/mp\/public\//);
  return match && APP_IDS.has(match[1]) ? parsed.toString() : null;
}

function htmlDocument({ title, description, image, canonical, status = 200 }: any) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeCanonical = escapeHtml(canonical);
  const body =
    status === 200
      ? `<main><h1>${safeTitle}</h1><p>${safeDescription}</p><p><a href="${safeCanonical}">Open this Location in OOH Earth</a></p></main>`
      : `<main><h1>${safeTitle}</h1><p>${safeDescription}</p><p><a href="${CANONICAL_ORIGIN}/">Open OOH Earth</a></p></main>`;
  const redirect =
    status === 200 ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">` : '';
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title><meta name="description" content="${safeDescription}"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:image" content="${safeImage}"><meta property="og:url" content="${safeCanonical}"><meta property="og:type" content="article"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${safeTitle}"><meta name="twitter:description" content="${safeDescription}"><meta name="twitter:image" content="${safeImage}"><link rel="canonical" href="${safeCanonical}"></head><body>${body}${redirect}</body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=300',
        'x-content-type-options': 'nosniff',
        'content-security-policy':
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';",
      },
    },
  );
}

export async function handleLocationShare(
  req: Request,
  { createClientFromRequest }: { createClientFromRequest: (req: Request) => any },
) {
  if (req.method !== 'GET')
    return htmlDocument({
      title: 'OOH Earth location share',
      description: 'Location sharing is available through a GET request.',
      image: FALLBACK_IMAGE,
      canonical: `${CANONICAL_ORIGIN}/`,
      status: 405,
    });

  const id = new URL(req.url).searchParams.get('id') || '';
  if (!ID_PATTERN.test(id))
    return htmlDocument({
      title: 'Location not found | OOH Earth',
      description: 'This OOH Earth Location is not available.',
      image: FALLBACK_IMAGE,
      canonical: `${CANONICAL_ORIGIN}/`,
      status: 404,
    });

  try {
    const client = createClientFromRequest(req).asServiceRole;
    const locations = await client.entities.Location.filter(
      { id },
      undefined,
      1,
      0,
      LOCATION_FIELDS,
    );
    const location = locations?.[0];
    if (!location || location.status !== 'verified')
      return htmlDocument({
        title: 'Location not found | OOH Earth',
        description: 'This OOH Earth Location is not publicly available.',
        image: FALLBACK_IMAGE,
        canonical: `${CANONICAL_ORIGIN}/`,
        status: 404,
      });

    const photos = await client.entities.LocationPhoto.filter(
      { location_id: id, status: 'verified' },
      'display_order',
      1,
      0,
      PHOTO_FIELDS,
    );
    const image =
      publicImage(location.image_url) || publicImage(photos?.[0]?.url) || FALLBACK_IMAGE;
    const title = `${String(location.title || 'Public Location').slice(0, 160)} | OOH Earth`;
    const type = String(location.type || 'location').slice(0, 64);
    const description = `Verified ${type} Location on OOH Earth.`;
    const canonical = `${CANONICAL_ORIGIN}/location/${encodeURIComponent(id)}`;
    return htmlDocument({ title, description, image, canonical });
  } catch {
    return htmlDocument({
      title: 'Location temporarily unavailable | OOH Earth',
      description: 'This OOH Earth Location is temporarily unavailable.',
      image: FALLBACK_IMAGE,
      canonical: `${CANONICAL_ORIGIN}/`,
      status: 503,
    });
  }
}
