import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, MapPin, Info } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import CategoryNav from "@/components/ooh/CategoryNav";
import { catBySlug } from "@/components/ooh/categories";
import { regionOf, regionBySlug, REGION_ACCESS } from "@/components/ooh/regions";
import MAP_SEED from "@/components/ooh/mapSeed";
import { base44 } from "@/api/base44Client";

// mapSeed uses image/title; live Location uses image_url/name.
function normalize(x) {
  return {
    id: x.id,
    title: x.title || x.name || "Location",
    address: x.address || "",
    image: x.image || x.image_url || null,
    type: x.type || "other",
    notes: x.notes || "",
  };
}

// A genuine field photo — not a stock placeholder and not empty.
const isRealPhoto = (url) => !!url && !/unsplash\.com|images\.pexels/.test(url);

// Branded symbol placeholder — the surface icon on the Orbital grid.
function SurfaceTile({ Icon }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-void">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(120% 120% at 50% 40%,#000 40%,transparent 100%)",
          WebkitMaskImage: "radial-gradient(120% 120% at 50% 40%,#000 40%,transparent 100%)",
        }}
      />
      <Icon className="relative h-8 w-8 text-ozone/60" strokeWidth={1.4} />
    </div>
  );
}

export default function CategoryDirectory() {
  const { slug } = useParams();
  const cat = catBySlug(slug);
  const [live, setLive] = useState([]);
  const [region, setRegion] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await base44.listAllLocations();
        if (alive) setLive(Array.isArray(rows) ? rows : []);
      } catch {
        if (alive) setLive([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // All items of this surface type (seed + live, de-duped).
  const all = useMemo(() => {
    if (!cat) return [];
    const seen = new Set();
    return [...MAP_SEED, ...live]
      .map(normalize)
      .filter((x) => x.type === cat.type)
      .filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
      .map((x) => ({ ...x, region: regionOf(x.address) }));
  }, [cat, live]);

  // Region facets present in this type's data.
  const regionFacets = useMemo(() => {
    const counts = {};
    for (const it of all) {
      const key = it.region || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([slug, n]) => ({ slug, n, region: regionBySlug(slug) }))
      .sort((a, b) => b.n - a.n);
  }, [all]);

  const items = region === "all" ? all : all.filter((x) => x.region === region);
  const activeRegion = region !== "all" ? regionBySlug(region) : null;
  const access = activeRegion ? REGION_ACCESS[activeRegion.access] : null;

  // Bus Stops keeps its own richer directory; unknown slugs fall back to the index.
  if (cat?.dedicated && cat.to) return <Navigate to={cat.to} replace />;
  if (!cat) return <Navigate to="/categories" replace />;

  const Icon = cat.icon;
  const chip = (on) =>
    `inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
      on ? "border-ozone bg-ozone text-void" : "border-slate2/60 text-darkgray hover:border-ozone/60 hover:text-ozone"
    }`;

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <Link to="/categories" className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone">
          <ArrowLeft className="h-3.5 w-3.5" /> All categories
        </Link>

        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// category · {cat.label}</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">{cat.label}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-darkgray">{cat.blurb}</p>

        {/* switch surface type */}
        <div className="mt-5">
          <CategoryNav current={cat.slug} />
        </div>

        {/* filter by region */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">Region</span>
          <button onClick={() => setRegion("all")} className={chip(region === "all")}>
            All <span className="opacity-60">{all.length}</span>
          </button>
          {regionFacets.map((f) => (
            <button key={f.slug} onClick={() => setRegion(f.slug)} className={chip(region === f.slug)}>
              {f.region ? f.region.city : "Unmapped"} <span className="opacity-60">{f.n}</span>
            </button>
          ))}
          <Link to="/regions" className="ml-1 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70 hover:text-ozone">
            + roadmap
          </Link>
        </div>

        {/* access-regime caveat for field-only regions */}
        {access && activeRegion.access === "field" && (
          <div className="mt-4 flex items-start gap-2 border border-flare/30 bg-card/40 px-3 py-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-flare" />
            <p className="font-display text-[11px] leading-[1.5] text-darkgray">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-flare">Field-only region.</span>{" "}
              {activeRegion.city} has no open public register of outdoor units — records are operative-gathered and unit-type
              classification here is provisional. Counts are a floor, not a census.
            </p>
          </div>
        )}

        <div className="mt-6 mb-4 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// Directory</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{items.length} logged</span>
          <span className="h-px flex-1 bg-slate2/30" />
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-slate2/60 bg-card/40 p-10 text-center">
            <MapPin className="mx-auto h-6 w-6 text-dim" />
            <p className="mt-3 font-display text-sm text-darkgray">
              No {cat.label.toLowerCase()} on the record here yet.{" "}
              <Link to="/report" className="text-ozone hover:underline">File the first one →</Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const rg = regionBySlug(it.region);
              return (
                <Link
                  key={it.id}
                  to={`/location/${it.id}`}
                  className="group flex flex-col overflow-hidden border border-slate2/60 bg-card transition-colors hover:border-ozone/50"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {isRealPhoto(it.image) ? (
                      <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <SurfaceTile Icon={Icon} />
                    )}
                    <span className="absolute left-2 top-2 border border-ozone/50 bg-void/70 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">{cat.label}</span>
                    {rg && (
                      <span className="absolute right-2 top-2 border border-slate2/70 bg-void/70 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">{rg.city}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="flex items-start justify-between gap-2 font-display text-sm font-bold tracking-[-0.01em] text-silver">
                      <span className="min-w-0">{it.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                    </h3>
                    {it.address && <p className="mt-1 font-display text-[11px] leading-[1.4] text-darkgray">{it.address}</p>}
                    {it.notes && <p className="mt-2 font-mono text-[10px] leading-[1.4] text-dim/80">{it.notes}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
