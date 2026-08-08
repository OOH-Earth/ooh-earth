import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin, Key, BusFront, ExternalLink, BadgeCheck, Lock, Megaphone } from "lucide-react";
import { metaFor } from "@/components/ooh/map/LocationThumb";
import { keyInfo, isKeyedType, ACCESS_KEYS } from "@/components/ooh/accessKeys";
import seed from "@/components/ooh/mapSeed";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import MobileHeader from "@/components/ooh/MobileHeader";
import { Image } from "@/components/ui/image";
import MintLocationPanel from "@/components/ooh/mint/MintLocationPanel";
import LocationEditPanel from "@/components/ooh/LocationEditPanel";
import { useSeo } from "@/lib/seoContext";

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
    access_key: "none",
    status: "verified",
    notes: "",
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
        // Legacy ooh.earth / WordPress ids (e.g. "1777896004") and slugs aren't Base44
        // record ids. The real record stores that id inside its source_link — resolve it
        // there so the real field photo shows instead of the seed placeholder.
        try {
          const matches = await base44.entities.Location.filter(
            { source_link: `https://ooh.earth/location/${id}/` },
            "-created_date",
            5
          );
          if (matches && matches.length) {
            rec = matches.find((m) => m.status !== "rejected") || matches[0];
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
    return () => { alive = false; };
  }, [id]);

  useSeo(loc ? {
    title: `${loc.title} — OOH Earth Atlas`,
    desc: loc.notes || loc.address || `${metaFor(loc.type).label} logged on the public record.`,
    image: loc.image_url,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Place",
      name: loc.title,
      description: loc.notes || loc.address || "",
      image: loc.image_url ? [loc.image_url] : undefined,
      geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng },
      address: loc.address ? { "@type": "PostalAddress", streetAddress: loc.address } : undefined
    }
  } : null);

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
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// signal lost</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Location not found</h1>
          <Link to="/map" className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to atlas
          </Link>
        </div>
      </div>
    );
  }

  const meta = metaFor(loc.type);
  const Icon = meta.Icon;
  const keyed = isKeyedType(loc.type);
  const k = keyInfo(loc.access_key || (keyed ? "unknown" : "none"));
  const mapSrc = loc.lat != null && loc.lng != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.004}%2C${loc.lat - 0.004}%2C${loc.lng + 0.004}%2C${loc.lat + 0.004}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`
    : null;

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <MobileHeader to="/map" label="Atlas" />
      <div className="mx-auto max-w-5xl px-5 pt-4"><Breadcrumbs items={[{ label: "Atlas", to: "/map" }, { label: "Location" }]} /></div>
      <main className="page-top mx-auto max-w-5xl px-5 pb-24">
        <Link to="/map" className="mb-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone lg:inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" /> Atlas
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: meta.accent }}>
            <Icon className="h-3.5 w-3.5" /> {meta.label}
          </span>
          <span className="flex items-center gap-1.5 border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-darkgray">
            {loc.status === "verified" ? <BadgeCheck className="h-3.5 w-3.5 text-ozone" /> : null}
            {loc.status || "pending"}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">id · {loc.id}</span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-4xl">{loc.title}</h1>

        {loc.address && (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-darkgray">
            <MapPin className="h-3.5 w-3.5 text-ozone" /> {loc.address}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Media */}
          <div className="flex flex-col gap-4">
            {loc.image_url ? (
              <div className="relative aspect-[4/3] overflow-hidden border border-slate2">
                <Image src={loc.image_url} alt={loc.title} className="h-full w-full object-cover" fittingType="fill" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-slate2 grid-bg">
                <Icon className="h-10 w-10" style={{ color: meta.accent }} strokeWidth={1.2} />
              </div>
            )}
            {mapSrc && (
              <iframe
                title="Field map"
                src={mapSrc}
                className="aspect-[4/3] w-full border border-slate2 grayscale-[0.3]"
                loading="lazy"
              />
            )}
          </div>

          {/* Access key panel */}
          <div className="flex flex-col gap-4">
            <div className={`border p-4 ${keyed ? "border-ozone/50" : "border-slate2"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                  {keyed ? <Key className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {keyed ? "Open-access key" : "Access method"}
                </span>
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                  {keyed ? <BusFront className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
                  {keyed ? "bus-stop spec" : "non-keyed unit"}
                </span>
              </div>
              <div className="mt-2 font-display text-lg font-semibold text-silver">{k.label}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-darkgray">{k.blurb}</p>
              {keyed ? (
                <p className="mt-3 border-t border-slate2/40 pt-2 font-mono text-[10px] leading-relaxed text-ozone/80">
                  // keyed housing — standard open-access tooling. Log the confirmed key type after a field check.
                </p>
              ) : (
                <p className="mt-3 border-t border-slate2/40 pt-2 font-mono text-[10px] leading-relaxed text-dim">
                  // billboard / non-shelter units use direct physical access — no standardized keyed housing.
                </p>
              )}
            </div>

            {/* Source + meta */}
            <div className="flex flex-col gap-2 border border-slate2/60 p-4 font-mono text-[10px] text-darkgray">
              {loc.lat != null && (
                <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">coords</span><span className="tabular text-silver">{loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}</span></div>
              )}
              <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">type</span><span className="text-silver">{meta.label}</span></div>
              <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">key slug</span><span className="text-silver">{loc.access_key || "none"}</span></div>
              {loc.source_link && /^https?:\/\//i.test(loc.source_link) && (
                <a href={loc.source_link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-ozone transition-colors hover:text-flare">
                  oohearth.app record <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {loc.notes && (
              <div className="border border-slate2/60 p-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// field notes</span>
                <p className="mt-1 text-[12px] leading-relaxed text-silver/85">{loc.notes}</p>
              </div>
            )}

            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Key className="h-3.5 w-3.5" /> Log a field check
            </Link>
          </div>
        </div>

        {/* Expert edit & tag panel */}
        <LocationEditPanel loc={loc} onUpdated={setLoc} />

        {/* On-chain mint */}
        <MintLocationPanel loc={loc} />

        {/* Full key reference */}
        <div className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-ozone" />
            <Link to="/access-keys" className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone transition-colors hover:text-flare">// open-access key registry ↗</Link>
            <span className="h-px flex-1 bg-slate2/40" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ACCESS_KEYS).filter(([slug]) => slug !== "none" && slug !== "unknown").map(([slug, info]) => (
              <div key={slug} className={`border p-3 ${slug === loc.access_key ? "border-ozone bg-ozone/5" : "border-slate2/60"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[13px] font-semibold text-silver">{info.label}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">{slug}</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-darkgray">{info.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}