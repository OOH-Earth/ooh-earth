import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { Layers, Building2, MapPin, Globe2, Loader2 } from 'lucide-react';
import { metaFor } from '@/components/ooh/map/LocationThumb';

// Haversine distance in km
function distKm(a, b) {
  if (!a?.lat || !b?.lat) return 999;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function RelatedCard({ loc, badge, distKm: dist = null }) {
  const meta = metaFor(loc.type);
  const Icon = meta.Icon;
  return (
    <Link
      to={`/location/${loc.id}`}
      className="group flex items-start gap-3 border border-slate2/50 bg-card p-3 transition-colors hover:border-ozone/50 hover:bg-slate2/20"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-slate2/60">
        {loc.image_url ? (
          <Image src={loc.image_url} alt={loc.title} className="h-full w-full" fittingType="fill" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-void grid-bg">
            <Icon className="h-4 w-4" style={{ color: meta.accent }} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {badge === 'nearby' && <MapPin className="h-2.5 w-2.5 text-ozone" />}
          {badge === 'brand' && <Building2 className="h-2.5 w-2.5 text-flare" />}
          {badge === 'parent' && <Globe2 className="h-2.5 w-2.5 text-brand-blue" />}
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim">
            {badge === 'nearby' && dist != null
              ? `${dist.toFixed(1)}km`
              : badge === 'parent'
                ? 'same parent corp'
                : 'same brand'}
          </span>
        </div>
        <div className="mt-0.5 truncate font-display text-[13px] font-semibold text-silver transition-colors group-hover:text-ozone">
          {loc.title}
        </div>
        {loc.address && (
          <div className="truncate font-mono text-[9px] text-darkgray">{loc.address}</div>
        )}
      </div>
    </Link>
  );
}

export default function RelatedLocations({ location }) {
  const [nearby, setNearby] = useState([]);
  const [sameBrand, setSameBrand] = useState([]);
  const [sameParentCorp, setSameParentCorp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location?.id || !location?.lat) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch a broad set and compute proximity client-side (avoids geo query limits)
        const all = await base44.entities.Location.filter(
          { status: 'verified' },
          '-created_date',
          200,
        );
        if (!active) return;
        const others = (all || []).filter((r) => r.id !== location.id && r.lat != null);
        // Nearby: within 2km, sorted by distance
        const near = others
          .map((r) => ({ ...r, _d: distKm(location, r) }))
          .filter((r) => r._d <= 2)
          .sort((a, b) => a._d - b._d)
          .slice(0, 4);
        setNearby(near);
        // Same brand
        if (location.brand_name) {
          const brand = others
            .filter(
              (r) =>
                r.brand_name && r.brand_name.toLowerCase() === location.brand_name.toLowerCase(),
            )
            .slice(0, 4);
          setSameBrand(brand);
        } else {
          setSameBrand([]);
        }
        // Same parent corporation -- the holding company behind a brand often
        // owns other, differently-branded surfaces too. Excluding same-brand
        // matches keeps this group meaningfully distinct: it's specifically
        // "other brands under this corporate umbrella," not a brand restated.
        if (location.parent_corp) {
          const parent = others
            .filter(
              (r) =>
                r.parent_corp &&
                r.parent_corp.toLowerCase() === location.parent_corp.toLowerCase() &&
                (!location.brand_name ||
                  !r.brand_name ||
                  r.brand_name.toLowerCase() !== location.brand_name.toLowerCase()),
            )
            .slice(0, 4);
          setSameParentCorp(parent);
        } else {
          setSameParentCorp([]);
        }
      } catch {
        if (active) {
          setNearby([]);
          setSameBrand([]);
          setSameParentCorp([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [location?.id, location?.lat, location?.lng, location?.brand_name, location?.parent_corp]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 border border-slate2/40 px-4 py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-dim" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
          // Finding related locations…
        </span>
      </div>
    );
  }

  if (!nearby.length && !sameBrand.length && !sameParentCorp.length) return null;

  return (
    <div className="mt-8 border border-slate2/40">
      <div className="flex items-center gap-2 border-b border-slate2/40 px-4 py-3">
        <Layers className="h-4 w-4 text-ozone" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone">
          Connected Locations
        </span>
        <span className="h-px flex-1 bg-slate2/30" />
      </div>
      <div className="space-y-4 px-4 py-4">
        {nearby.length > 0 && (
          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/60">
              // Nearby (within 2km)
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {nearby.map((loc) => (
                <RelatedCard key={loc.id} loc={loc} badge="nearby" distKm={loc._d} />
              ))}
            </div>
          </div>
        )}
        {sameBrand.length > 0 && (
          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.3em] text-flare/60">
              // Same advertiser
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {sameBrand.map((loc) => (
                <RelatedCard key={loc.id} loc={loc} badge="brand" />
              ))}
            </div>
          </div>
        )}
        {sameParentCorp.length > 0 && (
          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.3em] text-brand-blue/70">
              // Same parent corporation ({location.parent_corp})
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {sameParentCorp.map((loc) => (
                <RelatedCard key={loc.id} loc={loc} badge="parent" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
