import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import LocationMap from "@/components/ooh/LocationMap";
import seedMarkers from "@/components/ooh/mapSeed";
import { Loader2, FileDown, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

const toMarker = (r) => ({
  id: r.id,
  title: r.title,
  type: r.type,
  address: r.address || "",
  lat: r.lat,
  lng: r.lng,
  image: r.image_url || null,
  link: r.source_link || "",
  status: r.status || "pending",
});

export default function Map() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Location.list("-created_date", 500);
        if (!cancelled) {
          const markers = (recs || []).filter((r) => r.status !== "rejected").map(toMarker);
          if (markers.length) setData({ count: markers.length, markers, live: true });
          else setData({ count: seedMarkers.length, markers: seedMarkers, live: false });
        }
      } catch (e) {
        if (!cancelled) setData({ count: seedMarkers.length, markers: seedMarkers, live: false });
      }
    })();

    const unsub = base44.entities.Location.subscribe((event) => {
      setData((cur) => {
        if (!cur || !cur.live) return cur;
        let markers = cur.markers;
        const m = toMarker(event.data);
        if (event.type === "create") markers = [m, ...markers.filter((x) => x.id !== m.id)];
        else if (event.type === "update") {
          if (m.status === "rejected") markers = markers.filter((x) => x.id !== m.id);
          else markers = markers.map((x) => (x.id === m.id ? m : x));
        } else if (event.type === "delete") markers = markers.filter((x) => x.id !== m.id);
        return { ...cur, markers, count: markers.length };
      });
    });
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: (data?.markers || []).map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: {
          title: m.title,
          address: m.address,
          type: m.type,
          status: m.status,
          link: m.link,
          image: m.image,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ooh-earth-locations.geojson";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative bg-void">
      <Nav />

      {data && (
        <>
          <div className="pointer-events-none absolute left-5 top-[68px] z-[1000] md:left-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // {data.live ? "Live field map" : "Field map · snapshot"} · {data.count} locations
            </span>
          </div>
          <div className="absolute right-5 top-[60px] z-[1000] flex items-center gap-2 md:right-8">
            <button
              onClick={exportGeoJSON}
              className="flex items-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
            >
              <FileDown className="h-3.5 w-3.5" /> GeoJSON
            </button>
            <Link
              to="/report"
              className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Megaphone className="h-3.5 w-3.5" /> Report
            </Link>
          </div>
        </>
      )}

      <div className="h-[calc(100vh-57px)] w-full overflow-hidden">
        {!data ? (
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