import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, Radio, ShieldAlert, Workflow, ArrowUpRight } from "lucide-react";
import HeroConsole from "@/components/ooh/HeroConsole";

const WORD = "oohearth.app";

const SLIDES = [
{ kind: "image", src: "https://ooh.earth/wp-content/uploads/2026/05/1777896004-01-d21q.webp", caption: "Billboard · 1039 Ploenchit, Bangkok" },
{ kind: "video", src: "https://firebasestorage.googleapis.com/v0/b/standards-site-beta.appspot.com/o/documents%2Fusaglsjaht9%2Fa61ac5238ce%2FSubs6.mp4?alt=media&token=fe1621f1-39b5-4f76-b11e-0700ecedcfba", caption: "Field dispatch · subvertising reel" },
{ kind: "image", src: "https://ooh.earth/wp-content/uploads/2026/05/1777667192-01-4t5x.webp", caption: "Painted takeover · 778 Sukhumvit" },
{ kind: "image", src: "https://ooh.earth/wp-content/uploads/2026/05/1777649595-01-nw44.webp", caption: "Digital screen · 28 Chitlom" },
{ kind: "image", src: "https://ooh.earth/wp-content/uploads/2026/04/1777432241-01-98e1.webp", caption: "Billboard · 900 Ploenchit" }];


export default function Hero({ onCommand }) {
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onScroll = () => setOffset(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setSlide((p) => (p + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [reduced]);

  const parallax = reduced ? 0 : offset * 0.5;

  return (
    <section id="top" className="hero-section relative h-[100svh] w-full overflow-hidden bg-void">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${parallax}px) scale(1.15)` }}>
        
        {SLIDES.map((s, idx) =>
        <div key={idx} className={`hero-media absolute inset-0 transition-opacity duration-[1200ms] ${idx === slide ? "opacity-60" : "opacity-0"}`}>
            {s.kind === "video" ?
          <video src={s.src} autoPlay muted loop playsInline className="h-full w-full object-cover" data-cursor="view" /> :

          <img src={s.src} alt={s.caption} className="h-full w-full object-cover" data-cursor="view" />
          }
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

      <div className="relative z-20 flex h-full flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
          <span>LAT 13.7563°N · LON 100.5018°E · BKK · PM2.5 62µg/m³</span>
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-flicker text-ozone" />
            <span className="glitch" data-text="LIVE FEED">LIVE FEED</span>
          </span>
        </div>

        <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-12">
          {/* Left · wordmark + tagline */}
          <div className="md:col-span-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-ozone">OOH Street Art & Adbusting Maps</span>
            <h1 className="mt-3 whitespace-nowrap font-brand text-[clamp(1.75rem,7vw,4.25vw)] leading-[0.82] tracking-[-0.03em] text-silver">
              {WORD.split("").map((ch, i) =>
              <span key={i} className="inline-block">{ch === "." ? <span className="text-ozone">.</span> : ch}</span>
              )}
            </h1>
            <p className="mt-5 max-w-md font-display text-sm font-medium leading-[1.45] text-silver/70 md:text-[15px]">
              An open-source, community-funded app reclaiming the visual commons. Mapping corporate advertising offenses and street-art adbusting worldwide — SDG-aligned, from the orbital perspective.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
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

      <div className="absolute bottom-4 left-6 z-20 font-mono text-[9px] uppercase tracking-[0.25em] text-silver/70 md:left-10">
        // {SLIDES[slide].caption}
      </div>
      <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 md:right-10">
        {SLIDES.map((s, idx) =>
        <button
          key={idx}
          onClick={() => setSlide(idx)}
          aria-label={`Slide ${idx + 1}`}
          className={`h-1.5 transition-all ${idx === slide ? "w-6 bg-ozone" : "w-1.5 bg-silver/40 hover:bg-silver/70"}`} />

        )}
      </div>

      {/* High-vis baseline strip */}
      <div className="absolute inset-x-0 bottom-0 h-1 hi-vis-stripes opacity-80" />
    </section>);

}