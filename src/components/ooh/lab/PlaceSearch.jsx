import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

// Compact place-name geocoder using OpenStreetMap Nominatim (free, no key).
// Debounced 500ms, 5 results. Calls onSelect({ lat, lng, label }) on pick.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function PlaceSearch({ onSelect, placeholder = "Search street, city, or place" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    const trimmed = query.trim();
    if (trimmed.length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const url = `${NOMINATIM_URL}?format=json&limit=5&accept-language=en&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = res.ok ? await res.json() : [];
        setResults(data.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
      } catch { setResults([]); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [query]);

  const select = (r) => {
    onSelect?.({ lat: r.lat, lng: r.lng, label: r.label });
    setQuery(r.label.split(",")[0]);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 border border-slate2 bg-void px-3 py-2 transition-colors focus-within:border-ozone/60">
        <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-[11px] text-silver outline-none placeholder:text-dim"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[1100] max-h-48 overflow-auto border border-slate2 bg-void shadow-lg">
          {results.map((s, i) => (
            <button
              key={i}
              onClick={() => select(s)}
              className="flex w-full items-start gap-2 border-b border-slate2/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-card"
            >
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ozone" />
              <span className="font-mono text-[10px] leading-snug text-darkgray">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}