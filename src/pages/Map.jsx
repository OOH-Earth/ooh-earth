import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import LocationMap from "@/components/ooh/LocationMap";
import MapToolbar from "@/components/ooh/map/MapToolbar";
import MapSidebar from "@/components/ooh/map/MapSidebar";
import LocationCard from "@/components/ooh/map/LocationCard";
import seedMarkers from "@/components/ooh/mapSeed";
import { Loader2, FileDown, Megaphone, Map as MapIcon, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import Walkthrough from "@/components/ooh/Walkthrough";
import Globe3D from "@/components/ooh/Globe3D";

const TOUR = [
  { title: "Welcome to OOH Map", body: "The live field map of corporate advertising offenses — documented by operatives worldwide." },
  { target: "[data-tour=\"layout\"]", title: "Layout modes", body: "Switch between Split, Map-dominant, and List views to control how much of the map you see." },
  { target: "[data-tour=\"filters\"]", title: "Filter by type", body: "Isolate billboards, digital screens, painted takeovers, and more." },
  { target: "[data-tour=\"search\"]", title: "Search & reset", body: "Find a location by street or city, then reset filters in one tap." },
  { target: "[data-tour=\"cards\"]", title: "The record", body: "Every card is a logged offense. Click one to fly the map to its pin." },
  { target: "[data-tour=\"map\"]", title: "Field map", body: "Pan and zoom to explore. Popups show photo, status, and directions." },
  { target: "[data-tour=\"report\"]", title: "Log an offense", body: "File a new field report — GPS + photo, no login. Reports appear here instantly." },
  { target: "[data-tour=\"theme\"]", title: "Light / Dark", body: "Toggle the Solar Smoke light mode or the signature black canvas anytime." },
  { target: "[data-tour=\"hud-tel\"]", title: "Orbital telemetry", body: "Switch to Globe view — live coordinates, bearing, pitch and view-span stream as you fly." },
  { target: "[data-tour=\"hud-pm25\"]", title: "Air Commons intel", body: "Live PM2.5 from global-south monitoring stations, benchmarked against WHO limits." },
  { title: "Mission ready", body: "You're cleared for field operations. File your first report.", cta: true },
];

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
  const [raw, setRaw] = useState(null);
  const [mode, setMode] = useState("split");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("flat");
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Location.list("-created_date", 500);
        if (!cancelled) {
          const markers = (recs || []).filter((r) => r.status !== "rejected").map(toMarker);
          if (markers.length) setRaw({ markers, live: true });
          else setRaw({ markers: seedMarkers, live: false });
        }
      } catch (e) {
        if (!cancelled) setRaw({ markers: seedMarkers, live: false });
      }
    })();

    const unsub = base44.entities.Location.subscribe((event) => {
      setRaw((cur) => {
        if (!cur || !cur.live) return cur;
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

  const filtered = useMemo(() => {
    const list = raw?.markers || [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (m) => (typeFilter === "all" || m.type === typeFilter) && (!q || `${m.title} ${m.address}`.toLowerCase().includes(q))
    );
  }, [raw, typeFilter, query]);

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: filtered.map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: { title: m.title, address: m.address, type: m.type, status: m.status, link: m.link, image: m.image },
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

  const cardsClass =
    mode === "map" ? "hidden" : mode === "list" ? "flex w-full lg:flex-1" : "hidden lg:flex lg:w-[340px]";
  const mapClass = mode === "list" ? "hidden" : "flex-1";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-void">
      <Nav />
      <MapToolbar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        mode={mode}
        setMode={setMode}
        count={filtered.length}
        live={raw?.live}
      />

      {!raw ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Acquiring coordinates…</span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {mode !== "map" && <MapSidebar query={query} setQuery={setQuery} onReset={() => { setQuery(""); setTypeFilter("all"); }} onBeginTour={() => setTourOpen(true)} />}

          <div data-tour="cards" className={`min-h-0 flex-col border-r border-slate2/60 ${cardsClass}`}>
            <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {filtered.length} results</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length ? (
                filtered.map((m) => (
                  <LocationCard key={m.id} m={m} selected={selectedId === m.id} onSelect={(x) => setSelectedId(x.id)} />
                ))
              ) : (
                <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No matches</div>
              )}
            </div>
          </div>

          <div data-tour="map" className={`relative min-h-0 ${mapClass}`}>
            <div className="absolute left-4 top-4 z-[1000] flex border border-slate2 bg-void/80 backdrop-blur-md">
              <button
                onClick={() => setView("flat")}
                className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === "flat" ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Flat
              </button>
              <button
                onClick={() => setView("globe")}
                className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === "globe" ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                <Globe className="h-3.5 w-3.5" /> Globe
              </button>
            </div>
            {view === "globe" ? (
              <Globe3D markers={filtered} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <LocationMap markers={filtered} selectedId={selectedId} onSelect={setSelectedId} />
            )}
            <div className="absolute right-4 top-4 z-[1000] flex gap-2">
              <button
                onClick={exportGeoJSON}
                className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
              >
                <FileDown className="h-3.5 w-3.5" /> GeoJSON
              </button>
              <Link
                data-tour="report"
                to="/report"
                className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                <Megaphone className="h-3.5 w-3.5" /> Report
              </Link>
            </div>
          </div>
        </div>
      )}

      <Walkthrough open={tourOpen} onClose={() => setTourOpen(false)} steps={TOUR} />
    </div>
  );
}