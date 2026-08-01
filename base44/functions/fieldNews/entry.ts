import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// fieldNews — the real, LATEST intel feed for the ticker. Three kinds of source,
// mixed and sorted newest-first, each item linking to the real article/post:
//   1. Direct RSS from the actual publications/movement sites (clean article URLs)
//   2. Google News, recency-forced with when: operators (breadth)
//   3. Bluesky post search, best-effort (minute-fresh; skipped silently if the
//      public endpoint requires auth)
// Cached 15 min in IntelCache so we stay live without hammering sources.

const CACHE_KEY = "fieldNews";

// Direct source feeds — real article links, chronological.
const RSS_FEEDS = [
  { url: "https://billboardinsider.com/feed/", source: "Billboard Insider", cat: "ooh" },
  { url: "https://oohtoday.com/feed/", source: "OOH Today", cat: "ooh" },
  { url: "https://www.sixteen-nine.net/feed/", source: "Sixteen:Nine", cat: "ooh" },
  { url: "https://adfreecities.org.uk/feed/", source: "Adfree Cities", cat: "subvert" },
  { url: "https://brandalism.ch/feed/", source: "Brandalism", cat: "subvert" },
];

// Google News, forced recent (subvertising is niche → a wider window).
const GNEWS = [
  { q: '("out of home advertising" OR "OOH advertising" OR "digital out of home" OR billboard advertising) when:7d', cat: "ooh" },
  { q: '(subvertising OR adbusting OR brandalism OR "adfree cities" OR badvertising OR "subvertisers international") when:21d', cat: "subvert" },
  { q: '("advertising ban" OR "billboard ban" OR "fossil fuel advertising" OR "ban on advertising") when:10d', cat: "ban" },
];

// Bluesky live search terms (best-effort).
const BSKY_TERMS = ["subvertising", "adbusting OR brandalism", "billboard ban"];

// Real, evergreen fallback (only if every live source fails).
const FALLBACK = [
  { title: "US cities tighten billboard rules as OOH faces rising regulatory pressure", source: "Billboard Insider", url: "https://billboardinsider.com/", cat: "ooh" },
  { title: "Brandalism targets ad agencies over fossil-fuel clients in UK-wide subvertising action", source: "The Drum", url: "https://www.thedrum.com/", cat: "subvert" },
  { title: "Grenoble and Chennai clear streets of billboards to reclaim the visual commons", source: "Rapid Transition Alliance", url: "https://rapidtransition.org/", cat: "ban" },
  { title: "Adfree Cities challenges bank 'greenwashing' with ASA complaints", source: "The Drum", url: "https://www.thedrum.com/", cat: "subvert" },
];

function decode(s: string) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .trim();
}
function pick(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1] : "";
}

// Parse RSS 2.0 (<item>) or Atom (<entry>). For Google News, gnews=true uses the
// <source> tag and strips the " - Source" title suffix.
function parseFeed(xml: string, srcName: string, cat: string, gnews = false) {
  const out: any[] = [];
  const items = String(xml).split(/<item\b/i).slice(1);
  for (const b of items.slice(0, 15)) {
    const rawTitle = decode(pick(b, "title"));
    if (!rawTitle) continue;
    let link = decode(pick(b, "link"));
    if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); if (m) link = decode(m[1]); }
    if (!/^https?:\/\//.test(link)) continue;
    const pub = (pick(b, "pubDate") || pick(b, "dc:date") || pick(b, "published") || "").trim();
    let source = srcName, title = rawTitle;
    if (gnews) {
      const gs = decode(pick(b, "source"));
      if (gs) source = gs;
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      else title = title.replace(/\s+-\s+[^-]{2,40}$/, "");
    }
    const ts = pub ? Date.parse(pub) : 0;
    out.push({ title: title.trim(), source, url: link, published: Number.isFinite(ts) ? ts : 0, cat });
  }
  if (!out.length) {
    const entries = String(xml).split(/<entry\b/i).slice(1);
    for (const b of entries.slice(0, 15)) {
      const title = decode(pick(b, "title"));
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      const link = m ? decode(m[1]) : "";
      if (!title || !/^https?:\/\//.test(link)) continue;
      const pub = (pick(b, "updated") || pick(b, "published") || "").trim();
      const ts = pub ? Date.parse(pub) : 0;
      out.push({ title: title.trim(), source: srcName, url: link, published: Number.isFinite(ts) ? ts : 0, cat });
    }
  }
  return out;
}

