import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// fieldNews — the real intel feed for the ticker. Pulls the LATEST headlines
// across three streams (OOH industry, subvertising/adbusting movement, and
// advertising-ban policy), mixes them, and caches hourly in IntelCache so we
// don't hammer the source on every page load. Falls back to a small real set
// if the fetch is unavailable.

const CACHE_KEY = "fieldNews";

// Three streams, deliberately mixed so the ticker reads industry + movement.
const QUERIES = [
  { cat: "ooh", q: '("out of home advertising" OR "OOH advertising" OR "digital out of home" OR billboard advertising) (industry OR regulation OR ban OR policy OR spend)' },
  { cat: "subvert", q: '(subvertising OR adbusting OR brandalism OR "adfree cities" OR "ad free cities" OR badvertising OR "subvertisers international" OR "reclaim public space")' },
  { cat: "ban", q: '("advertising ban" OR "billboard ban" OR "fossil fuel advertising" OR "ad free" OR "ban on advertising") (city OR council OR public OR climate)' },
];

// Real, evergreen fallback (used only if every live fetch fails).
const FALLBACK = [
  { title: "US cities tighten billboard rules as OOH faces rising regulatory pressure", source: "Billboard Insider", url: "https://billboardinsider.com/", cat: "ooh" },
  { title: "Brandalism targets ad agencies over fossil-fuel clients in UK-wide subvertising action", source: "The Drum", url: "https://www.thedrum.com/", cat: "subvert" },
  { title: "Grenoble and Chennai clear streets of billboards to reclaim the visual commons", source: "Rapid Transition Alliance", url: "https://rapidtransition.org/", cat: "ban" },
  { title: "Adfree Cities challenges bank 'greenwashing' with ASA complaints", source: "The Drum", url: "https://www.thedrum.com/", cat: "subvert" },
  { title: "Cities banning fossil-fuel adverts: 'the new tobacco'", source: "BBC", url: "https://www.bbc.co.uk/news", cat: "ban" },
];

function decode(s: string) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .trim();
}

function parseItems(xml: string, cat: string) {
  const out: any[] = [];
  const blocks = String(xml).split(/<item>/i).slice(1);
  for (const b of blocks.slice(0, 20)) {
    const rawTitle = decode(b.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
    if (!rawTitle) continue;
    const link = decode(b.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "");
    const pub = (b.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
    const source = decode(b.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || "");
    // Google News titles are "Headline - Source" — strip the source suffix.
    let title = rawTitle;
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    else title = title.replace(/\s+-\s+[^-]{2,40}$/, "");
    const ts = pub ? Date.parse(pub) : 0;
    out.push({ title: title.trim(), source, url: link, published: Number.isFinite(ts) ? ts : 0, cat });
  }
  return out;
}

async function fetchFeed(query: string, cat: string) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (OOHEarth FieldNews)" } });
    if (!res.ok) return [];
    return parseItems(await res.text(), cat);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Round-robin interleave across streams (each pre-sorted by recency) → a mix.
function mix(lists: any[][], limit = 16) {
  const sorted = lists.map((l) => l.slice().sort((a, b) => b.published - a.published));
  const out: any[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < limit && sorted.some((l) => l.length) && guard < 200) {
    guard++;
    const l = sorted[guard % sorted.length];
    const it = l.shift();
    if (!it || !it.title) continue;
    const key = it.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function periodKey() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}-${p(d.getUTCHours())}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pk = periodKey();

    // Serve a fresh cached copy if we already built this hour's feed.
    try {
      const cached = await base44.asServiceRole.entities.IntelCache.filter({ cache_key: CACHE_KEY }, "-created_date", 1);
      if (cached?.[0]?.period_key === pk && cached[0].payload) {
        return Response.json({ ...JSON.parse(cached[0].payload), cached: true });
      }
    } catch { /* fall through and refetch */ }

    const settled = await Promise.allSettled(QUERIES.map((Q) => fetchFeed(Q.q, Q.cat)));
    const lists = settled.map((r) => (r.status === "fulfilled" ? r.value : []));
    let items = mix(lists, 16);
    if (!items.length) items = FALLBACK;

    const payload = { items, updated: Date.now() };
    try {
      await base44.asServiceRole.entities.IntelCache.create({
        cache_key: CACHE_KEY, period_key: pk, payload: JSON.stringify(payload),
      });
    } catch { /* cache write best-effort */ }

    return Response.json({ ...payload, cached: false });
  } catch (error) {
    return Response.json({ items: FALLBACK, error: error.message }, { status: 200 });
  }
});
