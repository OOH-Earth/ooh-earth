import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Preferred live source: a static JSON feed you publish on oohearth.app.
// Static files aren't routed through the SG captcha, so this works from the
// backend the moment the file exists. Expected shape:
// [{ "title","address","lat","lng","link","image" }, ...]
const FEED_URL = 'https://oohearth.app/wp-content/uploads/ooh-locations.json';

// Strips HTML tags to a fixed point (loops until a pass makes no further
// change) rather than a single regex pass -- a single pass can leave
// fragments that recombine into a new tag (CodeQL
// js/incomplete-multi-character-sanitization), e.g. "<scr<script>ipt>"
// only fully resolves after repeated stripping.
function stripTags(s: string) {
  let prev;
  let cur = s;
  do {
    prev = cur;
    cur = cur.replace(/<[^>]+>/g, '');
  } while (cur !== prev);
  return cur;
}

Deno.serve(async (req) => {
  try {
    // 1) JSON feed (live, no captcha).
    try {
      const res = await fetch(FEED_URL, { headers: { accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.markers || data.locations || [];
        if (Array.isArray(list) && list.length) {
          const markers = list
            .map((m) => ({
              id: m.id != null ? String(m.id) : null,
              title: m.title || (m.address ? String(m.address).split(',')[0] : 'Location'),
              address: m.address || '',
              lat: parseFloat(m.lat ?? m.latitude),
              lng: parseFloat(m.lng ?? m.longitude),
              image: m.image || m.thumbnail || null,
              link:
                m.link ||
                (m.id != null
                  ? `https://oohearth.app/location/${m.id}/`
                  : 'https://oohearth.app/location/'),
            }))
            .filter((m) => isFinite(m.lat) && isFinite(m.lng));
          if (markers.length) return Response.json({ count: markers.length, markers, live: true });
        }
      }
    } catch (_) {}

    // 2) Fallback: scrape the public directory. Blocked by SG captcha from
    //    datacenter IPs, so this returns 0 until a feed is published.
    let pages = 4;
    try {
      const body = await req.json();
      if (body && body.pages) pages = Math.min(parseInt(body.pages, 10) || 4, 10);
    } catch (_) {}

    const markers = [];
    const seen = new Set();

    for (let p = 1; p <= pages; p++) {
      const url =
        p === 1 ? 'https://oohearth.app/location/' : `https://oohearth.app/location/page/${p}/`;
      let html;
      try {
        const res = await fetch(url, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
        });
        if (!res.ok) break;
        html = await res.text();
      } catch (_) {
        break;
      }

      const chunks = html.split(/location-directory&amp;location=|location-directory&location=/);
      if (chunks.length <= 1) break;
      let added = 0;
      for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];
        const q = chunk.indexOf('"');
        if (q === -1) continue;
        let raw = chunk.slice(0, q);
        try {
          raw = decodeURIComponent(raw);
        } catch (_) {}
        const semi = raw.lastIndexOf(';');
        if (semi === -1) continue;
        const address = raw.slice(0, semi).trim();
        const cp = raw
          .slice(semi + 1)
          .trim()
          .split(',');
        const lat = parseFloat(cp[0]);
        const lng = parseFloat(cp[1]);
        if (!isFinite(lat) || !isFinite(lng)) continue;
        const idMatch = chunk.match(/\/location\/(\d+)\//);
        const id = idMatch ? idMatch[1] : null;
        const key = id || `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        let image = null;
        const imgMatch = chunk.match(
          /src="(https:\/\/ooh\.earth\/wp-content\/uploads\/[^"]+\.(?:webp|jpe?g|png)[^"]*)"/i,
        );
        if (imgMatch) image = imgMatch[1].replace(/-\d+x\d+(?=\.\w+)/, '');
        let title = address.split(',')[0];
        const hMatch = chunk.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
        if (hMatch) {
          const t = stripTags(hMatch[1]).trim();
          if (t) title = t;
        }
        markers.push({
          id,
          title,
          address,
          lat,
          lng,
          image,
          link: id ? `https://oohearth.app/location/${id}/` : 'https://oohearth.app/location/',
        });
        added++;
      }
      if (added === 0) break;
    }

    return Response.json({ count: markers.length, markers, live: markers.length > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