async function getText(url: string, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (OOHEarth FieldNews)", ...headers } });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; } finally { clearTimeout(timer); }
}

async function fetchRss(feed: any) {
  const xml = await getText(feed.url);
  return xml ? parseFeed(xml, feed.source, feed.cat, false) : [];
}
async function fetchGnews(g: any) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(g.q)}&hl=en-GB&gl=GB&ceid=GB:en`;
  const xml = await getText(url);
  return xml ? parseFeed(xml, "", g.cat, true) : [];
}
async function fetchBsky(term: string) {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=8&sort=latest`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (OOHEarth FieldNews)" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.posts || []).map((p: any) => {
      const handle = p?.author?.handle || "";
      const rkey = String(p?.uri || "").split("/").pop();
      const text = String(p?.record?.text || "").replace(/\s+/g, " ").trim();
      const ts = p?.record?.createdAt ? Date.parse(p.record.createdAt) : (p?.indexedAt ? Date.parse(p.indexedAt) : 0);
      return {
        title: text.length > 140 ? text.slice(0, 137) + "…" : text,
        source: handle ? `@${handle} · Bluesky` : "Bluesky",
        url: handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : "",
        published: Number.isFinite(ts) ? ts : 0,
        cat: "live",
      };
    }).filter((x: any) => x.title && x.title.length > 20 && x.url);
  } catch { return []; } finally { clearTimeout(timer); }
}

// Keep newest-first, but break up runs of 3+ from the same source.
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

function periodKey() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const bucket = Math.floor(d.getUTCMinutes() / 15);
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}-${p(d.getUTCHours())}-${bucket}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pk = periodKey();

    try {
      const cached = await base44.asServiceRole.entities.IntelCache.filter({ cache_key: CACHE_KEY }, "-created_date", 1);
      if (cached?.[0]?.period_key === pk && cached[0].payload) {
        return Response.json({ ...JSON.parse(cached[0].payload), cached: true });
      }
    } catch { /* refetch */ }

    const jobs = [
      ...RSS_FEEDS.map((f) => fetchRss(f)),
      ...GNEWS.map((g) => fetchGnews(g)),
      ...BSKY_TERMS.map((t) => fetchBsky(t)),
    ];
    const settled = await Promise.allSettled(jobs);
    let all: any[] = [];
    for (const r of settled) if (r.status === "fulfilled") all = all.concat(r.value);

    // valid link + title, dedupe, newest-first, diversify
    all = all.filter((x) => x && x.title && /^https?:\/\//.test(x.url || ""));
    const seen = new Set<string>();
    const dedup: any[] = [];
    for (const it of all) {
      const k = it.title.toLowerCase().slice(0, 55);
      if (seen.has(k)) continue;
      seen.add(k);
      dedup.push(it);
    }
    dedup.sort((a, b) => (b.published || 0) - (a.published || 0));
    let items = diversify(dedup).slice(0, 18);
    if (!items.length) items = FALLBACK;

    const payload = { items, updated: Date.now() };
    try {
      await base44.asServiceRole.entities.IntelCache.create({ cache_key: CACHE_KEY, period_key: pk, payload: JSON.stringify(payload) });
    } catch { /* best-effort */ }

    return Response.json({ ...payload, cached: false });
  } catch (error) {
    return Response.json({ items: FALLBACK, error: error.message }, { status: 200 });
  }
});
