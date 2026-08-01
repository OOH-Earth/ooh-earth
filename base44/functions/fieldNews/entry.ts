import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// fieldNews — the resistance intel stream for the ticker. Weighted toward
// subvertising, adbusting and reclaim-public-space action (NOT commercial OOH
// trade press), and deliberately surfacing Global-South-led resistance. Builds a
// large rolling pool (~60), newest-first, each item linking to the real
// article/post, and rebuilds once a day (cached in IntelCache by date).
//
// Sources: (1) movement RSS, (2) Google News resistance/Global-South queries,
// (3) Bluesky post search (best-effort, live). Any source that fails is skipped.

const CACHE_KEY = "fieldNews";
const POOL = 60;         // endless-stream pool size
const PER_FEED = 40;     // items parsed per source

// Movement / resistance feeds — the orgs' own words, real article links.
const RSS_FEEDS = [
  { url: "https://adfreecities.org.uk/feed/", source: "Adfree Cities", cat: "resist" },
  { url: "https://brandalism.ch/feed/", source: "Brandalism", cat: "subvert" },
  { url: "https://badverts.org/feed/", source: "Badvertising", cat: "resist" },
];

// Google News — resistance + Global South, not ad-industry trade news.
const GNEWS = [
  { q: '(subvertising OR adbusting OR brandalism OR "culture jamming" OR "billboard liberation" OR "ad busting" OR "subvertisers") when:60d', cat: "subvert" },
  { q: '("anti-advertising" OR "ad free city" OR "ad-free" OR "reclaim public space" OR "advertising ban" OR "billboard ban") (activist OR protest OR campaign OR movement OR community OR resist) when:45d', cat: "resist" },
  { q: '(billboard OR "outdoor advertising" OR hoarding OR "public space") (ban OR removal OR protest OR reclaim OR activism) ("São Paulo" OR Brazil OR India OR Chennai OR Mumbai OR Tehran OR Nairobi OR Lagos OR Jakarta OR Bogotá OR "Latin America" OR Africa OR "Global South" OR Philippines OR Indonesia) when:120d', cat: "south" },
  { q: '("fossil fuel advertising" OR greenwashing OR "high-carbon advertising" OR "tobacco advertising") (ban OR protest OR subvertising OR campaign OR activist) when:45d', cat: "climate" },
];

// Bluesky live search (best-effort; silent if the public endpoint needs auth).
const BSKY_TERMS = ["subvertising", "adbusting OR brandalism", "anti-advertising OR \"ad free\"", "\"reclaim public space\""];

// Resistance / Global-South framed fallback (only if every live source fails).
const FALLBACK = [
  { title: "São Paulo's Clean City Law: the megacity that banned outdoor advertising", source: "Cidade Limpa", url: "https://en.wikipedia.org/wiki/Clean_City_Law", cat: "south" },
  { title: "Chennai clears its streets of billboards to reclaim the public realm", source: "Rapid Transition Alliance", url: "https://rapidtransition.org/", cat: "south" },
  { title: "Brandalism: activists replace bus-stop ads with anti-fossil-fuel artworks across Europe", source: "Brandalism", url: "https://brandalism.ch/", cat: "subvert" },
  { title: "Adfree Cities: the movement to free public space from corporate advertising", source: "Adfree Cities", url: "https://adfreecities.org.uk/", cat: "resist" },
  { title: "Subvertisers International: a global network turning ad space into dissent", source: "Subvertisers International", url: "https://brandalism.ch/", cat: "subvert" },
  { title: "Grenoble replaces street advertising with trees and community noticeboards", source: "Reclaim the City", url: "https://rapidtransition.org/", cat: "resist" },
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

function parseFeed(xml: string, srcName: string, cat: string, gnews = false) {
  const out: any[] = [];
  const items = String(xml).split(/<item\b/i).slice(1);
  for (const b of items.slice(0, PER_FEED)) {
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
    for (const b of entries.slice(0, PER_FEED)) {
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

async function getText(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (OOHEarth FieldNews)" } });
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
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=15&sort=latest`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
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
        title: text.length > 150 ? text.slice(0, 147) + "…" : text,
        source: handle ? `@${handle} · Bluesky` : "Bluesky",
        url: handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : "",
        published: Number.isFinite(ts) ? ts : 0,
        cat: "live",
      };
    }).filter((x: any) => x.title && x.title.length > 20 && x.url);
  } catch { return []; } finally { clearTimeout(timer); }
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

// Daily rebuild — the stream refreshes once a day, automatically.
function periodKey() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
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
    let items = diversify(dedup).slice(0, POOL);
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
