import { Link } from "react-router-dom";
import { Globe, ArrowLeft, Info } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import {
  REGIONS, MACROS, REGION_STATUS, REGION_ACCESS, seedRegionCount,
} from "@/components/ooh/regions";

function Badge({ map, k }) {
  const b = map[k];
  if (!b) return null;
  return <span className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${b.cls}`}>{b.text}</span>;
}

function RegionCard({ r }) {
  const n = seedRegionCount(r.slug);
  const active = r.status === "live" || r.status === "partial";
  return (
    <div className={`flex flex-col border p-4 ${active ? "border-slate2/60 bg-card" : "border-dashed border-slate2/40 bg-card/40"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold tracking-[-0.01em] text-silver">{r.city}</h3>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{r.country}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge map={REGION_STATUS} k={r.status} />
          <Badge map={REGION_ACCESS} k={r.access} />
        </div>
      </div>
      <p className="mt-3 flex-1 font-display text-[12px] leading-[1.5] text-darkgray">{r.note}</p>
      <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">
        <span>{n} on record</span>
        {r.slug === "london" ? (
          <Link to="/bus-stops" className="hover:text-ozone">Directory →</Link>
        ) : active ? (
          <Link to="/categories" className="hover:text-ozone">Directories →</Link>
        ) : (
          <span className="text-dim/40">queued</span>
        )}
      </div>
    </div>
  );
}

export default function Regions() {
  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <Link to="/categories" className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone">
          <ArrowLeft className="h-3.5 w-3.5" /> Categories
        </Link>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// regions · coverage roadmap</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">Regions &amp; coverage</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-darkgray">
          The record grows city by city. Two things are true of every region at once — how much we've
          <span className="text-silver"> mapped</span> it, and whether the <span className="text-silver">open data</span> to map it even exists.
        </p>

        {/* the open-access model — the honest part */}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="border border-slate2/60 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// coverage — status</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(REGION_STATUS).map(([k, v]) => (
                <span key={k} className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${v.cls}`}>{v.text}</span>
              ))}
            </div>
            <p className="mt-3 font-display text-[12px] leading-[1.5] text-darkgray">
              How far the mapping has got — Live, Partial, WIP, or queued (Planned). We push each as far as it goes, then open the next front.
            </p>
          </div>
          <div className="border border-slate2/60 bg-card p-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare">// access — data regime</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(REGION_ACCESS).map(([k, v]) => (
                <span key={k} className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${v.cls}`}>{v.text}</span>
              ))}
            </div>
            <p className="mt-3 font-display text-[12px] leading-[1.5] text-darkgray">
              Whether open public data exists at all. It's not evenly distributed.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 border border-flare/30 bg-card/40 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-flare" />
          <p className="max-w-4xl font-display text-[12px] leading-[1.6] text-darkgray">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-flare">The open-access gap.</span>{" "}
            The right to see public space is not shared equally. In the UK and much of Europe, accessible-asset
            registers, OpenStreetMap coverage, planning portals and freedom-of-information let us enumerate unit
            <span className="text-silver"> types</span> authoritatively — open access. In much of the Global South, no such
            register exists: <span className="text-silver">Bangkok</span> is completely uncovered from a unit-type
            perspective, so the record there is gathered on foot by operatives and every classification is provisional.
            We surface that difference rather than flatten it — an open commons in one place and an opaque one in another
            is exactly the inequity the movement exists to name (SDG&nbsp;11.7).
          </p>
        </div>

        {/* regions by macro-area */}
        {MACROS.map((m) => {
          const rows = REGIONS.filter((r) => r.macro === m);
          if (!rows.length) return null;
          return (
            <section key={m} className="mt-10">
              <div className="mb-4 flex items-center gap-2 border-l-2 border-ozone/60 pl-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">{m}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/50">{rows.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((r) => <RegionCard key={r.slug} r={r} />)}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
