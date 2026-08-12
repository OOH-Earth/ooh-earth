import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Plus, Check, Loader2, X, Sparkles } from 'lucide-react';

const TYPE_LABEL = {
  billboard: 'Billboard',
  digital: 'Digital',
  painted: 'Painted',
  projection: 'Projection',
  sticker: 'Sticker',
  mural: 'Mural',
  transit: 'Transit',
  other: 'Other',
};

async function geocode(address, query) {
  const q = `${address}, ${query}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'en' },
  });
  const j = await res.json();
  const hit = j && j[0];
  return hit ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) } : null;
}

export default function UnitFinder({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const find = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setCandidates([]);
    setAddedIds(new Set());
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an out-of-home (OOH) advertising field intelligence system. For the area "${query}", identify up to 8 real or highly probable out-of-home advertising units visible in public space (billboards, digital screens, painted walls, transit shelters, murals, projections, stickers). For each return: a short descriptive name, a type (exactly one of: billboard, digital, painted, projection, sticker, mural, transit, other), a specific street address or landmark location, and a brief note. Use your knowledge of the area's main roads, transit corridors and landmarks.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            units: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  address: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
      });
      // InvokeLLM's SDK type is `string | object`; response_json_schema
      // above guarantees an object at runtime.
      const data = /** @type {{ units?: any[] }} */ (res);
      const units = (data && data.units) || [];
      const withCoords = await Promise.all(
        units.map(async (u, idx) => {
          const c = await geocode(u.address, query).catch(() => null);
          return { ...u, id: 'c' + idx, lat: c?.lat, lng: c?.lng, located: !!c };
        }),
      );
      setCandidates(withCoords);
      if (!withCoords.length) setError('No units found — try a more specific area or city.');
    } catch (e) {
      setError(e?.message || 'Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const addOne = async (c) => {
    if (!c.located || addedIds.has(c.id)) return;
    await base44.entities.Location.create({
      title: c.name,
      type: c.type && TYPE_LABEL[c.type] ? c.type : 'other',
      address: c.address,
      lat: c.lat,
      lng: c.lng,
      notes: c.notes || '',
      status: 'pending',
      source_link: '',
    });
    setAddedIds((prev) => new Set(prev).add(c.id));
  };

  const addAll = async () => {
    const targets = candidates.filter((c) => c.located && !addedIds.has(c.id));
    if (!targets.length) return;
    setAddingAll(true);
    for (const c of targets) await addOne(c);
    setAddingAll(false);
  };

  const addable = candidates.filter((c) => c.located && !addedIds.has(c.id)).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-slate2/70 bg-void shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ozone" />
            <span className="font-display text-sm font-black uppercase tracking-[0.3em] text-silver">
              AI Unit Finder
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-dim transition-colors hover:text-ozone"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate2/60 px-5 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            // enter a city or area to scan for OOH units
          </p>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && find()}
              placeholder="e.g. Lagos, Nigeria"
              className="flex-1 border border-slate2 bg-void px-3 py-2 font-mono text-xs text-silver outline-none placeholder:text-dim focus:border-ozone"
            />
            <button
              onClick={find}
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 border border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare hover:border-flare disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Scan
            </button>
          </div>
          {error && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-flare">
              {error}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
                // scanning field…
              </span>
            </div>
          ) : candidates.length ? (
            <div className="px-5 py-3">
              {addable > 0 && (
                <button
                  onClick={addAll}
                  disabled={addingAll}
                  className="mb-3 flex w-full items-center justify-center gap-1.5 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver transition-colors hover:border-ozone hover:text-ozone disabled:opacity-40"
                >
                  {addingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add all ({addable})
                </button>
              )}
              {candidates.map((c) => {
                const added = addedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`mb-2 border border-slate2/70 bg-card px-3 py-2.5 ${!c.located ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold text-silver">{c.name}</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">
                            {TYPE_LABEL[c.type] || c.type || 'Other'}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                            {c.located ? `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}` : 'no coords'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addOne(c)}
                        disabled={!c.located || added}
                        className={`flex shrink-0 items-center gap-1 border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${
                          added
                            ? 'border-[#39FF14] text-[#39FF14]'
                            : 'border-slate2 text-silver hover:border-ozone hover:text-ozone disabled:opacity-30'
                        }`}
                      >
                        {added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {added ? 'Added' : 'Add'}
                      </button>
                    </div>
                    <div className="mt-1 flex items-start gap-1 font-mono text-[10px] text-darkgray">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-flare" />
                      <span>
                        {c.address}
                        {c.notes ? ` · ${c.notes}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
              // no scan yet — enter an area and hit Scan
            </div>
          )}
        </div>

        <div className="border-t border-slate2/60 px-5 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            Added units log as PENDING · realtime map sync
          </p>
        </div>
      </div>
    </div>
  );
}
