import { useState, useEffect, useMemo, useCallback } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { base44 } from "@/api/base44Client";
import Nav from "@/components/ooh/Nav";
import LocationMap from "@/components/ooh/LocationMap";
import MapToolbar from "@/components/ooh/map/MapToolbar";
import MapSidebar from "@/components/ooh/map/MapSidebar";
import MapSearch from "@/components/ooh/map/MapSearch";
import LocationCard from "@/components/ooh/map/LocationCard";
import seedMarkers from "@/components/ooh/mapSeed";
import { toMarker } from "@/components/ooh/map/markerUtils";
import { Loader2, FileDown, Megaphone, Map as MapIcon, Globe, ScanSearch, Camera, Key, Crosshair, SprayCan, Maximize2, Minimize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWalkthrough } from "@/lib/walkthroughContext";
import UnitFinder from "@/components/ooh/UnitFinder";
import QuickCapture from "@/components/ooh/QuickCapture";
import GraffitiCamera from "@/components/ooh/GraffitiCamera";
import Globe3D from "@/components/ooh/Globe3D";
import MapAlertTicker from "@/components/ooh/map/MapAlertTicker";
import MapLayerToggle, { DEFAULT_LAYERS } from "@/components/ooh/map/MapLayerToggle";
import PullToRefresh from "@/components/ooh/PullToRefresh";
import ClaimLeadDialog from "@/components/ooh/map/ClaimLeadDialog";
import SpecsBar from "@/components/ooh/uikit/pinlab/SpecsBar";
import { OOH_FUTURES } from "@/components/ooh/map/futures";
import { useMushroomData } from "@/components/ooh/map/layers/useMushroomData";
import { useFloraData } from "@/components/ooh/map/layers/useFloraData";
import { useWarZoneData } from "@/components/ooh/map/layers/useWarZoneData";
import { RIVER_SOURCES } from "@/components/ooh/map/layers/riverData";
import LayerResultCard from "@/components/ooh/map/LayerResultCard";
import MapStyleSwitcher from "@/components/ooh/map/MapStyleSwitcher";
import MapBottomSheet from "@/components/ooh/map/MapBottomSheet";
import { useMapStyle } from "@/lib/mapStyleContext";
import RadioStationCard from "@/components/ooh/map/RadioStationCard";
import { RADIO_STATIONS } from "@/components/ooh/radio/radioStations";

const TOUR = [
  { title: "Welcome to OOH Map", body: "The live field map of corporate advertising spots — documented by members worldwide." },
  { target: "[data-tour=\"layout\"]", title: "Layout modes", body: "Switch between Split, Map-dominant, and List views to control how much of the map you see." },
  { target: "[data-tour=\"filters\"]", title: "Filter by type", body: "Isolate billboards, digital screens, painted takeovers, and more." },
  { target: "[data-tour=\"search\"]", title: "Search & reset", body: "Find a location by street or city, then reset filters in one tap." },
  { target: "[data-tour=\"cards\"]", title: "The record", body: "Every card is a logged spot. Click one to fly the map to its pin." },
  { target: "[data-tour=\"map\"]", title: "Field map", body: "Pan and zoom to explore. Popups show photo, status, and directions." },
  { target: "[data-tour=\"report\"]", title: "Log a spot", body: "File a new field report — GPS + photo, no login. Reports appear here instantly." },
  { target: "[data-tour=\"theme\"]", title: "Light / Dark", body: "Toggle the Solar Smoke light mode or the signature black canvas anytime." },
  { target: "[data-tour=\"hud-tel\"]", title: "Orbital telemetry", body: "Switch to Globe view — live coordinates, bearing, pitch and view-span stream as you fly." },
  { target: "[data-tour=\"hud-pm25\"]", title: "Air Commons intel", body: "Live PM2.5 from global-south monitoring stations, benchmarked against WHO limits." },
  { target: "[data-tour=\"map\"]", title: "OOH Futures — Global South roadmap", body: "Dashed markers scattered among live spots are futures: placeholder expansion pillars across Lagos, Nairobi, Jakarta, São Paulo, Manila, Dhaka and beyond. Hover one to preview its phase." },
  { target: "[data-tour=\"map\"]", title: "Roadmap phases", body: "Each future carries a target quarter — Q3 2026 through 2028. When a phase opens, members can claim a future to seed the local network and convert it into live locations." },
  { title: "Ready to go", body: "You're all set. File your first report.", cta: true },
];

