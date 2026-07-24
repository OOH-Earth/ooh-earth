import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MoveHorizontal } from "lucide-react";

const PLATES = [
  {
    no: "01",
    cat: "Cat 1 / Billboards",
    title: "Ploenchit",
    coords: "13.7462°N · 100.5402°E",
    medium: "Painted · Elevated highway",
    reach: "4.2M",
    duration: "30 DAYS",
    sentiment: "+78",
    sdg: "11",
    img: "https://ooh.earth/wp-content/uploads/2026/05/1777896004-01-d21q.webp",
    href: "https://ooh.earth/location/1777896004/",
  },
  {
    no: "02",
    cat: "Cat 1 / Billboards",
    title: "Sukhumvit",
    coords: "13.7362°N · 100.5612°E",
    medium: "Hand-painted · Wall",
    reach: "2.1M",
    duration: "14 DAYS",
    sentiment: "+91",
    sdg: "11",
    img: "https://ooh.earth/wp-content/uploads/2026/05/1777667192-01-4t5x.webp",
    href: "https://ooh.earth/location/1777667192/",
  },
  {
    no: "03",
    cat: "Cat 1 / Billboards",
    title: "Digital stack",
    coords: "13.7390°N · 100.5660°E",
    medium: "Digital · Networked",
    reach: "8.9M",
    duration: "ONGOING",
    sentiment: "+64",
    sdg: "9 · 17",
    img: "https://ooh.earth/wp-content/uploads/2026/05/1777649595-01-nw44.webp",
    href: "https://ooh.earth/location/1777649595/",
  },
  {
    no: "04",
    cat: "Cat 1 / Billboards",
    title: "Skyline array",
    coords: "13.7410°N · 100.5540°E",
    medium: "Digital · Multi-panel",
    reach: "5.5M",
    duration: "21 DAYS",
    sentiment: "+72",
    sdg: "11",
    img: "https://ooh.earth/wp-content/uploads/2026/05/1777635751-01-f5um.webp",
    href: "https://ooh.earth/location/1777635751/",
  },
  {
    no: "05",
    cat: "Subvertising",
    title: "Shell AGM",
    coords: "LONDON · 51.4890°N · 0.0130°E",
    medium: "Subvertising · Brandalism",
    reach: "23M",
    duration: "LOGGED",
    sentiment: "+99",
    sdg: "13 · 16",
    img: "https://ooh.earth/wp-content/uploads/2026/03/04_Lindsay-Grime_Were-Hiring_Shell-AGM-2024_credit-Brandalism_12x9-2.jpeg",
    href: "https://ooh.earth/location/1773075390/",
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
    <section id="atlas" className="relative border-t border-slate2/40 bg-void py-16 md:py-24">
      <div className="px-5 md:px-8">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Section 02 — Campaign atlas</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Global<br />interventions
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Not ads — interventions. Each plate is a creative resistance logged in the field and archived for the public record, mapped to its UN SDG outcome. Traverse the meridian to inspect.
          </p>
        </div>
      </div>

      {!reduced && (
        <div className="flex items-center justify-between px-5 py-4 md:px-8">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
            <MoveHorizontal className="h-3.5 w-3.5" /> Drag / scroll →
          </span>
          <div className="flex gap-2">
            <button onClick={() => scrollBy(-1)} className="border border-slate2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">Prev</button>
            <button onClick={() => scrollBy(1)} className="border border-slate2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone">Next</button>
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
            className={`group relative shrink-0 overflow-hidden border border-slate2/60 bg-card ${reduced ? "w-full" : "w-[85vw] snap-start md:w-[44vw] lg:w-[32vw]"}`}
          >
            <div className={`relative ${reduced ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
              <img
                src={p.img}
                alt={`${p.title} — ${p.medium}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ozone/0 transition-colors duration-500 group-hover:bg-ozone/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />

              <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.3em] text-silver/80">Plate {p.no}</span>
              <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone">{p.sentiment}</span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-silver md:text-4xl">{p.title}</h3>
                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">{p.medium}</span>
                  </div>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex translate-y-2 items-center gap-1.5 border border-ozone bg-void/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ozone opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    Deep dive <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-slate2/40 border-t border-slate2/40">
              {[
                ["Category", p.cat],
                ["Reach", p.reach],
                ["Duration", p.duration],
                ["SDG", p.sdg],
              ].map(([label, val]) => (
                <div key={label} className="px-4 py-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">{label}</div>
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