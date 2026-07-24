import { useEffect, useState } from "react";
import { ArrowDown, Radio } from "lucide-react";

const HERO_IMG = "https://ooh.earth/wp-content/uploads/2026/05/1777896004-01-d21q.webp";
const WORD = "OOH.EARTH";

export default function Hero({ onCommand }) {
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onScroll = () => setOffset(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallax = reduced ? 0 : offset * 0.5;

  return (
    <section id="top" className="relative h-[100svh] w-full overflow-hidden bg-void">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${parallax}px) scale(1.15)` }}
      >
        <img
          src={HERO_IMG}
          alt="A documented billboard on Ploenchit Road, Bangkok — logged in the OOH Earth field record"
          className="h-full w-full object-cover opacity-55"
          data-cursor="view"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/20 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/70 via-transparent to-void/70" />
      </div>

      {/* Corner registration marks */}
      <div className="pointer-events-none absolute inset-5 z-10 md:inset-8">
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((c, i) => (
          <span key={i} className={`absolute h-5 w-5 border-ozone/50 ${c}`} />
        ))}
      </div>

      <div className="relative z-20 flex h-full flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
          <span>LAT 13.7563°N · LON 100.5018°E · BKK · PM2.5 62µg/m³</span>
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-flicker text-ozone" />
            LIVE FEED
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">Out Of Hell™ · Disruption Agency</span>
          <h1 className="flex w-full items-center justify-between font-brand text-[13vw] uppercase leading-[0.85] tracking-[-0.03em] text-silver md:text-[11vw]">
            {WORD.split("").map((ch, i) => (
              <span key={i} className="inline-block">{ch === "." ? <span className="text-ozone">.</span> : ch}</span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl text-center font-display text-sm font-medium leading-[1.4] text-silver/60 md:text-base">
            A non-state disruption agency reclaiming the visual commons. Mapping corporate advertising offenses and coordinating creative resistance — aligned to the UN Sustainable Development Goals, from the orbital perspective.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div className="max-w-xs font-mono text-[11px] leading-[1.4] text-silver/50">
            Union-made by advertising-industry veterans &amp; street artists. A non-state disruption agency accountable to the public record — community-funded, SDG-aligned.
          </div>
          <a href="#atlas" className="flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/60 transition-colors hover:text-ozone">
            <span>Descend</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
          <button
            onClick={onCommand}
            data-cursor="view"
            className="hidden border border-flare/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-flare transition-colors hover:bg-flare hover:text-void sm:block"
          >
            Open Command
          </button>
        </div>
      </div>

      {/* High-vis baseline strip */}
      <div className="absolute inset-x-0 bottom-0 h-1 hi-vis-stripes opacity-80" />
    </section>
  );
}