export default function Map() {
  const [raw, setRaw] = useState(null);
  const [mode, setMode] = usePersistentState("ooh-map-mode", "split");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [view, setView] = usePersistentState("ooh-map-view", "globe");
  const [bounds, setBounds] = useState(null);
  const [followViewport, setFollowViewport] = usePersistentState("ooh-map-follow", true);
  const [userLoc, setUserLoc] = useState(null);
  const { startTour, registerSteps } = useWalkthrough();
  const [finderOpen, setFinderOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const [activeLayers, setActiveLayers] = usePersistentState("ooh-map-layers-v2", DEFAULT_LAYERS);
  const [layerFilter, setLayerFilter] = useState("all");
  const { style: mapStyle } = useMapStyle();
  const { spots: mushrooms, loading: mushLoading } = useMushroomData();
  const { spots: floraSpots, loading: floraLoading } = useFloraData();
  const { zones: warZones, loading: warLoading } = useWarZoneData();

  const toggleLayer = (id) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  useEffect(() => { registerSteps(TOUR); }, [registerSteps]);

  // City deep-link: /map?area=bangkok pre-fills the search to filter that city.
  useEffect(() => {
    const area = new URLSearchParams(window.location.search).get("area");
    if (area) setQuery(area);
  }, []);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [graffitiCamOpen, setGraffitiCamOpen] = useState(false);
  const [claims, setClaims] = useState([]);
  const [claimTarget, setClaimTarget] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState("peek");
  const [detailItem, setDetailItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection — lg breakpoint (1024px) separates the mobile sheet
  // layout from the desktop split layout.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fullscreen body class — hides the global mobile bottom tabs.
  useEffect(() => {
    if (fullscreen) document.body.classList.add("map-fullscreen");
    else document.body.classList.remove("map-fullscreen");
    return () => document.body.classList.remove("map-fullscreen");
  }, [fullscreen]);

  // Expand a pin's compact popup into the full detail in the bottom sheet.
  const handleExpandPin = useCallback((m) => {
    setDetailItem(m);
    setSelectedId(m.id);
    setSheetSnap("half");
  }, []);

  const reloadLocations = useCallback(async () => {
    try {
      const recs = await base44.listAllLocations();
      const markers = (recs || []).filter((r) => r.status !== "rejected").map(toMarker);
      setRaw(markers.length ? { markers, live: true } : { markers: seedMarkers, live: false });
    } catch (e) {
      setRaw({ markers: seedMarkers, live: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    reloadLocations().then(() => {});

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

  // Street layers are overlapping views of the Location entity.
  // "ads" is the superset (all markers); "adbusting" and "graffiti" are
  // subsets. When multiple street layers are active we show the union,
  // with "ads" absorbing the others since it contains every marker.
  const { primaryLayer, layerFiltered } = useMemo(() => {
    const hasAds = activeLayers.includes("ads");
    const hasAdbust = activeLayers.includes("adbusting");
    const hasGraffiti = activeLayers.includes("graffiti");

    let streetLayer = null;
    let lf = [];

    if (hasAds) {
      streetLayer = "ads";
      lf = filtered;
    } else if (hasAdbust || hasGraffiti) {
      streetLayer = hasAdbust ? "adbusting" : "graffiti";
      lf = filtered.filter((m) => {
        const isAdbust = hasAdbust && m.adbust_type && m.adbust_type !== "none";
        const isGraffiti = hasGraffiti && (m.graffiti_medium || ["painted", "mural", "sticker"].includes(m.type) || ["painted_over", "wheatpasted"].includes(m.adbust_type));
        return isAdbust || isGraffiti;
      });
    }

    // External layers (mushrooms, rivers, etc.) take priority for the sidebar
    // only when no street layer is active. They render their own map markers
    // via LayerManager, so Location pins are cleared to avoid clutter.
    if (!streetLayer) {
      const ext = ["rivers", "mushrooms", "flora", "war", "radio"].find((l) => activeLayers.includes(l));
      return { primaryLayer: ext || null, layerFiltered: [] };
    }

    return { primaryLayer: streetLayer, layerFiltered: lf };
  }, [activeLayers, filtered]);

  // Results feed follows the map viewport (flat view): only spots inside the
  // visible bounds, nearest-to-centre first — the "search this area" pattern.
  const adsInView = useMemo(() => {
    if (view !== "flat" || !followViewport || !bounds) return layerFiltered;
    const { n, s, e, w } = bounds;
    const inLng = (lng) => (w <= e ? lng >= w && lng <= e : lng >= w || lng <= e);
    const cLat = (n + s) / 2;
    const cLng = (w + e) / 2;
    return layerFiltered
      .filter((m) => isFinite(m.lat) && isFinite(m.lng) && m.lat <= n && m.lat >= s && inLng(m.lng))
      .sort((a, b) => ((a.lat - cLat) ** 2 + (a.lng - cLng) ** 2) - ((b.lat - cLat) ** 2 + (b.lng - cLng) ** 2));
  }, [layerFiltered, view, followViewport, bounds]);

  useEffect(() => { setLayerFilter("all"); }, [primaryLayer]);

  const layerLoading = primaryLayer === "mushrooms" ? mushLoading
    : primaryLayer === "flora" ? floraLoading
    : primaryLayer === "war" ? warLoading
    : false;

  const layerResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (text) => !q || text.toLowerCase().includes(q);
    switch (primaryLayer) {
      case "ads": case "adbusting": case "graffiti": return adsInView;
      case "mushrooms": return mushrooms.filter((s) =>
        (layerFilter === "all" || s.region === layerFilter) &&
        matches(`${s.species} ${s.region} ${s.habitat} ${s.note || ""}`));
      case "flora": return floraSpots.filter((s) =>
        (layerFilter === "all" || s.ecosystem === layerFilter) &&
        matches(`${s.species} ${s.region} ${s.ecosystem} ${s.note || ""}`));
      case "war": return warZones.filter((z) =>
        (layerFilter === "all" || (layerFilter === "critical" ? z.severity === "critical" : z.severity !== "critical")) &&
        matches(`${z.title} ${z.region} ${z.advisory} ${z.source || ""}`));
      case "rivers": return RIVER_SOURCES.filter((s) =>
        (layerFilter === "all" || s.pollution === layerFilter) &&
        matches(`${s.name} ${s.river} ${s.notes}`));
      case "radio": return RADIO_STATIONS.filter((s) =>
        isFinite(s.lat) && isFinite(s.lng) &&
        (layerFilter === "all" || s.category === layerFilter) &&
        matches(`${s.name} ${s.city} ${s.country} ${s.genre}`));
      default: return [];
    }
  }, [primaryLayer, filtered, adsInView, mushrooms, floraSpots, warZones, layerFilter, query]);

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

  const leads = adsInView.filter((m) => !m.image && m.status !== "verified").length;
  const isStreet = primaryLayer === "ads" || primaryLayer === "adbusting" || primaryLayer === "graffiti";

  // Mobile: map always visible, cards always hidden (bottom sheet replaces).
  // Desktop: mode controls split/list/map as before.
  const cardsClass =
    mode === "map" ? "hidden" : mode === "list" ? "hidden lg:flex lg:flex-1" : "hidden lg:flex lg:w-[340px]";
  const mapClass = mode === "list" ? "flex-1 lg:hidden" : "flex-1";

  // Shared results list — rendered in the desktop cards panel and the mobile
  // bottom sheet so both stay in sync from the same state.
  const renderResultsContent = () => (
    <PullToRefresh onRefresh={reloadLocations} className="min-h-0 flex-1">
      <div className="space-y-px">
        {!primaryLayer ? (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No active layers — toggle a layer above</div>
        ) : layerLoading ? (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// Loading {primaryLayer} data…</div>
        ) : layerResults.length ? (
          isStreet ? (
            layerResults.map((m) => (
              <LocationCard key={m.id} m={m} selected={selectedId === m.id} onSelect={(x) => setSelectedId(x.id)} onHover={(x) => setHoverId(x.id)} onHoverEnd={() => setHoverId(null)} claim={claimsByLoc[m.id]} onClaim={setClaimTarget} />
            ))
          ) : primaryLayer === "radio" ? (
            layerResults.map((s) => <RadioStationCard key={s.id} station={s} />)
          ) : (
            layerResults.map((item, i) => <LayerResultCard key={`${primaryLayer}-${i}`} item={item} layer={primaryLayer} />)
          )
        ) : isStreet && followViewport && view === "flat" ? (
          <div className="p-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No spots in this view</div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">Pan or zoom out to widen the sweep</p>
            {filtered.length > 0 && (
              <button onClick={() => setFollowViewport(false)} className="mt-3 inline-flex items-center gap-1 border border-slate2 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
                Show all {filtered.length}
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No {primaryLayer} matches{query ? ` for "${query}"` : ""}</div>
        )}
      </div>
    </PullToRefresh>
  );

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden bg-void ${fullscreen ? "pt-0 pb-0" : "pt-[calc(7rem_+_env(safe-area-inset-top))] md:pt-[calc(8rem_+_env(safe-area-inset-top))] pb-[calc(76px_+_env(safe-area-inset-bottom))] lg:pb-0"}`}>
      {!fullscreen && <Nav />}
      {!fullscreen && (
        <div className="hidden lg:block">
          <MapToolbar
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            mode={mode}
            setMode={setMode}
            count={layerResults.length}
            live={raw?.live}
            counts={counts}
            total={raw?.markers?.length || 0}
            activeLayers={activeLayers}
            primaryLayer={primaryLayer}
            layerFilter={layerFilter}
            setLayerFilter={setLayerFilter}
          />
        </div>
      )}
      {!fullscreen && <div className="hidden lg:block"><MapLayerToggle activeLayers={activeLayers} onToggle={toggleLayer} /></div>}

      {/* Mobile compact bar — search + fullscreen toggle */}
      {!fullscreen && (
        <div className="flex items-center gap-1.5 border-b border-slate2/60 bg-void/95 px-2 py-1.5 backdrop-blur-md lg:hidden">
          <div className="min-w-0 flex-1">
            <MapSearch
              query={query}
              setQuery={setQuery}
              onFlyTo={(f) => setFlyTo({ ...f, nonce: Date.now() })}
              onReset={() => { setQuery(""); setTypeFilter("all"); setLayerFilter("all"); }}
            />
          </div>
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Fullscreen map"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-ozone/60 text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!raw ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">Acquiring coordinates…</span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {mode !== "map" && <MapSidebar query={query} setQuery={setQuery} onFlyTo={(f) => setFlyTo({ ...f, nonce: Date.now() })} onReset={() => { setQuery(""); setTypeFilter("all"); setLayerFilter("all"); }} onBeginTour={startTour} />}

          <div data-tour="cards" className={`min-h-0 flex-col border-r border-slate2/60 ${cardsClass}`}>
            <div className="flex items-center justify-between border-b border-slate2/60 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
                // {layerResults.length}{isStreet && followViewport && view === "flat" ? <> in view<span className="text-dim/60"> · {filtered.length} total</span></> : " results"}
                {isStreet && leads > 0 && <span className="text-flare/80"> · {leads} leads</span>}
              </span>
              {isStreet && view === "flat" && (
                <button
                  onClick={() => setFollowViewport((v) => !v)}
                  title="Results feed follows the map view"
                  className={`flex items-center gap-1 border px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${followViewport ? "border-ozone/60 bg-ozone/10 text-ozone" : "border-slate2 text-darkgray hover:border-ozone/60 hover:text-ozone"}`}
                >
                  <Crosshair className="h-3 w-3" /> Follow map
                </button>
              )}
            </div>
            {renderResultsContent()}
          </div>

          <div data-tour="map" className={`relative min-h-0 isolate ${mapClass}`}>
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
              <Globe3D key={mapStyle.id} markers={layerFiltered} selectedId={selectedId} hoverId={hoverId} onSelect={setSelectedId} userLoc={userLoc} activeLayers={activeLayers} flyTo={flyTo} onError={() => setView("flat")} />
            ) : (
              <LocationMap markers={layerFiltered} selectedId={selectedId} hoverId={hoverId} onSelect={setSelectedId} userLoc={userLoc} futures={OOH_FUTURES} activeLayers={activeLayers} onBoundsChange={setBounds} flyTo={flyTo} compactPopup={isMobile} onExpandPin={handleExpandPin} />
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] px-3 pt-16">
              <MapAlertTicker />
            </div>
            {view === "flat" && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[900]">
                <SpecsBar counts={counts} total={raw?.markers?.length || 0} />
              </div>
            )}
            <div className="absolute right-3 top-3 z-[1000] flex gap-1.5">
              <MapStyleSwitcher />
              <button
                onClick={() => setFinderOpen(true)}
                aria-label="Find units"
                className="hidden md:flex items-center gap-1.5 border border-ozone/60 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md transition-colors hover:bg-ozone hover:text-void"
              >
                <ScanSearch className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Find</span>
              </button>
              <button
                onClick={exportGeoJSON}
                aria-label="Export GeoJSON"
                className="hidden md:flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
              >
                <FileDown className="h-3.5 w-3.5" /> <span className="hidden sm:inline">GeoJSON</span>
              </button>
              <a
                href="https://oohearth.app/access-keys/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Access keys reference"
                className="hidden md:flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
              >
                <Key className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Keys</span>
              </a>
              <button
                onClick={() => setGraffitiCamOpen(true)}
                aria-label="Graffiti camera"
                className="flex items-center gap-1.5 border border-flare bg-flare px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-ozone hover:border-ozone"
              >
                <SprayCan className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Graffiti</span>
              </button>
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

      {/* Mobile bottom sheet — outside map isolate so z-index works above bottom nav */}
      {raw && (
        <MapBottomSheet
          count={layerResults.length}
          layerLabel={primaryLayer}
          detailMode={!!detailItem}
          onCloseDetail={() => setDetailItem(null)}
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((f) => !f)}
        >
          {detailItem ? (
            <div className="p-3">
              <LocationCard m={detailItem} selected onSelect={() => {}} onHover={() => {}} onHoverEnd={() => {}} claim={claimsByLoc[detailItem.id]} onClaim={setClaimTarget} />
            </div>
          ) : renderResultsContent()}
        </MapBottomSheet>
      )}

      <ClaimLeadDialog open={!!claimTarget} onClose={() => setClaimTarget(null)} location={claimTarget} />
      <UnitFinder open={finderOpen} onClose={() => setFinderOpen(false)} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <GraffitiCamera open={graffitiCamOpen} onClose={() => setGraffitiCamOpen(false)} />
    </div>
  );
}