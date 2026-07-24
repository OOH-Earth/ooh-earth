import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import LocationMap from "@/components/ooh/LocationMap";
import MapToolbar from "@/components/ooh/map/MapToolbar";
import MapSidebar from "@/components/ooh/map/MapSidebar";
import LocationCard from "@/components/ooh/map/LocationCard";
import seedMarkers from "@/components/ooh/mapSeed";
import { Loader2, FileDown, Megaphone, Map as MapIcon, Globe, ScanSearch, Camera, Key } from "lucide-react";
import { Link } from "react-router-dom";
import Walkthrough from "@/components/ooh/Walkthrough";
import UnitFinder from "@/components/ooh/UnitFinder";
import QuickCapture from "@/components/ooh/QuickCapture";
import Globe3D from "@/components/ooh/Globe3D";
import ClaimLeadDialog from "@/components/ooh/map/ClaimLeadDialog";

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

const KNOWN_TYPES = ["billboard", "digital", "painted", "projection", "sticker", "mural", "transit", "other"];
const normType = (t) => {
  const s = String(t || "").toLowerCase().trim();
  if (s === "location") return "other";
  return KNOWN_TYPES.includes(s) ? s : "other";
};

const toMarker = (r) => ({
  id: r.id,
  title: r.title,
  type: normType(r.type),
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
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = useState("globe");
  const [userLoc, setUserLoc] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [claims, setClaims] = useState([]);
  const [claimTarget, setClaimTarget] = useState(null);

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

  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClaims = async () => {
      try {
        const recs = await base44.entities.LeadClaim.list("-created_date", 500);
        if (!cancelled) setClaims(recs || []);
      } catch { if (!cancelled) setClaims([]); }
    };
    loadClaims();
    const unsub = base44.entities.LeadClaim.subscribe(() => loadClaims());
    return () => { cancelled = true; if (unsub) unsub(); };
  }, []);

  const claimsByLoc = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      if (c.status === "released") return;
      const ex = map[c.location_id];
      if (!ex || new Date(c.created_date) > new Date(ex.created_date)) map[c.location_id] = c;
    });
    return map;
  }, [claims]);

  const filtered = useMemo(() => {
    const list = raw?.markers || [];
    const q = query.trim().toLowerCase();
    return list
      .filter(
        (m) => (typeFilter === "all" || m.type === typeFilter) && (!q || `${m.title} ${m.address}`.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aPhoto = a.status === "verified" && !!a.image ? 2 : a.image ? 1 : 0;
        const bPhoto = b.status === "verified" && !!b.image ? 2 : b.image ? 1 : 0;
        return bPhoto - aPhoto;
      });
  }, [raw, typeFilter, query]);

  const counts = useMemo(() => {
    const c = {};
    (raw?.markers || []).forEach((m) => { c[m.type] = (c[m.type] || 0) + 1; });
    return c;
  }, [raw]);

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

  const leads = filtered.filter((m) => !m.image && m.status !== "verified").length;

  const cardsClass =
    mode === "map" ? "hidden" : mode === "list" ? "flex w-full lg:flex-1" : "hidden lg:flex lg:w-[340px]";
  const mapClass = mode === "list" ? "hidden" : "flex-1";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-void">
      <Nav />
      <MapToolbar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        mode={mode}
        setMode={setMode}
        count={filtered.length}
        live={raw?.live}
        counts={counts}
        total={raw?.markers?.length || 0}
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
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// {filtered.length} results {leads > 0 && <span className="text-flare/80">· {leads} leads</span>}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length ? (
                filtered.map((m) => (
                  <LocationCard key={m.id} m={m} selected={selectedId === m.id} onSelect={(x) => setSelectedId(x.id)} onHover={(x) => setHoverId(x.id)} onHoverEnd={() => setHoverId(null)} claim={claimsByLoc[m.id]} onClaim={setClaimTarget} />
                ))
              ) : (
                <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No matches</div>
              )}
            </div>
          </div>

          <div data-tour="map" className={`relative min-h-0 ${mapClass}`}>
            <div className="absolute left-3 top-3 z-[1000] flex border border-slate2 bg-void/80 backdrop-blur-md">
              <button
                onClick={() => setView("flat")}
                aria-label="Flat map"
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === "flat" ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flat</span>
              </button>
              <button
                onClick={() => setView("globe")}
                aria-label="Globe view"
                className={`flex items-center gap-1.5 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${view === "globe" ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Globe</span>
              </button>
            </div>
            {view === "globe" ? (
              <Globe3D markers={filtered} selectedId={selectedId} hoverId={hoverId} onSelect={setSelectedId} userLoc={userLoc} />
            ) : (
              <LocationMap markers={filtered} selectedId={selectedId} hoverId={hoverId} onSelect={setSelectedId} userLoc={userLoc} />
            )}
            <div className="absolute right-3 top-3 z-[1000] flex gap-1.5">
              <button
                onClick={() => setFinderOpen(true)}
                aria-label="Find units"
                className="flex items-center gap-1.5 border border-ozone/60 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md transition-colors hover:bg-ozone hover:text-void"
              >
                <ScanSearch className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Find</span>
              </button>
              <button
                onClick={exportGeoJSON}
                aria-label="Export GeoJSON"
                className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
              >
                <FileDown className="h-3.5 w-3.5" /> <span className="hidden sm:inline">GeoJSON</span>
              </button>
              <a
                href="https://ooh.earth/access-keys/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Access keys reference"
                className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
              >
                <Key className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Keys</span>
              </a>
              <button
                onClick={() => setCaptureOpen(true)}
                aria-label="Capture photo"
                className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                <Camera className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Capture</span>
              </button>
              <Link
                data-tour="report"
                to="/report"
                aria-label="Report"
                className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                <Megaphone className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Report</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <ClaimLeadDialog open={!!claimTarget} onClose={() => setClaimTarget(null)} location={claimTarget} />
      <Walkthrough open={tourOpen} onClose={() => setTourOpen(false)} steps={TOUR} />
      <UnitFinder open={finderOpen} onClose={() => setFinderOpen(false)} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}