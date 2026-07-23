import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MoveHorizontal } from "lucide-react";

const PLATES = [
  {
    no: "01",
    title: "Bangkok",
    coords: "13.7563°N · 100.5018°E",
    medium: "Painted / Elevated Highway",
    reach: "4.2M",
    duration: "30 DAYS",
    sentiment: "+78",
    img: "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/fbcd11009_generated_a71579e3.png",
    href: "https://ooh.earth/area/bangkok",
  },
  {
    no: "02",
    title: "London",
    coords: "51.5074°N · 0.1278°W",
    medium: "Digital / Urban Canyon",
    reach: "8.9M",
    duration: "21 DAYS",
    sentiment: "+64",
    img: "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/66f9ece94_generated_00cc9afb.png",
    href: "https://ooh.earth/area/london",
  },
  {
    no: "03",
    title: "Street Intervention",
    coords: "40.7128°N · 74.0060°W",
    medium: "Hand-Painted Mural",
    reach: "2.1M",
    duration: "14 DAYS",
    sentiment: "+91",
    img: "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/96d77b02c_generated_09de633d.png",
    href: "https://ooh.earth/",
  },
  {
    no: "04",
    title: "Global Constellation",
    coords: "MULTI-SITE / ORBITAL",
    medium: "Networked Digital",
    reach: "23M",
    duration: "ONGOING",
    sentiment: "+72",
    img: "https://media.base44.com/images/public/6a62213cff3ccbca88c04ff5/0654c85ce_generated_e9d6cbaf.png",
    href: "https://ooh.earth/",
  },
];

export default function CampaignAtlas() {
  const trackRef = useRef(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section id="atlas" className="relative border-t border-white/5 bg-void py-16 md:py-24">
      <div className="px-5 md:px-8">
        <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 02 — Campaign Atlas</span>
            <h2 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight text-silver md:text-7xl">
              Global<br />Interventions
            </h2>
          </div>
          <p className="max-w-sm font-mono text-[11px] leading-relaxed text-silver/50">
            Not ads — interventions. Each plate documents a creative resistance logged in the field. Scroll laterally to traverse the meridian.
          </p>
        </div>
      </div>

      {!reduced && (
        <div className="flex items-center justify-between px-5 py-4 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/40">
            <MoveHorizontal className="h-3.5 w-3.5" /> Drag / Scroll →
          </span>
          <div className="flex gap-2">
            <button onClick={() => scrollBy(-1)} className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors hover:border-ozone hover:text-ozone">Prev</button>
            <button onClick={() => scrollBy(1)} className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60 transition-colors hover:border-ozone hover:text-ozone">Next</button>
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        className={`atlas-track flex gap-px overflow-x-auto px-5 pb-6 md:px-8 ${reduced ? "flex-col" : "snap-x snap-mandatory"}`}
      >
        {PLATES.map((p) => (
          <article
            key={p.no}
            data-cursor="view"
            className={`group relative shrink-0 overflow-hidden border border-white/5 bg-card ${reduced ? "w-full" : "w-[85vw] snap-start md:w-[44vw] lg:w-[32vw]"}`}
          >
            <div className={`relative ${reduced ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
              <img
                src={p.img}
                alt={`${p.title} — ${p.medium}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ozone/0 transition-colors duration-500 group-hover:bg-ozone/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />

              <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/70">Plate {p.no}</span>
              <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">{p.sentiment}</span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-3xl font-black uppercase leading-none tracking-tight text-silver md:text-4xl">{p.title}</h3>
                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">{p.medium}</span>
                  </div>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex translate-y-2 items-center gap-1.5 border border-ozone/50 bg-void/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    Deep Dive <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5">
              {[
                ["Coordinates", p.coords],
                ["Reach", p.reach],
                ["Duration", p.duration],
              ].map(([label, val]) => (
                <div key={label} className="px-4 py-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-silver/40">{label}</div>
                  <div className="mt-1 font-mono text-[11px] text-silver/80">{val}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}