import { MapPin, Share2, Link as LinkIcon, Wrench } from "lucide-react";
import KeyGlyph from "@/components/ooh/KeyGlyph";
import StatusTag from "./StatusTag";

/**
 * Location detail panel — "Run Duck Cover" showcase.
 * Header tag + post count + branding module, LAT/LNG + sitecode metadata,
 * View-on-Maps / Share pill buttons, format preview, H60 access key,
 * teal field-guide callout and install checklist.
 */
export default function SpotDetailPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* left · metadata + format preview */}
      <div className="border border-slate2/60 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-ozone px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void">Billboard</span>
            <span className="font-mono text-[9px] tabular text-dim">6 post count</span>
          </div>
          <span className="border border-slate2 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray">Build Hollywood</span>
        </div>

        <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-silver">Run Duck Cover</h3>

        <dl className="mt-3 space-y-1 font-mono text-[10px] text-darkgray">
          <div className="flex justify-between">
            <dt>LAT / LNG</dt>
            <dd className="tabular text-silver">51.48258000, -0.13536100</dd>
          </div>
          <div className="flex justify-between">
            <dt>SITECODE</dt>
            <dd className="tabular text-silver">1345</dd>
          </div>
        </dl>

        <a href="#" onClick={(e) => e.preventDefault()} className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">
          <LinkIcon className="h-3 w-3" /> Artwork Specification
        </a>

        <div className="mt-3 flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-ozone/70 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">
            <MapPin className="h-3 w-3" /> View on Maps
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-slate2 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">
            <Share2 className="h-3 w-3" /> Share
          </button>
        </div>

        {/* format preview */}
        <div className="mt-4 grid place-items-center border border-slate2 bg-void p-6">
          <span className="font-display text-lg font-black uppercase tracking-[0.2em] text-silver">48 Sheet Billboard</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">Artwork size: 1200 x 600mm</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusTag tag="corp" active />
          <StatusTag tag="banks" />
          <StatusTag tag="data" />
          <StatusTag tag="public-access" />
        </div>
      </div>

      {/* right · access key + field guide */}
      <div className="border border-slate2/60 bg-card p-4">
        <div className="flex items-center gap-2">
          <KeyGlyph slug="h60" className="h-5 w-5 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">Access key · H60</span>
        </div>
        <p className="mt-2 font-display text-[12px] leading-relaxed text-darkgray">
          6mm hex key with a 4mm hole drilled in the bottom — opens most billboard poster-housing cam locks.
        </p>

        {/* teal callout */}
        <div className="mt-4 border-l-2 border-[#008080] bg-[#008080]/10 p-3">
          <p className="font-display text-[12px] leading-relaxed text-[#5fe6e6]">
            <span className="font-bold">Graffiti writers —</span> how sick would your tag or throw-up look illuminated at night in one of these spaces… just sayin'.
          </p>
        </div>

        {/* install checklist */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
            <Wrench className="h-3 w-3" /> 48-sheet billboard ad · install checklist
          </div>
          <ul className="mt-2 space-y-1 font-display text-[12px] text-darkgray">
            {[
              "H60 key confirmed — lock opens before you start",
              "Ladder + bucket + paste brush",
              "Artwork printed 1200 × 600mm",
              "Weather window checked",
              "Spotter posted",
              "Document before / after",
            ].map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ozone">▢</span> {x}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-dim">
          // Some advertising spaces that need a key have shiny old locks. Don't lose your shit in a mad panic — move on to another and make sure it opens before you start your installation.
        </p>
      </div>
    </div>
  );
}