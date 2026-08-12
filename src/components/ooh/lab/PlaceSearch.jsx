import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Crosshair, Check } from 'lucide-react';

// Compact place-name geocoder using OpenStreetMap Nominatim (free, no key).
// Debounced 450ms, 6 results. Biases results toward the user's current area
// when available, making it far easier to tag archived photos to the right spot.
// Calls onSelect({ lat, lng, label }) on pick.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

export default function PlaceSearch({
  onSelect,
  placeholder = 'Search street, city, or place',
  bias = null,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const boxRef = useRef(null);
  const timer = useRef(null);

  // Allow parent to pass a bias {lat,lng}; otherwise try the browser geolocation.
  const getBias = useCallback(async () => {
    if (bias) return bias;
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, maximumAge: 60000 },
      );
    });
  }, [bias]);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const b = await getBias();
        const params = new URLSearchParams({
          format: 'json',
          limit: '6',
          'accept-language': 'en',
          q: trimmed,
        });
        if (b)
          params.set('viewbox', `${b.lng - 0.15},${b.lat + 0.15},${b.lng + 0.15},${b.lat - 0.15}`);
        if (b) params.set('bounded', '1');
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          headers: { Accept: 'application/json' },
        });
        const data = res.ok ? await res.json() : [];
        setResults(
          data.map((r) => ({
            label: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            type: r.type,
            category: r.category,
          })),
        );
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer.current);
  }, [query, getBias]);

  const select = (r) => {
    onSelect?.({ lat: r.lat, lng: r.lng, label: r.label });
    setQuery(r.label.split(',')[0]);
    setOpen(false);
  };

  // Reverse-geocode the device location and emit it as the selected pin.
  const useMyLocation = async () => {
    setLocating(true);
    try {
      const b = await getBias();
      if (!b) {
        setLocating(false);
        return;
      }
      const res = await fetch(
        `${REVERSE_URL}?format=json&accept-language=en&lat=${b.lat}&lon=${b.lng}`,
        {
          headers: { Accept: 'application/json' },
        },
      );
      const data = res.ok ? await res.json() : null;
      const label = data?.display_name || `${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}`;
      onSelect?.({ lat: b.lat, lng: b.lng, label });
      setQuery(label.split(',')[0]);
    } catch {
      /* silent */
    }
    setLocating(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 border border-slate2 bg-void px-3 py-2 transition-colors focus-within:border-ozone/60">
        <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-[11px] text-silver outline-none placeholder:text-dim"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" />}
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my location"
          className="flex h-5 w-5 shrink-0 items-center justify-center text-dim transition-colors hover:text-ozone"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Crosshair className="h-3.5 w-3.5" />
          )}
        </button>
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
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] leading-snug text-darkgray">
                  {s.label}
                </span>
                {s.category && (
                  <span className="mt-0.5 inline-block font-mono text-[7px] uppercase tracking-[0.15em] text-dim/60">
                    // {s.category}
                  </span>
                )}
              </span>
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-ozone/0 transition-opacity group-hover:text-ozone" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
