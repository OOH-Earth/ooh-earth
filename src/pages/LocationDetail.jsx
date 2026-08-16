import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  MapPin,
  Key,
  BusFront,
  ExternalLink,
  BadgeCheck,
  AlertTriangle,
  Navigation,
  SprayCan,
} from 'lucide-react';
import { metaFor } from '@/components/ooh/map/LocationThumb';
import { keyInfo, isKeyedType, ACCESS_KEYS } from '@/components/ooh/accessKeys';
import seed from '@/components/ooh/mapSeed';
import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import MobileHeader from '@/components/ooh/MobileHeader';
import MintLocationPanel from '@/components/ooh/mint/MintLocationPanel';
import PhotoGallery from '@/components/ooh/gallery/PhotoGallery';
import TimeSinceTag from '@/components/ooh/TimeSinceTag';
import LocationEditPanel from '@/components/ooh/LocationEditPanel';
import SubvertisingPanel from '@/components/ooh/SubvertisingPanel';
import AdvertiserInfo from '@/components/ooh/AdvertiserInfo';
import FieldCheckPanel from '@/components/ooh/FieldCheckPanel';
import RelatedLocations from '@/components/ooh/RelatedLocations';
import { useSeo } from '@/lib/seoContext';
import { getStatusBadgeClasses } from '@/lib/statusBadge';

function normalizeSeed(rec) {
  return {
    id: rec.id,
    title: rec.title,
    type: rec.type,
    address: rec.address,
    lat: rec.lat,
    lng: rec.lng,
    image_url: rec.image,
    source_link: rec.link,
    access_key: 'none',
    status: 'verified',
    notes: '',
  };
}

