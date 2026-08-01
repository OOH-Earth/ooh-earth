import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, Radio, ArrowUpRight } from "lucide-react";
import HeroConsole from "@/components/ooh/HeroConsole";
import BrandMark from "@/components/ooh/BrandMark";
import BetaTag from "@/components/ooh/BetaTag";
import LicenseMark from "@/components/ooh/LicenseMark";

const WORD = "oohearth.app";

const VIDEO_SRC = "https://firebasestorage.googleapis.com/v0/b/standards-site-beta.appspot.com/o/documents%2Fusaglsjaht9%2Fa61ac5238ce%2FSubs6.mp4?alt=media&token=fe1621f1-39b5-4f76-b11e-0700ecedcfba";

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
    <section id="top" className="hero-section relative min-h-[100svh] w-full overflow-hidden bg-void">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${parallax}px) scale(1.15)` }}>

        <video src={VIDEO_SRC} autoPlay muted loop playsInline className="hero-media absolute inset-0 h-full w-full object-cover" data-cursor="view" />
        <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        <div className="hero-overlay absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
      </div>

      {/* Corner registration marks */}
      <div className="pointer-events-none absolute inset-5 z-10 md:inset-8">
        {[
        "left-0 top-0 border-l border-t",
        "right-0 top-0 border-r border-t",
        "left-0 bottom-0 border-l border-b",
        "right-0 bottom-0 border-r border-b"].
        map((c, i) =>
        <span key={i} className={`absolute h-5 w-5 border-ozone/50 ${c}`} />
        )}
      </div>

      <div className="relative z-20 flex h-full flex-col justify-between px-6 pb-6 pt-[calc(7rem_+_env(safe-area-inset-top))] md:px-10 md:pb-10 md:pt-[calc(8rem_+_env(safe-area-inset-top))]">
        <div className="flex items-center justify-end gap-3">
          <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
            <Radio className="h-3 w-3 animate-flicker text-ozone" />
            <span className="glitch" data-text="LIVE FEED">LIVE FEED</span>
          </span>
        </div>

        <div className="grid flex-1 grid-cols-1 items-center gap-8 md:grid-cols-12">
          {/* Left · wordmark + tagline */}
          <div className="md:col-span-6">
            <div className="mb-5 flex items-center gap-3 md:mb-6">
              <span style={{ filter: "drop-shadow(0 0 16px rgba(237,255,0,0.28))" }}>
                <BrandMark className="h-14 w-14 md:h-20 md:w-20" />
              </span>
              <BetaTag />
            </div>
            <h1 className="whitespace-nowrap font-brand text-[clamp(1.5rem,7vw,4.5vw)] leading-[0.85] tracking-[-0.03em] text-silver">
              {WORD.split("").map((ch, i) =>
              <span key={i} className="inline-block">{ch === "." ? <span className="text-ozone">.</span> : ch}</span>
              )}
            </h1>
            <p className="mt-6 max-w-[42ch] font-display text-[15px] font-medium leading-[1.6] text-silver/70 md:text-base">
              An open-source, community-funded app reclaiming the visual commons. Mapping corporate advertising offenses and street-art adbusting worldwide — SDG-aligned, from the orbital perspective.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/map" className="group inline-flex items-center gap-2 bg-ozone px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare">
                Explore the map <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/report" className="inline-flex items-center gap-2 border border-slate2/70 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone/60 hover:text-ozone">
                Report
              </Link>
            </div>
          </div>

          {/* Right · live console */}
          <HeroConsole onCommand={onCommand} />
        </div>

        <div className="mt-4 md:hidden">
          <div className="border border-ozone/20 bg-void/60 px-3.5 py-2.5 backdrop-blur-sm">
            <div className="font-mono text-[9px] uppercase leading-[1.5] tracking-[0.25em] text-silver/70"><span className="text-ozone/70">// </span>Field dispatch · subvertising reel</div>
            <div className="my-1.5 h-px w-full bg-ozone/15" />
            <LicenseMark />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <a href="#atlas" className="flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50 transition-colors hover:text-ozone">
            <span>Descend</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-6 z-20 hidden md:left-10 md:block">
        <div className="inline-block border border-ozone/20 bg-void/70 px-3.5 py-2.5 backdrop-blur-sm">
          <div className="font-mono text-[9px] uppercase leading-[1.5] tracking-[0.25em] text-silver/70"><span className="text-ozone/70">// </span>Field dispatch · subvertising reel</div>
          <div className="my-1.5 h-px w-full bg-ozone/15" />
          <LicenseMark />
        </div>
      </div>

      {/* High-vis baseline strip */}
      <div className="absolute inset-x-0 bottom-0 h-1 hi-vis-stripes opacity-80" />
    </section>);

}