import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, Radio, ArrowUpRight } from "lucide-react";
import HeroConsole from "@/components/ooh/HeroConsole";
import { useHeroSlides } from "@/hooks/useHeroSlides";

const WORD = "oohearth.app";

// Generated cinematic base layer — orbital descent over nocturnal metropolis
const VIDEO_SRC = "https://media.base44.com/videos/public/6a62213cff3ccbca88c04ff5/13f721b2e_Hero_Background.mp4";

export default function Hero({ onCommand }) {
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [slide, setSlide] = useState(0);
  const fieldSlides = useHeroSlides();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onScroll = () => setOffset(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduced || fieldSlides.length < 2) return;
    const id = setInterval(() => setSlide((p) => (p + 1) % fieldSlides.length), 6000);
    return () => clearInterval(id);
  }, [reduced, fieldSlides.length]);

  useEffect(() => {
    if (slide >= fieldSlides.length) setSlide(0);
  }, [fieldSlides.length, slide]);

  const parallax = reduced ? 0 : offset * 0.5;
  const currentCaption = fieldSlides[slide]?.caption || "Orbital feed · live";

  return (
    <section id="top" className="hero-section relative h-[100svh] w-full overflow-hidden bg-void">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${parallax}px) scale(1.15)` }}>

        {/* Base video layer — always playing */}
        <video src={VIDEO_SRC} autoPlay muted loop playsInline className="hero-media absolute inset-0 h-full w-full object-cover" data-cursor="view" />

        {/* Live field photo overlay — cross-fades from verified reports */}
        {fieldSlides.map((s, idx) =>
          <div key={idx} className={`hero-media absolute inset-0 transition-opacity duration-[1200ms] ${idx === slide ? "opacity-50" : "opacity-0"}`}>
            <img src={s.src} alt={s.caption} className="h-full w-full object-cover" data-cursor="view" />
          </div>
        )}
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

        <div className="flex justify-center pt-4">
          <a href="#atlas" className="flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50 transition-colors hover:text-ozone">
            <span>Descend</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>

      <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-silver/70 md:left-10">
        <span className="h-1.5 w-1.5 rounded-full bg-ozone animate-pulse" />
        // {currentCaption}
      </div>
      {fieldSlides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 md:right-10">
          {fieldSlides.map((s, idx) =>
          <button
            key={idx}
            onClick={() => setSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-1.5 transition-all ${idx === slide ? "w-6 bg-ozone" : "w-1.5 bg-silver/40 hover:bg-silver/70"}`} />

          )}
        </div>
      )}

      {/* High-vis baseline strip */}
      <div className="absolute inset-x-0 bottom-0 h-1 hi-vis-stripes opacity-80" />
    </section>);

}