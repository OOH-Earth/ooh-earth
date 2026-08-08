import { useState } from "react";
import Nav from "@/components/ooh/Nav";
import HorizonProgress from "@/components/ooh/HorizonProgress";
import SiteFooter from "@/components/ooh/SiteFooter";
import MediaCorpsMap from "@/components/ooh/report/MediaCorpsMap";
import CommandCenter from "@/components/ooh/CommandCenter";
import { OOH_MEDIA_CORPS } from "@/components/ooh/report/oohMediaCorps";
import { Globe, Building2, ExternalLink, Search, X } from "lucide-react";

const SCOPE_FILTERS = [
  { value: "all", label: "All Corps" },
  { value: "global", label: "Global" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
];

export default function MediaCorps() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = OOH_MEDIA_CORPS.filter((c) => {
    const scopeMatch = scopeFilter === "all" || c.scope === scopeFilter;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${c.name} ${c.hq} ${c.parent} ${c.regions.join(" ")}`.toLowerCase().includes(q);
    return scopeMatch && searchMatch;
  });

  const stats = {
    total: OOH_MEDIA_CORPS.length,
    global: OOH_MEDIA_CORPS.filter((c) => c.scope === "global").length,
    countries: OOH_MEDIA_CORPS.reduce((sum, c) => sum + (c.countries || 0), 0),
  };

  return (
    <div className="relative min-h-screen bg-void">
      <HorizonProgress />
      <Nav onCommand={() => setCommandOpen(true)} />
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
      <main className="page-top px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Media Corps · Infrastructure Map</span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-silver md:text-7xl">
            Who owns<br />the street?
          </h1>
          <p className="mt-4 max-w-lg font-display text-sm leading-[1.5] text-darkgray">
            Behind every LED billboard, bus shelter screen, and illegally installed street ad is an OOH media company selling your city to the highest bidder. These are the corporations that own the infrastructure. Map them. Follow them. Hold them accountable.
          </p>

          {/* Ref link */}
          <a href="https://ooh.earth/media-corps/" target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-ozone/70 transition-colors hover:text-ozone">
            <ExternalLink className="h-2.5 w-2.5" /> Source: ooh.earth/media-corps
          </a>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-px border border-slate2/60 bg-slate2/40">
            <div className="bg-card px-4 py-3">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Corps tracked</div>
              <div className="mt-1 font-display text-2xl font-bold text-silver">{stats.total}</div>
            </div>
            <div className="bg-card px-4 py-3">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Global operators</div>
              <div className="mt-1 font-display text-2xl font-bold text-ozone">{stats.global}</div>
            </div>
            <div className="bg-card px-4 py-3">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Countries reached</div>
              <div className="mt-1 font-display text-2xl font-bold text-silver">{stats.countries}+</div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setScopeFilter(f.value)}
                  className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] border transition-colors ${scopeFilter === f.value ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray hover:border-ozone/50"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-dim" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search corps, region, parent…"
                className="w-full bg-void border border-slate2 pl-9 pr-3 py-2 font-display text-sm text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone sm:w-72" />
            </div>
          </div>

          {/* Map + List split */}
          <div className="mt-6 flex flex-col gap-4 lg:flex-row">
            {/* Map */}
            <div className="h-[400px] lg:h-[600px] lg:flex-1 border border-slate2/60">
              <MediaCorpsMap filterScope={scopeFilter} onSelect={setSelected} />
            </div>

            {/* List */}
            <div className="lg:w-[340px] shrink-0 border border-slate2/60 bg-card max-h-[600px] overflow-y-auto">
              <div className="sticky top-0 border-b border-slate2/60 bg-card px-4 py-2.5 z-10">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
                  // {filtered.length} corps {scopeFilter !== "all" && `· ${scopeFilter}`}
                </span>
              </div>
              <div className="divide-y divide-slate2/40">
                {filtered.map((corp) => (
                  <button key={corp.name} onClick={() => setSelected(corp)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-ozone/5 ${selected?.name === corp.name ? "bg-ozone/5" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${corp.scope === "global" ? "bg-ozone" : corp.scope === "regional" ? "bg-flare" : "bg-darkgray"}`} />
                          <span className="font-display text-sm font-bold text-silver truncate">{corp.name}</span>
                        </div>
                        <div className="mt-0.5 ml-4 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">{corp.hq}</div>
                        {corp.parent && <div className="mt-0.5 ml-4 font-mono text-[8px] text-dim/60">{corp.parent}</div>}
                      </div>
                      <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-dim">{corp.scope}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">No corps match</div>
                )}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="mt-4 border border-ozone/30 bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${selected.scope === "global" ? "bg-ozone" : selected.scope === "regional" ? "bg-flare" : "bg-darkgray"}`} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">{selected.scope} operator</span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-silver">{selected.name}</h2>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-dim">{selected.hq}</div>
                </div>
                <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center border border-slate2 text-darkgray transition-colors hover:border-flare hover:text-flare">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 font-display text-sm leading-[1.5] text-darkgray">{selected.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.regions.map((r) => (
                  <span key={r} className="px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] border border-slate2 text-darkgray">{r}</span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-px border border-slate2/60 bg-slate2/40 text-sm">
                <div className="bg-void px-3 py-2">
                  <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">Countries</div>
                  <div className="font-display text-sm text-silver">{selected.countries || "—"}</div>
                </div>
                <div className="bg-void px-3 py-2">
                  <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">Parent / Owner</div>
                  <div className="font-display text-xs text-silver">{selected.parent || "—"}</div>
                </div>
              </div>
              {selected.url && (
                <a href={selected.url} target="_blank" rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone transition-colors hover:opacity-70">
                  <ExternalLink className="h-3 w-3" /> Visit {selected.name}
                </a>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate2/40 pt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Legend:</span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray"><span className="h-2.5 w-2.5 rounded-full bg-ozone" /> Global (80+ countries)</span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray"><span className="h-2.5 w-2.5 rounded-full bg-flare" /> Regional (multi-country)</span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray"><span className="h-2.5 w-2.5 rounded-full bg-darkgray" /> Local (single market)</span>
          </div>
        </div>
      </main>
      <SiteFooter onCommand={() => setCommandOpen(true)} />
    </div>
  );
}