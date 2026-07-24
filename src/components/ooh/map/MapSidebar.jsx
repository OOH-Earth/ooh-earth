import { Search, RotateCcw, LifeBuoy, Play } from "lucide-react";

export default function MapSidebar({ query, setQuery, onReset }) {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-r border-slate2/60 bg-void lg:flex">
      <div className="border-b border-slate2/60 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Search / Map</div>
        <p className="mt-1 font-display text-sm text-darkgray">Explore the map.</p>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-dim">Location</label>
          <div className="flex items-center gap-2 border border-slate2 bg-card px-3 py-2.5">
            <Search className="h-3.5 w-3.5 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Street, district, city"
              className="w-full bg-transparent font-display text-sm text-silver outline-none placeholder:text-dim"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1.5 bg-ozone px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void">
            <Search className="h-3.5 w-3.5" /> Search
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 border border-slate2 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
      <div className="m-5 mt-auto border border-slate2/60 bg-card p-5">
        <LifeBuoy className="h-5 w-5 text-ozone" />
        <h4 className="mt-3 font-display text-base font-bold text-silver">Need some help?</h4>
        <p className="mt-1 font-display text-[13px] leading-[1.4] text-darkgray">Our quick onboarding tour explains the field protocol.</p>
        <button className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone">
          <Play className="h-3.5 w-3.5" /> Begin tour
        </button>
      </div>
    </aside>
  );
}