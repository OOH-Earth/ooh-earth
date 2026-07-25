import { Gift } from "lucide-react";
import BrandMark from "@/components/ooh/BrandMark";
import ClimateClock from "@/components/ooh/ClimateClock";
import GlobePreview from "@/components/ooh/store/GlobePreview";
import MetroKitPreview from "@/components/ooh/store/MetroKitPreview";
import CursorPackPreview from "@/components/ooh/store/CursorPackPreview";
import ThemePreview from "@/components/ooh/store/ThemePreview";

const COMPONENTS = [
  {
    id: "brandmark",
    title: "Orbital BrandMark",
    desc: "The oohearth.app logo mark — an animated SVG orbital gyroscope with dual counter-rotating rings and a pulsing ozone core. Pure SVG + SMIL, zero runtime deps.",
    price: "Free",
    tags: ["SVG", "React", "Zero-dep"],
    demo: <BrandMark className="h-24 w-24" />,
  },
  {
    id: "climate-clock",
    title: "Climate Clock",
    desc: "Live 1.5°C deadline countdown with a carbon-budget lifeline bar. Self-contained timer — drops into any surface.",
    price: "$9",
    tags: ["React", "Live"],
    demo: <ClimateClock />,
  },
  {
    id: "field-globe",
    title: "Field Globe",
    desc: "A lightweight rotating globe with a lat/lng grid and ozone field pins. Framer-motion driven — no map tiles, no maplibre. The concept rendition of the live atlas globe.",
    price: "$49",
    tags: ["Framer", "SVG"],
    demo: <GlobePreview />,
  },
  {
    id: "metro-kit",
    title: "Metro Widget Kit",
    desc: "The 2×2 animated metric tile suite — flickering tabular readouts and progress bars. The building block of every HUD on the site.",
    price: "$79",
    tags: ["React", "Tailwind"],
    demo: <MetroKitPreview />,
  },
  {
    id: "viewfinder-cursor",
    title: "Viewfinder Cursor",
    desc: "A roaming reticle cursor with cognitive hover states — the interaction layer that gives the site its field-instrument feel.",
    price: "$19",
    tags: ["Framer", "UX"],
    demo: <CursorPackPreview />,
  },
  {
    id: "hi-vis-theme",
    title: "Hi-Vis Theme",
    desc: "The black-canvas / ozone-yellow design system: pulsing accent dot, Metro strips, hi-vis stripe footer, grid background.",
    price: "$49",
    tags: ["Theme", "Tokens"],
    demo: <ThemePreview />,
  },
];

function ComponentCard({ entry, onGiveaway }) {
  return (
    <div className="group flex flex-col border border-slate2/50 bg-card transition-colors hover:border-ozone/40">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-slate2/50 bg-void">
        <div className="absolute inset-0 flex items-center justify-center">{entry.demo}</div>
        <span className="absolute left-2 top-2 border border-slate2/60 bg-void/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ozone backdrop-blur">Component</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold tracking-[-0.01em] text-silver">{entry.title}</h3>
        <p className="mt-2 flex-1 font-display text-[12px] leading-relaxed text-darkgray">{entry.desc}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.tags.map((t) => (
            <span key={t} className="border border-slate2/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-dim">{t}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex-1 font-display text-lg font-black tabular text-silver">{entry.price}</span>
          <button
            onClick={() => onGiveaway(entry)}
            className="flex items-center gap-1.5 border border-slate2/60 px-2.5 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-[#39FF14] hover:text-[#39FF14]"
          >
            <Gift className="h-3 w-3" /> Giveaway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComponentGallery({ onGiveaway }) {
  const handle = (entry) =>
    onGiveaway({ title: entry.title, subtitle: entry.tags.join(" · "), description: entry.desc });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {COMPONENTS.map((entry) => (
        <ComponentCard key={entry.id} entry={entry} onGiveaway={handle} />
      ))}
    </div>
  );
}