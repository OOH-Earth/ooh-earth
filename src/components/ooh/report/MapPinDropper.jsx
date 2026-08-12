import { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Search, Crosshair, Loader2, MapPin, Check } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TerminalTooltip from "@/components/ooh/TerminalTooltip";

// Free OSM tiles — no API key needed, same quality as the main atlas map.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

// Custom yellow pin icon — matches OOH brand ozone accent
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="#EDFF00" stroke="#000" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#000"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

// Helper: grab the device location for map centering
function getDeviceLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

// Click-to-drop handler — updates parent marker on map click
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Fly-to controller — moves the map when a search result is chosen
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function MapPinDropper({ lat, lng, onPick, placeholder = "Search street, city, or place" }) {
  const [center, setCenter] = useState(/** @type {[number, number]} */ ([13.7563, 100.5018])); // Bangkok default
  const [zoom, setZoom] = useState(12);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [reverseLabel, setReverseLabel] = useState("");
  const boxRef = useRef(null);
  const timer = useRef(null);

  // Initialize map to device location on mount
  useEffect(() => {
    (async () => {
      const loc = await getDeviceLocation();
      if (loc) {
        setCenter([loc.lat, loc.lng]);
        setZoom(15);
        // If no pin yet, auto-drop on current location
        if (!lat && !lng) onPick({ lat: loc.lat, lng: loc.lng });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(timer.current);
    const trimmed = query.trim();
    if (trimmed.length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ format: "json", limit: "6", "accept-language": "en", q: trimmed });
        const res = await fetch(`${NOMINATIM_URL}?${params}`, { headers: { Accept: "application/json" } });
        const data = res.ok ? await res.json() : [];
        setResults(data.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
      } catch { setResults([]); }
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setSearching(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reverse-geocode when pin moves, for a human-readable label
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`${REVERSE_URL}?format=json&accept-language=en&lat=${lat}&lon=${lng}`, {
        headers: { Accept: "application/json" },
      });
      const data = res.ok ? await res.json() : null;
      setReverseLabel(data?.display_name || "");
    } catch { setReverseLabel(""); }
  }, []);

  const handlePick = useCallback((coords) => {
    onPick(coords);
    reverseGeocode(coords.lat, coords.lng);
  }, [onPick, reverseGeocode]);

  const selectResult = (r) => {
    handlePick({ lat: r.lat, lng: r.lng });
    setFlyTarget({ lat: r.lat, lng: r.lng });
    setSearching(false);
    setQuery(r.label.split(",")[0]);
  };

  const recenter = async () => {
    const loc = await getDeviceLocation();
    if (loc) {
      setCenter([loc.lat, loc.lng]);
      setFlyTarget({ lat: loc.lat, lng: loc.lng });
      handlePick(loc);
    }
  };

  const hasPin = lat && lng && isFinite(parseFloat(lat)) && isFinite(parseFloat(lng));
  const pinPos = hasPin ? /** @type {[number, number]} */ ([parseFloat(lat), parseFloat(lng)]) : null;

  return (
    <div className="relative border border-slate2 bg-card crt-scanlines">
      {/* ── Terminal title bar — traffic lights + command path ── */}
      <div className="flex items-center gap-1.5 border-b border-slate2 bg-void/60 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-flare/70" />
        <span className="h-2 w-2 rounded-full bg-ozone/70" />
        <span className="h-2 w-2 rounded-full bg-dim/50" />
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">ROOT@OOH:~ — PIN_DROP.SH</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/60">
          // live
          <TerminalTooltip label="pin dropper" text="Search any address worldwide, or tap directly on the map to drop a pin at the exact ad location." />
        </span>
      </div>

      {/* ── Reticle corners ── */}
      <Crosshair className="pointer-events-none absolute left-2 top-8 h-3 w-3 text-ozone/50" />
      <Crosshair className="pointer-events-none absolute right-2 top-8 h-3 w-3 text-ozone/50" />
      <Crosshair className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 text-ozone/50" />
      <Crosshair className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 text-ozone/50" />

      {/* ── Command prompt + search bar ── */}
      <div ref={boxRef} className="relative border-b border-slate2/60">
        <div className="flex items-center gap-2 bg-void px-3 py-2 pl-9">
          <span className="font-mono text-[10px] text-ozone">$</span>
          <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearching(true); }}
            onFocus={() => setSearching(true)}
            placeholder={placeholder}
            className="w-full bg-transparent font-mono text-[11px] text-silver outline-none placeholder:text-dim"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" />}
          <span className="flex items-center gap-1">
            <TerminalTooltip label="search" text="Type a street, landmark, or city. Results appear below — click one to fly the map there." side="left" />
          </span>
          <button
            type="button"
            onClick={recenter}
            title="Recenter on me"
            className="flex h-5 w-5 shrink-0 items-center justify-center text-dim transition-colors hover:text-ozone"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        </div>
        {searching && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[1200] max-h-48 overflow-auto border border-slate2 bg-void shadow-lg">
            {results.map((s, i) => (
              <button
                key={i}
                onClick={() => selectResult(s)}
                className="flex w-full items-start gap-2 border-b border-slate2/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-card"
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ozone" />
                <span className="font-mono text-[10px] leading-snug text-darkgray">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Live map ── */}
      <div className="relative">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-64 w-full"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <ClickHandler onPick={handlePick} />
          <FlyTo target={flyTarget} />
          {pinPos && <Marker position={pinPos} icon={pinIcon} />}
        </MapContainer>

        {/* Hint overlay — shown when no pin */}
        {!hasPin ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[1100] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap border border-ozone/40 bg-void/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone backdrop-blur-sm">
            // tap map to drop pin
          </div>
        ) : (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[1100] -translate-x-1/2 whitespace-nowrap border border-ozone/40 bg-void/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone backdrop-blur-sm">
            // pin locked — tap again to adjust
          </div>
        )}

        {/* Tooltip guide — bottom-right of map */}
        <div className="pointer-events-none absolute bottom-2 right-8 z-[1100] flex items-center gap-1 border border-slate2/50 bg-void/80 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-dim backdrop-blur-sm">
          <TerminalTooltip label="how to pin" text="1. Search the address above, or 2. Tap any spot on the map, or 3. Use the crosshair to jump to your GPS." side="top" />
          guide
        </div>
      </div>

      {/* ── Coordinates readout — terminal status line ── */}
      <div className="flex items-center gap-2 border-t border-slate2 bg-void/60 px-3 py-2 pl-9">
        {hasPin ? (
          <>
            <Check className="h-3 w-3 text-ozone" />
            <span className="font-mono text-[10px] tabular text-silver">
              {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
            </span>
            {reverseLabel && (
              <span className="ml-auto truncate font-mono text-[9px] text-dim">{reverseLabel.split(",")[0]}</span>
            )}
          </>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-flare/70">// awaiting coordinates…</span>
        )}
      </div>
    </div>
  );
}