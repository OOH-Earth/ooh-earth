import { Link } from "react-router-dom";
import { Radio, ArrowUpRight } from "lucide-react";

const NORTH = [
  { city: "London", country: "United Kingdom", logged: 14, level: 35, img: "https://oohearth.app/wp-content/uploads/2026/03/04_Lindsay-Grime_Were-Hiring_Shell-AGM-2024_credit-Brandalism_12x9-2.jpeg" },
  { city: "New York", country: "United States", logged: 0, level: 0 },
  { city: "Tokyo", country: "Japan", logged: 0, level: 0 },
  { city: "Berlin", country: "Germany", logged: 0, level: 0 },
  { city: "Paris", country: "France", logged: 0, level: 0 },
  { city: "Toronto", country: "Canada", logged: 0, level: 0 },
  { city: "Sydney", country: "Australia", logged: 0, level: 0 },
  { city: "Amsterdam", country: "Netherlands", logged: 0, level: 0 },
];

const SOUTH = [
  { city: "São Paulo", country: "Brazil", logged: 0, level: 0 },
  { city: "Lagos", country: "Nigeria", logged: 0, level: 0 },
  { city: "Mumbai", country: "India", logged: 0, level: 0 },
  { city: "Jakarta", country: "Indonesia", logged: 0, level: 0 },
  { city: "Bangkok", country: "Thailand", logged: 10, level: 40, img: "https://oohearth.app/wp-content/uploads/2026/05/1777896004-01-d21q.webp" },
  { city: "Nairobi", country: "Kenya", logged: 0, level: 0 },
  { city: "Bogotá", country: "Colombia", logged: 0, level: 0 },
  { city: "Manila", country: "Philippines", logged: 0, level: 0 },
];

function CityCard({ c, highlighted }) {
  const live = c.logged > 0;
  const barW = live ? c.level : 4;
  return (
    <Link
      to="/map"
      className="group relative flex h-44 flex-col justify-end overflow-hidden border border-slate2 p-4 transition-colors hover:border-ozone"
    >
      {c.img ? (
        <>
          <img
            src={c.img}
            alt={`${c.city} field photography`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/55 to-void/10" />
        </>
      ) : (
        <>
          <div
            className={`absolute inset-0 ${
              live
                ? "bg-gradient-to-br from-ozone/15 via-void to-void"
                : highlighted
                ? "bg-gradient-to-br from-flare/10 via-void to-void"
                : "bg-gradient-to-br from-slate2/40 to-void"
            }`}
          />
          <div className="absolute inset-0 grid-bg opacity-60" />
        </>
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">{c.country}</span>
          <span
            className={`flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] ${
              live ? "text-ozone" : highlighted ? "text-flare" : "text-darkgray"
            }`}
          >
            <Radio className="h-3 w-3 animate-pulse" /> {live ? "Live" : "Standby"}
          </span>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <h3 className="font-display text-2xl font-black uppercase tracking-tight text-silver">{c.city}</h3>
          <ArrowUpRight className="h-4 w-4 text-darkgray transition-colors group-hover:text-ozone" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 bg-slate2">
            <div
              className={`h-full ${live ? "bg-ozone" : "bg-dim/50"}`}
              style={{ width: `${barW}%` }}
            />
          </div>
          <span className="font-mono text-[9px] tabular-nums text-darkgray">
            {c.logged} logged
          </span>
        </div>
      </div>
    </Link>
  );
}

function Group({ title, subtitle, cities, highlighted }) {
  return (
    <div className="mt-12">
      <div className="flex flex-col gap-1 border-l-2 border-ozone/60 pl-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">{title}</span>
        <p className="font-display text-sm text-darkgray">{subtitle}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {cities.map((c) => (
          <CityCard key={c.city} c={c} highlighted={highlighted} />
        ))}
      </div>
    </div>
  );
}

export default function CityGrid() {
  return (
    <section id="coverage" className="border-t border-white/5 bg-void px-5 py-20 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// Field coverage</span>
            <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-silver md:text-6xl">
              Global <span className="text-ozone text-glow-ozone">Atlas</span>
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm leading-[1.5] text-darkgray">
            Ready-to-fill city grids across the Global North and South. Where corporate advertising goes
            unrecorded, the public record stays blind — every city below is awaiting field reports.
          </p>
        </div>

        <Group
          title="Global North"
          subtitle="Heavily documented, saturated ad-surface zones."
          cities={NORTH}
        />
        <Group
          title="Global South"
          subtitle="Under-documented — advertising offenses go unrecorded."
          cities={SOUTH}
          highlighted
        />

        <div className="mt-12 border border-slate2 bg-card p-5 md:p-6">
          <p className="font-display text-sm leading-[1.5] text-darkgray">
            <span className="text-ozone">●</span> Coverage gap: roughly 70% of the world's outdoor
            advertising surface sits in the Global South, yet under 5% of it appears on any public
            record. Log a report from any city to flip it from <span className="text-flare">Standby</span> to{" "}
            <span className="text-ozone">Live</span>.
          </p>
        </div>
      </div>
    </section>
  );
}