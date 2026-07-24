import { useState } from "react";
import { Tv } from "lucide-react";
import Nav from "@/components/ooh/Nav";
import TvPlayer from "@/components/ooh/tv/TvPlayer";
import TvGuide from "@/components/ooh/tv/TvGuide";
import { PROGRAMS } from "@/components/ooh/tv/programs";

export default function Channel() {
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % PROGRAMS.length);
  const current = PROGRAMS[index];

  return (
    <div className="min-h-screen bg-void">
      <Nav />
      <main className="px-3 pb-20 pt-24 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Tv className="h-5 w-5 text-ozone" />
          <h1 className="font-display text-xl font-bold tracking-[-0.02em] text-silver">
            OOH<span className="text-ozone">·</span>TV
          </h1>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">
            // resistance broadcast · subvertising / adbusting / brandalism
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div>
            <TvPlayer index={index} onEnded={next} />
            <div className="mt-3 flex items-start justify-between gap-4 border border-slate2 bg-void p-4">
              <div className="min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
                  // Now Playing · {String(index + 1).padStart(2, "0")}/{String(PROGRAMS.length).padStart(2, "0")}
                </span>
                <h2 className="mt-1 truncate font-display text-lg font-bold tracking-[-0.02em] text-silver">
                  {current.title}
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">
                  {current.channel} · {current.topic}
                </p>
              </div>
              <button
                onClick={next}
                className="shrink-0 border-2 border-ozone bg-ozone px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
              >
                Next ▶
              </button>
            </div>
          </div>

          <TvGuide index={index} onSelect={setIndex} />
        </div>

        <p className="mt-8 max-w-2xl font-mono text-[10px] uppercase tracking-[0.2em] text-dim/50">
          // auto-advances when each program ends · curated open-access field footage on
          subvertising, adbusting, brandalism, billboard liberation &amp; culture jamming.
          videos hosted on youtube.
        </p>
      </main>
    </div>
  );
}