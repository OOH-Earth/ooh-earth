import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

// Module-level geocode cache — shared across all MapSearch instances so the
// desktop sidebar + mobile bar never double-fetch Nominatim for the same query.
// Uses OpenStreetMap Nominatim (free, no API key). 500ms debounce respects the
// 1 req/sec usage policy; results cached 8s.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
let _cache = { q: null, results: [], loading: false, ts: 0 };
const _subs = new Set();
let _timer = null;

function emit() {
  _subs.forEach((fn) => fn());
}

function parse(r) {
  return { label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
}

function requestGeocode(q) {
  const now = Date.now();
  if (q === _cache.q && now - _cache.ts < 8000) {
    emit();
    return;
  }
  _cache = { q, results: [], loading: true, ts: now };
  emit();
  clearTimeout(_timer);
  const trimmed = q.trim();
  if (trimmed.length < 3) {
    _cache = { q, results: [], loading: false, ts: now };
    emit();
    return;
  }
  _timer = setTimeout(async () => {
    try {
      const url = `${NOMINATIM_URL}?format=json&limit=5&accept-language=en&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const results = res.ok ? (await res.json()).map(parse) : [];
      _cache = { q, results, loading: false, ts: Date.now() };
    } catch {
      _cache = { q, results: [], loading: false, ts: Date.now() };
    }
    emit();
  }, 500);
}

/**
 * Unified map search: live pin-filter input (controlled by parent `query`)
 * + debounced place-name autocomplete (geocode fly-to) + clear button.
 * Works identically on desktop and mobile.
 */
// `onReset`: accepted but currently unused — Map.jsx passes a handler that
// also clears type/layer filters, but this component's own clear button
// only resets `query` via `setQuery("")`. Possible real gap (clearing
// search doesn't reset the other filters) or intentionally separate
// concerns — flagged, not guessed at; kept for call-site type-compatibility
// only (same pattern as BrandMark.jsx's `spinning` prop).
export default function MapSearch({
  query,
  setQuery,
  onFlyTo,
  onReset = null,
  placeholder = 'Search street, city, or place',
  className = '',
}) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    const fn = () => force((n) => n + 1);
    _subs.add(fn);
    return () => {
      _subs.delete(fn);
    };
  }, []);

  useEffect(() => {
    requestGeocode(query);
  }, [query]);

  const current = _cache.q === query ? _cache : { results: [], loading: false };
  const suggestions = current.results;
  const loading = current.loading;

  // Close dropdown on outside click / Escape
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (s) => {
    onFlyTo?.({ lat: s.lat, lng: s.lng, zoom: 13, label: s.label });
    setOpen(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      select(suggestions[activeIdx]);
    }
  };

  const clear = () => {
    setQuery('');
    setActiveIdx(-1);
  };

  return (
    <div ref={boxRef} data-tour="search" className={`relative ${className}`}>
      <div className="flex items-center gap-2 border border-slate2 bg-card px-3 py-2.5 transition-colors focus-within:border-ozone/60">
        <Search className="h-3.5 w-3.5 shrink-0 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search map"
          className="w-full bg-transparent font-display text-sm text-silver outline-none placeholder:text-dim"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ozone" />}
        {!loading && query && (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="shrink-0 text-dim transition-colors hover:text-ozone"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[1100] max-h-64 overflow-auto border border-slate2 bg-void shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => select(s)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex w-full items-start gap-2 border-b border-slate2/40 px-3 py-2 text-left transition-colors last:border-b-0 ${activeIdx === i ? 'bg-ozone/10' : 'hover:bg-card'}`}
            >
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ozone" />
              <span className="font-display text-[12px] leading-snug text-darkgray">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
