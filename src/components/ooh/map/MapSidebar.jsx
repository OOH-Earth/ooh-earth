import { RotateCcw, LifeBuoy, Play, ChevronLeft } from 'lucide-react';
import MapSearch from '@/components/ooh/map/MapSearch';

export default function MapSidebar({ query, setQuery, onFlyTo, onReset, onBeginTour, onCollapse }) {
  return (
    <aside
      data-tour="search"
      className="hidden w-[300px] shrink-0 flex-col border-r border-slate2/60 bg-void lg:flex"
    >
      <div className="flex items-start justify-between border-b border-slate2/60 p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // Search / Map
          </div>
          <p className="mt-1 font-display text-sm text-darkgray">Find a place or filter pins.</p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label="Collapse search panel"
            title="Collapse"
            className="flex h-6 w-6 shrink-0 items-center justify-center border border-slate2/60 text-dim transition-colors hover:border-ozone hover:text-ozone"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            Location
          </label>
          <MapSearch query={query} setQuery={setQuery} onFlyTo={onFlyTo} onReset={onReset} />
        </div>
        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-1.5 border border-slate2 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset filters
        </button>
      </div>
      <div className="m-5 mt-auto border border-slate2/60 bg-card p-5">
        <LifeBuoy className="h-5 w-5 text-ozone" />
        <h4 className="mt-3 font-display text-base font-bold text-silver">Need some help?</h4>
        <p className="mt-1 font-display text-[13px] leading-[1.4] text-darkgray">
          Our quick onboarding tour explains the field protocol.
        </p>
        <button
          onClick={onBeginTour}
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-opacity hover:opacity-70"
        >
          <Play className="h-3.5 w-3.5" /> Begin tour
        </button>
      </div>
    </aside>
  );
}
