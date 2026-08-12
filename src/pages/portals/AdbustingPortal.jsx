import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Megaphone, Camera } from 'lucide-react';
import PortalShell from '@/components/ooh/map/PortalShell';
import LocationCard from '@/components/ooh/map/LocationCard';
import ClaimLeadDialog from '@/components/ooh/map/ClaimLeadDialog';
import QuickCapture from '@/components/ooh/QuickCapture';
import seedMarkers from '@/components/ooh/mapSeed';
import { toMarker } from '@/components/ooh/map/markerUtils';

const ADS_TYPES = [
  { value: 'billboard', label: 'Billboard' },
  { value: 'digital', label: 'Digital' },
  { value: 'painted', label: 'Painted' },
  { value: 'transit', label: 'Transit' },
  { value: 'projection', label: 'Projection' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'mural', label: 'Mural' },
  { value: 'other', label: 'Other' },
];

export default function AdbustingPortal() {
  const [raw, setRaw] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [claims, setClaims] = useState([]);
  const [claimTarget, setClaimTarget] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const recs = await base44.listAllLocations();
      const markers = (recs || []).filter((r) => r.status !== 'rejected').map(toMarker);
      setRaw(markers.length ? { markers, live: true } : { markers: seedMarkers, live: false });
    } catch {
      setRaw({ markers: seedMarkers, live: false });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const recs = await base44.entities.LeadClaim.list('-created_date', 500);
        if (!cancelled) setClaims(recs || []);
      } catch {
        if (!cancelled) setClaims([]);
      }
    };
    load();
    const unsub = base44.entities.LeadClaim.subscribe(() => load());
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const claimsByLoc = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      if (c.status === 'released') return;
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
        (m) =>
          (typeFilter === 'all' || m.type === typeFilter) &&
          (!q || `${m.title} ${m.address}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aPhoto = a.status === 'verified' && !!a.image ? 2 : a.image ? 1 : 0;
        const bPhoto = b.status === 'verified' && !!b.image ? 2 : b.image ? 1 : 0;
        return bPhoto - aPhoto;
      });
  }, [raw, typeFilter, query]);

  const counts = useMemo(() => {
    const c = {};
    (raw?.markers || []).forEach((m) => {
      c[m.type] = (c[m.type] || 0) + 1;
    });
    return c;
  }, [raw]);

  const filterTags = [
    { value: 'all', label: 'All', count: (raw?.markers || []).length },
    ...ADS_TYPES.filter((t) => (counts[t.value] || 0) > 0).map((t) => ({
      ...t,
      count: counts[t.value],
    })),
  ];

  const mapActions = (
    <div className="absolute right-3 top-3 z-[1000] flex gap-1.5">
      <button
        onClick={() => setCaptureOpen(true)}
        className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
      >
        <Camera className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Capture</span>
      </button>
      <Link
        to="/report"
        className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
      >
        <Megaphone className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Report</span>
      </Link>
    </div>
  );

  return (
    <>
      <PortalShell
        title="Adbusting"
        accent="#EDFF00"
        activeLayers={['ads']}
        markers={filtered}
        results={filtered}
        loading={!raw}
        query={query}
        setQuery={setQuery}
        filterTags={filterTags}
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        onRefresh={reload}
        mapActions={mapActions}
        renderCard={(m, _i, { selectedId, setSelectedId, hoverId, setHoverId }) => (
          <LocationCard
            key={m.id}
            m={m}
            selected={selectedId === m.id}
            onSelect={(x) => setSelectedId(x.id)}
            onHover={(x) => setHoverId(x.id)}
            onHoverEnd={() => setHoverId(null)}
            claim={claimsByLoc[m.id]}
            onClaim={setClaimTarget}
          />
        )}
      />
      <ClaimLeadDialog
        open={!!claimTarget}
        onClose={() => setClaimTarget(null)}
        location={claimTarget}
      />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </>
  );
}
