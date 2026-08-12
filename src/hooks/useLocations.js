import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import seedMarkers from "@/components/ooh/mapSeed";
import { toMarker } from "@/components/ooh/map/markerUtils";

/**
 * Live Location feed shared by the Map page and the home globe.
 * Loads all non-rejected locations, subscribes to realtime create/update/delete,
 * and falls back to the static seed when the database is empty or unreachable.
 * Returns { markers, live }.
 */
export function useLocations() {
  // Seed markers (mapSeed.js) and live markers (toMarker() in markerUtils.js)
  // carry genuinely different field sets (seed has `notes`, live has
  // `status`) — real, pre-existing inconsistency between the two sources,
  // not something to silently unify here. Typed loosely to reflect that.
  /** @type {[{ markers: Array<Record<string, any>>, live: boolean }, (d: { markers: Array<Record<string, any>>, live: boolean } | ((cur: { markers: Array<Record<string, any>>, live: boolean }) => { markers: Array<Record<string, any>>, live: boolean })) => void]} */
  const [data, setData] = useState({ markers: seedMarkers, live: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const recs = await base44.listAllLocations();
        if (cancelled) return;
        const markers = (recs || []).filter((r) => r.status !== "rejected").map(toMarker);
        setData(markers.length ? { markers, live: true } : { markers: seedMarkers, live: false });
      } catch (e) {
        if (!cancelled) setData({ markers: seedMarkers, live: false });
      }
    };
    load();

    const unsub = base44.entities.Location.subscribe((event) => {
      setData((cur) => {
        if (!cur.live) return cur;
        let markers = cur.markers;
        const m = toMarker(event.data);
        if (event.type === "create") markers = [m, ...markers.filter((x) => x.id !== m.id)];
        else if (event.type === "update") {
          if (m.status === "rejected") markers = markers.filter((x) => x.id !== m.id);
          else markers = markers.map((x) => (x.id === m.id ? m : x));
        } else if (event.type === "delete") markers = markers.filter((x) => x.id !== m.id);
        return { ...cur, markers };
      });
    });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return data;
}