import { Users, ArrowRight } from "lucide-react";

const ROLES = [
  { title: "Guild Convenor" },
  { title: "Guild Training Facilitator" },
  { title: "Guild Logistics" },
];

export default function GuildSpecimen() {
  return (
    <div className="guild relative min-h-[320px] overflow-hidden border border-border bg-background p-6 text-foreground">
      {/* Navy structural header strip */}
      <div className="-mx-6 -mt-6 mb-5 flex items-center justify-between bg-card px-5 py-3">
        <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-ozone">
          Meaning Transformation Guild
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-card-foreground/60">.guild</span>
      </div>

      {/* Manifesto — Spectral serif heading + magenta emphasis */}
      <div>
        <h3 className="font-display text-[1.7rem] leading-[1.1]">
          Detoxifying the <span className="guild-emph">propaganda</span> on our streets.
        </h3>
        <p className="mt-3 max-w-[34ch] font-body text-[12px] leading-[1.65] text-foreground/85">
          We are dedicated to the <span className="guild-emph">removal and detoxification of propaganda</span> in our communities — taking down malicious adverts, correcting their errors, and reinstalling them for public benefit.
        </p>
      </div>

      <hr className="my-5 border-0 border-t border-border" />

      {/* Role cards — yellow fill, navy text, magenta glyph, navy apply button */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.title} className="flex flex-col justify-between bg-ozone p-4">
            <Users className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <h4 className="mt-3 font-body text-[12px] font-bold leading-tight text-primary">{r.title}</h4>
            <button className="mt-4 inline-flex w-fit items-center gap-1.5 bg-primary px-3 py-1.5 font-body text-[9px] font-bold uppercase tracking-[0.12em] text-ozone transition-opacity hover:opacity-85">
              <span className="h-px w-2 bg-ozone" />
              Apply now
            </button>
          </div>
        ))}
      </div>

      {/* Actions — primary navy, secondary bordered */}
      <div className="mt-5 flex items-center gap-3">
        <button className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-ozone transition-opacity hover:opacity-85">
          Make a donation <ArrowRight className="h-3 w-3" />
        </button>
        <button className="border border-border px-5 py-2.5 font-body text-[10px] font-bold uppercase tracking-[0.15em] text-foreground transition-colors hover:border-accent hover:text-accent">
          View posters
        </button>
      </div>

      {/* Palette */}
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-3">
        {[["canvas", "bg-background border border-border"], ["navy", "bg-primary"], ["yellow", "bg-ozone"], ["magenta", "bg-accent"]].map(([n, c]) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 ${c}`} />
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}