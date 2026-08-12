import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// fieldNews — the resistance intel stream for the ticker. Rethought to align
// directly with OOH Earth's protocol objectives:
//
//   • UN SDGs — especially SDG 11 (Sustainable Cities), SDG 13 (Climate Action),
//     SDG 16 (Peace, Justice & Strong Institutions).
//   • The Right to Respond — citizens' right to answer corporate speech in
//     public space (the visual commons as a democratic surface).
//   • The OOH revolution — subvertising, adbusting, billboard liberation,
//     ad-free city laws, greenwashing resistance.
//   • Open Access — public space as a shared, non-commercial resource.
//   • Global-South-led resistance — São Paulo, Grenoble, Chennai, and emerging.
//
// Builds a large rolling pool (~80), newest-first, every item linking to the
// real article/post. Refreshes every 6 hours (4×/day) so the stream stays fresh
// instead of going stale for 24 hours. Cached in IntelCache by 6-hour bucket.

const CACHE_KEY = 'fieldNews';
const FEED_VERSION = 'resist-3'; // bump to force a same-bucket rebuild when logic changes
const POOL = 80; // endless-stream pool size
const PER_FEED = 40; // items parsed per source
const MAX_AGE_MS = 120 * 24 * 60 * 60 * 1000; // surface items from the last ~4 months

// ── Movement / resistance feeds — the orgs' own words, real article links ──
const RSS_FEEDS = [
  { url: 'https://adfreecities.org.uk/feed/', source: 'Adfree Cities', cat: 'resist' },
  { url: 'https://brandalism.ch/feed/', source: 'Brandalism', cat: 'subvert' },
  { url: 'https://badverts.org/feed/', source: 'Badvertising', cat: 'climate' },
];

// ── Google News — mission-aligned queries, not ad-industry trade news ──
const GNEWS = [
  // Direct action: subvertising, adbusting, culture jamming, ad takeovers
  {
    q: '(subvertising OR adbusting OR brandalism OR "culture jamming" OR "billboard liberation" OR "ad busting" OR "subvertisers" OR "ad takeover" OR "subvertised") when:60d',
    cat: 'subvert',
  },
  // Ad-free cities, billboard bans, visual pollution, clean city laws
  {
    q: '("anti-advertising" OR "ad-free city" OR "ad-free" OR "reclaim public space" OR "advertising ban" OR "billboard ban" OR "visual pollution" OR "clean city law" OR "outdoor advertising" ban) (activist OR protest OR campaign OR movement OR community OR resist OR reclaim OR council OR government OR law) when:60d',
    cat: 'resist',
  },
  // Global-South leadership — cities removing billboards, reclaiming public space
  {
    q: '(billboard OR "outdoor advertising" OR hoarding OR "public space" OR "visual pollution") (ban OR removal OR protest OR reclaim OR activism OR "clean city" OR regulate OR law) ("São Paulo" OR Brazil OR India OR Chennai OR Mumbai OR Tehran OR Nairobi OR Lagos OR Jakarta OR Bogotá OR "Latin America" OR Africa OR "Global South" OR Philippines OR Indonesia OR Grenoble OR Geneva OR Croatia OR Tehran OR Lagos) when:120d',
    cat: 'south',
  },
  // Greenwashing, fossil-fuel ad bans, high-carbon advertising, climate justice
  {
    q: '("fossil fuel advertising" OR greenwashing OR "high-carbon advertising" OR "tobacco advertising" OR "junk food advertising" OR "suv advertising") (ban OR protest OR subvertising OR campaign OR activist OR climate OR regulation OR law) when:60d',
    cat: 'climate',
  },
  // UN SDG 11 / right to the city / public space as a democratic commons
  {
    q: '("right to the city" OR "urban commons" OR "visual commons" OR "SDG 11" OR "sustainable cities" OR "public space" OR "civic space") (advertising OR billboard OR corporate OR reclaim OR community OR commons OR democracy) when:90d',
    cat: 'rights',
  },
  // Right to respond / free expression in public space / counter-advertising
  {
    q: '("right to respond" OR "freedom of expression" OR "counter-advertising" OR "speech rights" OR "public speech" OR "political advertising") (billboard OR advertising OR "public space" OR protest OR corporate OR ban) when:120d',
    cat: 'rights',
  },
];

// ── Bluesky live search (best-effort; silent if the public endpoint needs auth) ──
const BSKY_TERMS = [
  'subvertising',
  'adbusting OR brandalism',
  'anti-advertising OR "ad free cities"',
  '"reclaim public space" OR "visual commons"',
  'greenwashing advertising ban',
];

