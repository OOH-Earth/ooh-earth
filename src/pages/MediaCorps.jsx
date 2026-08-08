import { useState, useMemo, useEffect, useCallback } from "react";
import Nav from "@/components/ooh/Nav";
import MediaCorpsMap from "@/components/ooh/report/MediaCorpsMap";
import MediaCorpGlobe from "@/components/ooh/report/MediaCorpGlobe";
import MediaCorpDetail from "@/components/ooh/report/MediaCorpDetail";
import MapStyleSwitcher from "@/components/ooh/map/MapStyleSwitcher";
import { base44 } from "@/api/base44Client";
import { Search, Megaphone, Globe2, Loader2, Database, Map as MapIcon, List, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const SCOPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "global", label: "Global" },
  { value: "regional", label: "Regional" },
  { value: "local", label: "Local" },
];

const VIEW_MODES = [
  { value: "map", label: "Map", icon: MapIcon },
  { value: "globe", label: "3D Globe", icon: Globe2 },
  { value: "list", label: "List", icon: List },
];

export default function MediaCorps() {
  const [scopeFilter, setScopeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [corps, setCorps] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const [searchAsMove, setSearchAsMove] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const recs = await base44.entities.MediaCorp.list("name");
        if (alive) setCorps(recs);
      } catch {
        if (alive) setCorps([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleBoundsChange = useCallback((b) => setMapBounds(b), []);

  const filtered = useMemo(() => (corps || []).filter((c) => {
    const scopeMatch = scopeFilter === "all" || c.scope === scopeFilter;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${c.name} ${c.hq} ${c.parent || ""} ${(c.regions || []).join(" ")}`.toLowerCase().includes(q);
    return scopeMatch && searchMatch;
  }), [corps, scopeFilter, search]);

  const visibleCorps = useMemo(() => {
    if (!searchAsMove || !mapBounds) return filtered;
    return filtered.filter((c) =>
      isFinite(c.lat) && isFinite(c.lng) &&
      c.lat >= mapBounds.south && c.lat <= mapBounds.north &&
      c.lng >= mapBounds.west && c.lng <= mapBounds.east
    );
  }, [filtered, searchAsMove, mapBounds]);

  const sidebarCorps = searchAsMove ? visibleCorps : filtered;

  const stats = useMemo(() => ({
    total: (corps || []).length,
    global: (corps || []).filter((c) => c.scope === "global").length,
    countries: (corps || []).reduce((sum, c) => sum + (c.countries || 0), 0),
    panels: (corps || []).reduce((sum, c) => sum + (c.panels || 0), 0),
  }), [corps]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-void pt-[calc(7rem_+_env(safe-area-inset-top))] md:pt-[calc(8rem_+_env(safe-area-inset-top))] pb-[calc(76px_+_env(safe-area-inset-bottom))] lg:pb-0">
      <Nav />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate2/60 bg-void/90 px-3 py-2 backdrop-blur-md md:px-5">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// Media Corps Registry</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-dim sm:inline">
            · {stats.total} corps · {stats.countries}+ countries · {(stats.panels / 1000000).toFixed(1)}M+ panels
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapStyleSwitcher />
          <span className="hidden items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.15em] text-dim sm:flex">
            <Database className="h-2.5 w-2.5" /> DB
          </span>
        </div>
      </div>

      {/* Scope filter + view toggle + search */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate2/60 bg-void px-3 py-2 md:px-5">
        {SCOPE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setScopeFilter(f.value)}
            className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] border transition-colors ${scopeFilter === f.value ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray hover:border-ozone/50"}`}>
            {f.label}
          </button>
        ))}

        {/* View mode toggle */}
        <div className="flex items-center border border-slate2 ml-1">
          {VIEW_MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.value} onClick={() => setViewMode(m.value)} title={m.label}
                className={`flex items-center gap-1 px-2 py-1 transition-colors ${viewMode === m.value ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}>
                <Icon className="h-3 w-3" />
                <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.15em] sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search as I move */}
        {viewMode !== "list" && (
          <label className="hidden items-center gap-1.5 cursor-pointer select-none md:flex">
            <input type="checkbox" checked={searchAsMove} onChange={(e) => setSearchAsMove(e.target.checked)}
              className="h-3 w-3 accent-[#EDFF00]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-darkgray">Search as I move</span>
          </label>
        )}

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-dim" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search corps…"
            className="w-full bg-void border border-slate2 pl-7 pr-2 py-1 font-display text-xs text-silver outline-none transition-colors placeholder:text-dim focus:border-ozone sm:w-56" />
        </div>
      </div>

      {/* Main split */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — corps list (hidden on mobile unless list mode) */}
        <aside className={`${viewMode === "list" ? "flex w-full" : "hidden w-[280px] shrink-0 lg:flex"} flex-col border-r border-slate2/60 bg-card`}>
          <div className="border-b border-slate2/60 px-4 py-2.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
              // {sidebarCorps.length} corps{searchAsMove && mapBounds ? " in view" : ""}
            </span>
            {searchAsMove && viewMode !== "list" && (
              <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-ozone/60">live</span>
            )}
          </div>
          <div className={`min-h-0 flex-1 overflow-y-auto divide-y divide-slate2/30 ${viewMode === "list" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate2/30 p-px" : ""}`}>
            {corps === null ? (
              <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-ozone" /></div>
            ) : (viewMode === "list" ? sidebarCorps : sidebarCorps).map((corp) => (
              <button key={corp.id} onClick={() => { setSelected(corp); if (viewMode === "list") setViewMode("map"); }}
                className={`group flex w-full ${viewMode === "list" ? "flex-col gap-2 p-4 bg-card" : "items-center gap-2.5 px-4 py-2.5 text-left"} text-left transition-colors hover:bg-ozone/5 ${selected?.id === corp.id ? "bg-ozone/5" : ""}`}>
                {viewMode === "list" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: corp.scope === "global" ? "#EDFF00" : corp.scope === "regional" ? "#FF5C00" : "#B2B2B2" }} />
                      <span className="font-display text-sm font-bold text-silver truncate">{corp.name}</span>
                    </div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-dim">{corp.hq}</div>
                    <div className="flex items-center gap-3 font-mono text-[8px] text-darkgray">
                      {corp.countries > 0 && <span>{corp.countries} countries</span>}
                      {corp.panels > 0 && <span>{corp.panels >= 1000000 ? (corp.panels / 1000000).toFixed(1) + "M" : Math.round(corp.panels / 1000) + "K"} panels</span>}
                    </div>
                    {corp.parent && <div className="font-mono text-[7px] text-dim/60 truncate">{corp.parent}</div>}
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: corp.scope === "global" ? "#EDFF00" : corp.scope === "regional" ? "#FF5C00" : "#B2B2B2" }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[13px] font-bold text-silver">{corp.name}</div>
                      <div className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-dim">{corp.hq}</div>
                    </div>
                    {corp.panels > 0 && <span className="shrink-0 font-mono text-[8px] text-dim">{corp.panels >= 1000000 ? (corp.panels / 1000000).toFixed(1) + "M" : Math.round(corp.panels / 1000) + "K"}</span>}
                  </>
                )}
              </button>
            ))}
            {corps !== null && sidebarCorps.length === 0 && (
              <div className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{searchAsMove ? "No corps in view — pan the map" : "No match"}</div>
            )}
          </div>
          {viewMode !== "list" && (
            <div className="border-t border-slate2/60 p-3">
              <Link to="/report" className="flex items-center justify-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare">
                <Megaphone className="h-3 w-3" /> File a report
              </Link>
            </div>
          )}
        </aside>

        {/* Map / Globe view */}
        {viewMode !== "list" && (
          <div className="relative min-h-0 flex-1">
            {corps === null ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-ozone" />
              </div>
            ) : (
              <>
                {viewMode === "globe" ? (
                  <MediaCorpGlobe corps={filtered} selected={selected} onSelect={(id) => setSelected(corps.find((c) => c.id === id))} onBoundsChange={handleBoundsChange} />
                ) : (
                  <MediaCorpsMap corps={filtered} selected={selected} onSelect={setSelected} onBoundsChange={handleBoundsChange} />
                )}

                {/* Mobile list toggle */}
                <div className="absolute bottom-3 left-3 right-3 z-[1000] lg:hidden">
                  <div className="flex gap-1 overflow-x-auto border border-slate2 bg-void/90 p-1.5 backdrop-blur-md">
                    {(searchAsMove ? visibleCorps : filtered).slice(0, 8).map((corp) => (
                      <button key={corp.id} onClick={() => setSelected(corp)}
                        className={`shrink-0 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] border transition-colors ${selected?.id === corp.id ? "border-ozone bg-ozone/10 text-ozone" : "border-slate2 text-darkgray"}`}>
                        {corp.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute right-3 top-3 z-[1000] hidden flex-col gap-1.5 border border-slate2 bg-void/90 p-2.5 backdrop-blur-md sm:flex">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">Scope</span>
                  <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-ozone" /> Global</span>
                  <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-flare" /> Regional</span>
                  <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-darkgray"><span className="h-2 w-2 rounded-full bg-darkgray" /> Local</span>
                  <span className="mt-1 flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.15em] text-dim/60"><Building2 className="h-2.5 w-2.5" /> Pin size = panels</span>
                </div>

                {/* Detail drawer */}
                <MediaCorpDetail corp={selected} onClose={() => setSelected(null)} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}