import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BusFront, Key, MapPin, HelpCircle, ExternalLink } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import Breadcrumbs from "@/components/ooh/Breadcrumbs";
import MobileHeader from "@/components/ooh/MobileHeader";
import { getBusStop, LONDON_SHELTER_GUESS, BUS_STOP_LEGEND } from "@/components/ooh/busStops";
import { ACCESS_KEYS } from "@/components/ooh/accessKeys";
import KeyGlyph from "@/components/ooh/KeyGlyph";

export default function BusStopDetail() {
  const { id } = useParams();
  const stop = getBusStop(id);

  if (!stop) {
    return (
      <div className="min-h-screen bg-void text-silver">
        <Nav />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">// signal lost</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Bus stop not found</h1>
          <Link to="/bus-stops" className="mt-6 inline-flex items-center gap-2 border border-slate2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver hover:border-ozone hover:text-ozone">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
          </Link>
        </div>
      </div>
    );
  }

  const facingColor = stop.facing === "road" ? "#FF5252" : "#880E4F";
  const guessKeys = LONDON_SHELTER_GUESS.slugs.map((s) => ACCESS_KEYS[s]).filter(Boolean);
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${stop.lng - 0.003}%2C${stop.lat - 0.003}%2C${stop.lng + 0.003}%2C${stop.lat + 0.003}&layer=mapnik&marker=${stop.lat}%2C${stop.lng}`;

  return (
    <div className="min-h-screen bg-void text-silver">
      <Nav />
      <MobileHeader to="/bus-stops" label="Bus-stop directory" />
      <main className="page-top mx-auto max-w-5xl px-5 pb-24">
        <Breadcrumbs items={[{ label: "Bus Stops", to: "/bus-stops" }, { label: "Detail" }]} className="mb-4" />
        <Link to="/bus-stops" className="mb-6 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone lg:inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" /> Bus-stop directory
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">
            <BusFront className="h-3.5 w-3.5" /> Bus shelter
          </span>
          <span className="flex items-center gap-1.5 border border-slate2 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: facingColor }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: facingColor }} />
            {stop.facing}-facing
          </span>
          <span className="flex items-center gap-1.5 border border-flare/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-flare">
            <HelpCircle className="h-3.5 w-3.5" /> key unconfirmed
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">id · {stop.id}</span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-silver md:text-4xl">{stop.name}</h1>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-darkgray">
          <MapPin className="h-3.5 w-3.5 text-ozone" /> London, United Kingdom
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Map */}
          <iframe
            title="Bus stop map"
            src={mapSrc}
            className="aspect-[4/3] w-full border border-slate2 grayscale-[0.3]"
            loading="lazy"
          />

          {/* Key panel */}
          <div className="flex flex-col gap-4">
            <div className="border border-flare/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-flare">
                  <Key className="h-3.5 w-3.5" /> Access key
                </span>
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
                  <BusFront className="h-3 w-3" /> bus-stop spec
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <KeyGlyph slug="unknown" className="h-8 w-8 text-flare" />
                <div>
                  <div className="font-display text-lg font-semibold text-flare">Unconfirmed</div>
                  <p className="text-[11px] leading-relaxed text-darkgray">No key logged for this shelter yet — field check required.</p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate2/40 pt-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone/80">// probable guess</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guessKeys.map((k) => (
                    <span key={k.label} className="flex items-center gap-1.5 border border-slate2 px-2 py-1">
                      <KeyGlyph slug={LONDON_SHELTER_GUESS.slugs.find((s) => ACCESS_KEYS[s] === k)} className="h-4 w-4 text-ozone" />
                      <span className="font-mono text-[10px] text-silver">{k.label}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-darkgray">{LONDON_SHELTER_GUESS.note}</p>
              </div>
            </div>

            {/* Unit meta */}
            <div className="flex flex-col gap-2 border border-slate2/60 p-4 font-mono text-[10px] text-darkgray">
              <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">unit type</span><span className="text-silver">Bus shelter / Transit</span></div>
              <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">facing</span><span className="text-silver capitalize">{stop.facing}</span></div>
              {stop.shape && <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">shape</span><span className="text-silver capitalize">{stop.shape}</span></div>}
              <div className="flex justify-between"><span className="uppercase tracking-[0.2em] text-dim/60">coords</span><span className="tabular text-silver">{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}</span></div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-ozone hover:text-flare"
              >
                Directions <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 border border-ozone bg-ozone px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
            >
              <Key className="h-3.5 w-3.5" /> Log a field check
            </Link>
          </div>
        </div>

        {/* Key registry */}
        <div className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-ozone" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// open-access key registry</span>
            <span className="h-px flex-1 bg-slate2/40" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ACCESS_KEYS).filter(([slug]) => slug !== "none" && slug !== "unknown").map(([slug, info]) => {
              const guessed = LONDON_SHELTER_GUESS.slugs.includes(slug);
              return (
                <div key={slug} className={`flex items-start gap-2.5 border p-3 ${guessed ? "border-ozone/60 bg-ozone/5" : "border-slate2/60"}`}>
                  <KeyGlyph slug={slug} className={`h-6 w-6 shrink-0 ${guessed ? "text-ozone" : "text-darkgray"}`} />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[13px] font-semibold text-silver">{info.label}</span>
                      {guessed && <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-ozone">guess</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-darkgray">{info.blurb}</p>
                    <span className="mt-1 inline-block font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">{slug}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-dim">// source map legend: {BUS_STOP_LEGEND.map((l) => `${l.label} = ${l.note}`).join(" · ")}</p>
        </div>
      </main>
    </div>
  );
}