// Resistance / rights-framed fallback (only if every live source fails).
// Every URL is a real, permanently-relevant article or organisation page.
const FALLBACK = [
  {
    title: "São Paulo's Clean City Law: the megacity that banned outdoor advertising",
    source: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Clean_City_Law',
    cat: 'south',
  },
  {
    title: 'Grenoble replaces street advertising with trees and community noticeboards',
    source: 'Adfree Cities',
    url: 'https://adfreecities.org.uk/',
    cat: 'resist',
  },
  {
    title:
      'Brandalism: activists replace bus-stop ads with anti-fossil-fuel artworks across Europe',
    source: 'Brandalism',
    url: 'https://brandalism.ch/',
    cat: 'subvert',
  },
  {
    title: 'Adfree Cities: the movement to free public space from corporate advertising',
    source: 'Adfree Cities',
    url: 'https://adfreecities.org.uk/',
    cat: 'resist',
  },
  {
    title: 'Badvertising: the campaign to end high-carbon and fossil-fuel advertising',
    source: 'Badvertising',
    url: 'https://badverts.org/',
    cat: 'climate',
  },
  {
    title: 'UN SDG 11: make cities inclusive, safe, resilient and sustainable',
    source: 'UN SDGs',
    url: 'https://sdgs.un.org/goals/goal11',
    cat: 'rights',
  },
  {
    title: 'UN SDG 13: take urgent action to combat climate change and its impacts',
    source: 'UN SDGs',
    url: 'https://sdgs.un.org/goals/goal13',
    cat: 'rights',
  },
  {
    title: 'The right to the city: reclaiming public space as a democratic commons',
    source: 'Right to the City',
    url: 'https://www.righttothecity.org/',
    cat: 'rights',
  },
  {
    title: 'Chennai clears its streets of billboards to reclaim the public realm',
    source: 'Rapid Transition',
    url: 'https://rapidtransition.org/',
    cat: 'south',
  },
  {
    title: 'Adbusters: the culture-jamming network fighting to reclaim the mental environment',
    source: 'Adbusters',
    url: 'https://adbusters.org/',
    cat: 'subvert',
  },
];

