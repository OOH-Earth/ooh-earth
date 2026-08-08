import { useState, useMemo } from "react";
import Nav from "@/components/ooh/Nav";
import MediaCorpsMap from "@/components/ooh/report/MediaCorpsMap";
import MediaCorpDetail from "@/components/ooh/report/MediaCorpDetail";
import { OOH_MEDIA_CORPS } from "@/components/ooh/report/oohMediaCorps";
import { Search, ExternalLink, Megaphone, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

const SCOPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "global", label: "Global" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
];

export default function MediaCorps() {
  const [scopeFilter, setScopeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => OOH_MEDIA_CORPS.filter((c) => {
    const scopeMatch = scopeFilter === "all" || c.scope === scopeFilter;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${c.name} ${c.hq} ${c.parent} ${c.regions.join(" ")}`.toLowerCase().includes(q);
    return scopeMatch && searchMatch;
  }), [scopeFilter, search]);

  const stats = useMemo(() => ({
    total: OOH_MEDIA_CORPS.length,
    global: OOH_MEDIA_CORPS.filter((c) => c.scope === "global").length,
    countries: OOH_MEDIA_CORPS.reduce((sum, c) => sum + (c.countries || 0), 0),
    panels: OOH_MEDIA_CORPS.reduce((sum, c) => sum + (c.panels || 0), 0),
  }), []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-void pt-[calc(7rem_+_env(safe-area-inset-top))] md:pt-[calc(8rem_+_env(safe-area-inset-top))] pb-[calc(76px_+_env(safe-area-inset-bottom))] lg:pb-0">
      <Nav />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate2/60 bg-void/90 px-3 py-2 backdrop-blur-md md:px-5">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// Media Corps Map</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-dim sm:inline">
            · {stats.total} corps · {stats.countries}+ countries · {(stats.panels / 1000000).toFixed(1)}M+ panels
          </span>
        </div>
        <a href="https://ooh.earth/media-corps/" target="_blank" rel="noreferrer"
          className="hidden items-center gap-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim transition-colors hover:text-ozone sm:flex">
          <ExternalLink className="h-2.5 w-2.5" /> ooh.earth
        </a>
      </div>

      {/* Scope filter chips */}
      <div className="flex items-center gap-1.5 border-b border-slate2/60 bg-void px-3 py-2 md:px-5">
        {SCOPE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setScopeFilter(f.value)}
            className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] border transition-colors ${scopeFilter === f.value ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray hover:border-ozone/50"}`}>
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-dim" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search corps…"
            className="w-full bg-void border border-slate2 pl-7 pr-2 py-1 font-display text-xs text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone sm:w-56" />
        </div>
      </div>

      {/* Main split */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — corps list */}
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-slate2/60 bg-card lg:flex">
          <div className="border-b border-slate2/60 px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              // {filtered.length} corps
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate2/30">
            {filtered.map((corp) => (
              <button key={corp.name} onClick={() => setSelected(corp)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-ozone/5 ${selected?.name === corp.name ? "bg-ozone/5" : ""}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${corp.scope === "global" ? "bg-ozone" : corp.scope === "regional" ? "bg-flare" : "bg-darkgray"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[13px] font-bold text-silver">{corp.name}</div>
                  <div className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-dim">{corp.hq}</div>
                </div>
                {corp.countries > 0 && <span className="shrink-0 font-mono text-[8px] text-dim">{corp.countries}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">No match</div>
            )}
          </div>
          <div className="border-t border-slate2/60 p-3">
            <Link to="/report" className="flex items-center justify-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
              <Megaphone className="h-3 w-3" /> File a report
            </Link>
          </div>
        </aside>

        {/* Map */}
        <div className="relative min-h-0 flex-1">
          <MediaCorpsMap filterScope={scopeFilter} selected={selected} onSelect={setSelected} />

          {/* Mobile list toggle / count */}
          <div className="absolute bottom-3 left-3 right-3 z-[1000] lg:hidden">
            <div className="flex gap-1 overflow-x-auto border border-slate2 bg-void/90 p-1.5 backdrop-blur-md">
              {filtered.slice(0, 8).map((corp) => (
                <button key={corp.name} onClick={() => setSelected(corp)}
                  className={`shrink-0 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] border transition-colors ${selected?.name === corp.name ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray"}`}>
                  {corp.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute right-3 top-3 z-[1000] hidden flex-col gap-1.5 border border-slate2 bg-void/90 p-2.5 backdrop-blur-md sm:flex">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Legend</span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-ozone" /> Global</span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-flare" /> Regional</span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-darkgray" /> Local</span>
          </div>

          {/* Detail drawer */}
          <MediaCorpDetail corp={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}