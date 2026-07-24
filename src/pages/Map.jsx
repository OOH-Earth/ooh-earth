import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import LocationMap from "@/components/ooh/LocationMap";
import seedMarkers from "@/components/ooh/mapSeed";
import { Loader2 } from "lucide-react";

export default function Map() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("fetchMapLocations", { pages: 4 });
        const d = res.data;
        if (!cancelled) {
          if (d && d.count > 0) setData(d);
          else setData({ count: seedMarkers.length, markers: seedMarkers, live: false });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load map data.");
          setData({ count: seedMarkers.length, markers: seedMarkers, live: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative bg-void">
      <Nav />

      {data && (
        <div className="pointer-events-none absolute left-5 top-[68px] z-[1000] md:left-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
            // {data.live ? "Live field map" : "Field map · snapshot"} · {data.count} locations
          </span>
        </div>
      )}

      <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// Signal lost</p>
              <p className="mt-3 max-w-xs font-display text-sm text-darkgray">{error}</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Acquiring coordinates…</span>
            </div>
          </div>
        ) : (
          <LocationMap markers={data.markers} />
        )}
      </div>
    </div>
  );
}