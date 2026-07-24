import { useState } from "react";
import { Tv, ArrowLeft } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import TvPlayer from "@/components/ooh/tv/TvPlayer";
import { PROGRAMS } from "@/components/ooh/tv/programs";

const ISSUE = "03";
const DATE = "SUMMER 2026";

function FeaturedCard({ program, onPlay }) {
  return (
    <article className="group cursor-pointer" onClick={onPlay}>
      <div className="relative overflow-hidden border border-slate2" style={{ aspectRatio: "16 / 9" }}>
        <img src={program.thumb} alt="" className="h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
        <div className="absolute left-0 top-0 m-3 border border-ozone bg-void/70 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.3em] text-ozone backdrop-blur">
          Featured
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">{program.topic}</span>
          <h2 className="mt-1 font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-4xl">
            {program.title}
          </h2>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] leading-relaxed text-darkgray">{program.deck}</p>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">{program.channel} · {program.runtime}</span>
      </div>
    </article>
  );
}

function ArchiveCard({ program, index, onPlay }) {
  return (
    <article className="group cursor-pointer" onClick={onPlay}>
      <div className="relative overflow-hidden border border-slate2/60 transition-colors group-hover:border-ozone/50" style={{ aspectRatio: "16 / 9" }}>
        <img src={program.thumb} alt="" className="h-full w-full object-cover opacity-65 transition-all duration-500 group-hover:opacity-90 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 font-mono text-[10px] tabular text-silver/80">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="absolute bottom-2 right-2 font-mono text-[8px] uppercase tracking-[0.2em] text-silver/70">{program.runtime}</span>
      </div>
      <div className="pt-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-ozone/80">{program.topic}</span>
        <h3 className="mt-0.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em] text-silver transition-colors group-hover:text-ozone">
          {program.title}
        </h3>
        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.15em] text-dim/60">{program.channel}</span>
      </div>
    </article>
  );
}

export default function Channel() {
  const [active, setActive] = useState(null); // program being played
  const featured = PROGRAMS[0];
  const rest = PROGRAMS.slice(1);

  const open = (p) => {
    setActive(p);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="page-top mx-auto max-w-6xl px-5 pb-24">
        {/* Masthead */}
        <div className="flex items-end justify-between border-b-2 border-silver pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-ozone" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">oohearth.app / channel</span>
            </div>
            <h1 className="mt-1 font-display text-5xl font-bold tracking-[-0.03em] text-silver md:text-7xl">
              OOH<span className="text-ozone">·</span>TV
            </h1>
          </div>
          <div className="hidden text-right font-mono text-[9px] uppercase tracking-[0.25em] text-dim sm:block">
            <div>Issue {ISSUE}</div>
            <div className="text-silver/70">{DATE}</div>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-darkgray">
          A resistance broadcast — curated open-access field footage on subvertising, adbusting, brandalism,
          billboard liberation &amp; culture jamming. Click any story to watch; nothing autoplays.
        </p>

        {/* Player (when a story is selected) */}
        {active && (
          <div className="mt-8">
            <button
              onClick={() => setActive(null)}
              className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim hover:text-ozone"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to issue
            </button>
            <TvPlayer program={active} onClose={() => setActive(null)} />
            <div className="mt-3 border border-slate2 bg-void p-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">{active.topic}</span>
              <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.02em] text-silver">{active.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-darkgray">{active.deck}</p>
              <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">{active.channel} · {active.runtime}</span>
            </div>
          </div>
        )}

        {/* Featured */}
        {!active && (
          <section className="mt-8">
            <FeaturedCard program={featured} onPlay={() => open(featured)} />
          </section>
        )}

        {/* Archive */}
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// the archive</span>
            <span className="h-px flex-1 bg-slate2/40" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">{rest.length} stories</span>
          </div>
          <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <ArchiveCard key={p.id} program={p} index={i + 1} onPlay={() => open(p)} />
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-slate2/40 pt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/40">
          // videos hosted on youtube · open-access footage · no autoplay · union made
        </footer>
      </main>
    </div>
  );
}