// Strips HTML tags to a fixed point (loops until a pass makes no further
// change) rather than a single regex pass -- a single pass can leave
// fragments that recombine into a new tag once entity-decoded (CodeQL
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

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#8217;': "'",
  '&#8216;': "'",
};
const ENTITY_RE = /&(?:amp|lt|gt|quot|#39|#x27|apos|nbsp|#8217|#8216);/g;

function decode(s: string) {
  // Single-pass entity decode (one regex matching every entity at once,
  // via a lookup replacer) instead of chained sequential .replace() calls
  // -- chaining lets one replacement's output become a later replacement's
  // input, e.g. the old &amp; -> &lt; -> < order turned a deliberately
  // double-encoded "&amp;lt;script&amp;gt;" into a literal "<script>"
  // (CodeQL js/double-escaping). A single pass processes each character
  // position once, so that cascade can't happen.
  //
  // Decode BEFORE stripping tags, not after: decoding first and stripping
  // last means no HTML-producing step runs after the strip (CodeQL
  // js/incomplete-multi-character-sanitization) -- previously an
  // entity-encoded tag survived the strip (nothing literal to match yet)
  // and only became a real tag once decoded afterward, with no further
  // stripping applied.
  const withoutCdata = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const decoded = withoutCdata.replace(ENTITY_RE, (m) => ENTITIES[m] ?? m);
  return stripTags(decoded).trim();
}
function pick(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}

function parseFeed(xml: string, srcName: string, cat: string, gnews = false) {
  const out: any[] = [];
  const items = String(xml)
    .split(/<item\b/i)
    .slice(1);
  for (const b of items.slice(0, PER_FEED)) {
    const rawTitle = decode(pick(b, 'title'));
    if (!rawTitle) continue;
    let link = decode(pick(b, 'link'));
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = decode(m[1]);
    }
    if (!/^https?:\/\//.test(link)) continue;
    const pub = (pick(b, 'pubDate') || pick(b, 'dc:date') || pick(b, 'published') || '').trim();
    let source = srcName,
      title = rawTitle;
    if (gnews) {
      const gs = decode(pick(b, 'source'));
      if (gs) source = gs;
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      else title = title.replace(/\s+-\s+[^-]{2,40}$/, '');
    }
    const ts = pub ? Date.parse(pub) : 0;
    out.push({
      title: title.trim(),
      source,
      url: link,
      published: Number.isFinite(ts) ? ts : 0,
      cat,
    });
  }
  if (!out.length) {
    const entries = String(xml)
      .split(/<entry\b/i)
      .slice(1);
    for (const b of entries.slice(0, PER_FEED)) {
      const title = decode(pick(b, 'title'));
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      const link = m ? decode(m[1]) : '';
      if (!title || !/^https?:\/\//.test(link)) continue;
      const pub = (pick(b, 'updated') || pick(b, 'published') || '').trim();
      const ts = pub ? Date.parse(pub) : 0;
      out.push({
        title: title.trim(),
        source: srcName,
        url: link,
        published: Number.isFinite(ts) ? ts : 0,
        cat,
      });
    }
  }
  return out;
}

async function getText(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (OOHEarth FieldNews)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRss(feed: any) {
  const xml = await getText(feed.url);
  return xml ? parseFeed(xml, feed.source, feed.cat, false) : [];
}
async function fetchGnews(g: any) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(g.q)}&hl=en-GB&gl=GB&ceid=GB:en`;
  const xml = await getText(url);
  return xml ? parseFeed(xml, '', g.cat, true) : [];
}
async function fetchBsky(term: string) {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=15&sort=latest`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (OOHEarth FieldNews)' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.posts || [])
      .map((p: any) => {
        const handle = p?.author?.handle || '';
        const rkey = String(p?.uri || '')
          .split('/')
          .pop();
        const text = String(p?.record?.text || '')
          .replace(/\s+/g, ' ')
          .trim();
        const ts = p?.record?.createdAt
          ? Date.parse(p.record.createdAt)
          : p?.indexedAt
            ? Date.parse(p.indexedAt)
            : 0;
        return {
          title: text.length > 150 ? text.slice(0, 147) + '…' : text,
          source: handle ? `@${handle} · Bluesky` : 'Bluesky',
          url: handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : '',
          published: Number.isFinite(ts) ? ts : 0,
          cat: 'live',
        };
      })
      .filter((x: any) => x.title && x.title.length > 20 && x.url);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Newest-first, but break up runs of 3+ from the same source.
function diversify(list: any[]) {
  const res: any[] = [];
  const pool = list.slice();
  while (pool.length) {
    let idx = 0;
    const last2 = res.slice(-2).map((x) => x.source);
    if (last2.length === 2 && last2[0] === last2[1]) {
      const alt = pool.findIndex((x) => x.source !== last2[0]);
      if (alt >= 0) idx = alt;
    }
    res.push(pool.splice(idx, 1)[0]);
  }
  return res;
}

// 6-hour rebuild — the stream refreshes 4× per day, automatically.
function periodKey() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const bucket = Math.floor(d.getUTCHours() / 6); // 0, 1, 2, or 3
  return `${FEED_VERSION}-${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}-${bucket}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pk = periodKey();

    try {
      const cached = await base44.asServiceRole.entities.IntelCache.filter(
        { cache_key: CACHE_KEY },
        '-created_date',
        1,
      );
      if (cached?.[0]?.period_key === pk && cached[0].payload) {
        return Response.json({ ...JSON.parse(cached[0].payload), cached: true });
      }
    } catch {
      /* refetch */
    }

    const jobs = [
      ...RSS_FEEDS.map((f) => fetchRss(f)),
      ...GNEWS.map((g) => fetchGnews(g)),
      ...BSKY_TERMS.map((t) => fetchBsky(t)),
    ];
    const settled = await Promise.allSettled(jobs);
    let all: any[] = [];
    for (const r of settled) if (r.status === 'fulfilled') all = all.concat(r.value);

    const now = Date.now();
    all = all.filter(
      (x) =>
        x &&
        x.title &&
        /^https?:\/\//.test(x.url || '') &&
        x.published &&
        now - x.published < MAX_AGE_MS,
    );
    const seen = new Set<string>();
    const dedup: any[] = [];
    for (const it of all) {
      const k = it.title.toLowerCase().slice(0, 55);
      if (seen.has(k)) continue;
      seen.add(k);
      dedup.push(it);
    }
    dedup.sort((a, b) => (b.published || 0) - (a.published || 0));
    let items = diversify(dedup).slice(0, POOL);
    if (!items.length) items = FALLBACK;

    const payload = { items, updated: Date.now() };
    try {
      await base44.asServiceRole.entities.IntelCache.create({
        cache_key: CACHE_KEY,
        period_key: pk,
        payload: JSON.stringify(payload),
      });
    } catch {
      /* best-effort */
    }

    return Response.json({ ...payload, cached: false });
  } catch (error) {
    return Response.json({ items: FALLBACK, error: error.message }, { status: 200 });
  }
});