export default function LocationDetail() {
  const { id } = useParams();
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let rec = null;
      try {
        rec = await base44.entities.Location.get(id);
      } catch {}
      if (!rec) {
        try {
          const matches = await base44.entities.Location.filter(
            { source_link: `https://ooh.earth/location/${id}/` },
            '-created_date',
            5,
          );
          if (matches && matches.length) {
            rec = matches.find((m) => m.status !== 'rejected') || matches[0];
          }
        } catch {}
      }
      if (!rec) {
        const s = seed.find((x) => String(x.id) === String(id));
        if (s) rec = normalizeSeed(s);
      }
      if (alive) {
        setLoc(rec);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useSeo(
    loc
      ? {
          title: `${loc.title} — OOH Earth Atlas`,
          desc:
            loc.notes || loc.address || `${metaFor(loc.type).label} logged on the public record.`,
          image: loc.image_url,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: loc.title,
            description: loc.notes || loc.address || '',
            image: loc.image_url ? [loc.image_url] : undefined,
            geo: { '@type': 'GeoCoordinates', latitude: loc.lat, longitude: loc.lng },
            address: loc.address
              ? { '@type': 'PostalAddress', streetAddress: loc.address }
              : undefined,
          },
        }
      : null,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate2 border-t-ozone" />
        </div>
      </div>
    );
  }

  if (!loc) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
            // signal lost
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold">Location not found</h1>
          <Link
            to="/map"
            className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to atlas
          </Link>
        </div>
      </div>
    );
  }

  const meta = metaFor(loc.type);
  const Icon = meta.Icon;
  const keyed = isKeyedType(loc.type);
  const k = keyInfo(loc.access_key || (keyed ? 'unknown' : 'none'));
  const hasAdData = !!(
    loc.brand_name ||
    loc.ad_agency ||
    loc.parent_corp ||
    loc.campaign_name ||
    loc.ooh_operator ||
    loc.industry_sector ||
    (loc.adbust_type && loc.adbust_type !== 'none')
  );
  const showSubvertising =
    ['billboard', 'digital', 'projection', 'transit'].includes(loc.type) || hasAdData;
  const isPending = loc.status === 'pending';
  const isUnclassified = isPending && !loc.brand_name && !loc.industry_sector;

  // Content classification — derived from graffiti_medium / adbust_type / type
  const category = loc.graffiti_medium
    ? { label: 'Graffiti', accent: '#FF5C00' }
    : loc.adbust_type && loc.adbust_type !== 'none'
      ? { label: 'Adbust', accent: '#FF5C00' }
      : loc.type === 'transit'
        ? { label: 'Transit', accent: '#EDFF00' }
        : { label: 'Field Report', accent: meta.accent };
  const mapSrc =
    loc.lat != null && loc.lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.004}%2C${loc.lat - 0.004}%2C${loc.lng + 0.004}%2C${loc.lat + 0.004}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`
      : null;
  const directionsUrl =
    loc.lat != null && loc.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
      : null;

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <MobileHeader to="/map" label="Atlas" />
      <div className="mx-auto max-w-5xl px-5 pt-4">
        <Breadcrumbs items={[{ label: 'Atlas', to: '/map' }, { label: 'Location' }]} />
      </div>
      <main className="page-top mx-auto max-w-5xl px-5 pb-24">
        <Link
          to="/map"
          className="mb-4 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone lg:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Atlas
        </Link>

        {/* ── Unclassified banner ── */}
        {isUnclassified && (
          <div className="mb-6 flex items-center gap-2 border border-flare/40 bg-flare/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-flare" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-flare">
              Unclassified field report — awaiting moderator classification
            </span>
          </div>
        )}

        {/* ── Header zone ── */}
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em]"
              style={{ color: meta.accent }}
            >
              <Icon className="h-3.5 w-3.5" /> {meta.label}
            </span>
            <span
              className="flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ color: category.accent, borderColor: category.accent }}
            >
              {category.label}
            </span>
            <span
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] ${getStatusBadgeClasses(loc.status || 'pending')}`}
            >
              {loc.status === 'verified' ? <BadgeCheck className="h-3.5 w-3.5 text-ozone" /> : null}
              {loc.status || 'pending'}
            </span>
            {!isPending && <TimeSinceTag since={loc.status_updated_at} />}
            {loc.industry_sector && (
              <span className="border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-darkgray">
                {loc.industry_sector.replace(/_/g, ' ')}
              </span>
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">
              id · {loc.id}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-4xl">
            {loc.title}
          </h1>

          {(loc.address || directionsUrl) && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {loc.address && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-darkgray">
                  <MapPin className="h-3.5 w-3.5 text-ozone" /> {loc.address}
                </div>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 border border-ozone/40 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
                >
                  <Navigation className="h-3 w-3" /> Directions
                </a>
              )}
            </div>
          )}
        </header>

        {/* ── Half-split: media left, details right ── */}
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Left: photo + field map */}
          <div className="flex flex-col gap-4">
            <PhotoGallery loc={loc} icon={Icon} accent={meta.accent} />
            {mapSrc && (
              <iframe
                title="Field map"
                src={mapSrc}
                className="aspect-[4/3] w-full border border-slate2 grayscale-[0.3]"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Right: advertiser info + graffiti details + access key + field notes */}
          <div className="flex flex-col gap-4">
            {/* Advertiser intelligence — moved up from SubvertisingPanel */}
            {showSubvertising && <AdvertiserInfo loc={loc} />}

            {/* Graffiti / street art classification — inline so the column is
                always populated for graffiti-classified locations */}
            {loc.graffiti_medium && (
              <div className="border border-flare/40 bg-flare/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <SprayCan className="h-3.5 w-3.5 text-flare" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare">
                    Graffiti / Street Art
                  </span>
                  <span className="h-px flex-1 bg-flare/20" />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                      Medium
                    </span>
                    <p className="text-[12px] capitalize text-silver">
                      {loc.graffiti_medium.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {loc.graffiti_style && (
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                        Style
                      </span>
                      <p className="text-[12px] capitalize text-silver">
                        {loc.graffiti_style.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {loc.graffiti_surface_m2 != null && (
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                        Surface
                      </span>
                      <p className="text-[12px] tabular text-silver">
                        {loc.graffiti_surface_m2} m²
                      </p>
                    </div>
                  )}
                  {loc.graffiti_coverage_pct != null && (
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                        Coverage
                      </span>
                      <p className="text-[12px] tabular text-silver">
                        {loc.graffiti_coverage_pct}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition — shown when no graffiti block fills the column context */}
            {!loc.graffiti_medium && loc.condition && (
              <div className="border border-slate2/60 p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
                  // condition
                </span>
                <p className="mt-1 text-[13px] capitalize text-silver">{loc.condition}</p>
              </div>
            )}

            {keyed && (
              <div className="border border-ozone/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                    <Key className="h-3.5 w-3.5" />
                    Open-access key
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                    <BusFront className="h-3 w-3" />
                    bus-stop spec
                  </span>
                </div>
                <div className="mt-2 font-display text-lg font-semibold text-silver">{k.label}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-darkgray">{k.blurb}</p>
                <p className="mt-3 border-t border-slate2/40 pt-2 font-mono text-[10px] leading-relaxed text-ozone/80">
                  // keyed housing — standard open-access tooling. Log the confirmed key type after
                  a field check.
                </p>
              </div>
            )}

            {loc.notes && (
              <div className="border border-slate2/60 p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
                  // field notes
                </span>
                <p className="mt-1 text-[12px] leading-relaxed text-silver/85">{loc.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Intelligence: subvertising images + notes (only for subverted locations) ── */}
        {((loc.adbust_type && loc.adbust_type !== 'none') || loc.adbust_image_url) && (
          <section className="mb-8">
            <SubvertisingPanel loc={loc} />
          </section>
        )}

        {/* ── Record metadata — improved widget, kept lower ── */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
              // record
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/40">
              id · {loc.id}
            </span>
            <span className="h-px flex-1 bg-slate2/40" />
          </div>
          <div className="grid grid-cols-2 gap-px border border-slate2/60 sm:grid-cols-3 lg:grid-cols-4">
            {loc.lat != null && (
              <div className="bg-card/50 px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                  coords
                </span>
                <p className="mt-0.5 font-mono text-[11px] tabular text-silver">
                  {loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}
                </p>
              </div>
            )}
            <div className="bg-card/50 px-4 py-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                type
              </span>
              <p className="mt-0.5 text-[11px] text-silver">{meta.label}</p>
            </div>
            {keyed && (
              <div className="bg-card/50 px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                  key slug
                </span>
                <p className="mt-0.5 font-mono text-[11px] text-silver">
                  {loc.access_key || 'none'}
                </p>
              </div>
            )}
            {loc.condition && (
              <div className="bg-card/50 px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                  condition
                </span>
                <p className="mt-0.5 text-[11px] capitalize text-silver">{loc.condition}</p>
              </div>
            )}
            {loc.source_link && /^https?:\/\//i.test(loc.source_link) && (
              <div className="bg-card/50 px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                  source
                </span>
                <a
                  href={loc.source_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-ozone transition-colors hover:text-flare"
                >
                  oohearth.app <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Field activity ── */}
        <section className="mb-8">
          <FieldCheckPanel location={loc} />
        </section>

        {/* ── Network ── */}
        <section className="mb-8">
          <RelatedLocations location={loc} />
        </section>

        {/* ── Admin zone ── */}
        <section className="mb-8 space-y-px">
          <LocationEditPanel loc={loc} onUpdated={setLoc} />
          <MintLocationPanel loc={loc} />
        </section>

        {/* ── Key reference registry (keyed types only) ── */}
        {keyed && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-ozone" />
              <Link
                to="/access-keys"
                className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone transition-colors hover:text-flare"
              >
                // open-access key registry ↗
              </Link>
              <span className="h-px flex-1 bg-slate2/40" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(ACCESS_KEYS)
                .filter(([slug]) => slug !== 'none' && slug !== 'unknown')
                .map(([slug, info]) => (
                  <div
                    key={slug}
                    className={`border p-3 ${slug === loc.access_key ? 'border-ozone bg-ozone/5' : 'border-slate2/60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[13px] font-semibold text-silver">
                        {info.label}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">
                        {slug}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-darkgray">{info.blurb}</p>
                  </div>
                ))}
            </div>
            <div className="mt-3">
              <a
                href="https://www.publicadcampaign.com/PublicAccess/participate.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim transition-colors hover:text-ozone"
              >
                <ExternalLink className="h-3 w-3" /> Public Access Campaign — key participation
                guide
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
