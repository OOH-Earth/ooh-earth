import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { NOMAD_CITIES, NOMAD_TOTAL, NOMAD_SOURCE, NOMAD_CAPTURED } from "@/components/ooh/uikit/nomadData";
import { Radio, MapPin, ArrowUpRight, Globe2 } from "lucide-react";

const MAX = Math.max(...NOMAD_CITIES.map((c) => c.count));

function CountUp({ to, active, duration = 1.3 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active, duration]);
  return n.toLocaleString();
}

function CityCard({ c, index, active }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width - 0.5) * 8, y: ((e.clientY - r.top) / r.height - 0.5) * 8 });
  };
  const onLeave = () => setPos({ x: 0, y: 0 });

  return (
    <motion.a
      ref={ref}
      href={`https://${NOMAD_SOURCE}/${c.city.toLowerCase().replace(/\s+/g, "-")}`}
      target="_blank"
      rel="noreferrer"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: pos.x, y: pos.y }}
      initial={{ opacity: 0, y: 18 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 220, damping: 24 }}
      className="group relative block overflow-hidden border border-slate2/60 bg-card p-4 transition-colors hover:border-ozone/60"
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl leading-none">{c.flag}</span>
        {c.field ? (
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ozone">
            <MapPin className="h-3 w-3" /> field
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">scout</span>
        )}
      </div>
      <div className="mt-3 font-display text-lg font-bold tracking-[-0.02em] text-silver">{c.city}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-extrabold tabular-nums text-ozone">
          <CountUp to={c.count} active={active} />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray">nomads</span>
      </div>
      <div className="mt-3 h-1 w-full bg-slate2/60">
        <motion.div
          className="h-full bg-gradient-to-r from-ozone to-flare"
          initial={{ width: 0 }}
          animate={active ? { width: `${(c.count / MAX) * 100}%` } : {}}
          transition={{ delay: index * 0.04 + 0.2, duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
        <span>{c.region}</span>
        <span className="tabular opacity-70">{c.lat.toFixed(3)}, {c.lng.toFixed(3)}</span>
      </div>
      <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 -translate-y-1 translate-x-1 text-ozone opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
    </motion.a>
  );
}

export default function NomadPulse({ compact = false }) {
  const wrap = useRef(null);
  const inView = useInView(wrap, { once: true, margin: "-80px" });
  const top = compact ? NOMAD_CITIES.slice(0, 6) : NOMAD_CITIES.slice(0, 12);

  return (
    <section ref={wrap} className="border border-slate2/60 bg-void/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate2/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Radio className="h-3.5 w-3.5 animate-flicker text-ozone" />
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-silver">Mobility intel // {NOMAD_SOURCE}</h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray">
          <span className="hidden sm:inline">snapshot · {NOMAD_CAPTURED}</span>
          <span className="flex items-center gap-1 border border-ozone/50 px-2 py-0.5 text-ozone">
            <Globe2 className="h-3 w-3" /> Web7 · sovereign
          </span>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold tabular-nums text-silver">
              <CountUp to={NOMAD_TOTAL} active={inView} />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ozone">active nomads tracked</span>
          </div>
          <span className="font-mono text-[10px] leading-relaxed text-darkgray">
            Member-density overlay — nomad hubs double as field-reporter zones. Density bar = share of network.
          </span>
        </div>
      </div>

      {/* Marquee ticker */}
      <div className="relative overflow-hidden border-y border-slate2/40 bg-void/80 py-2">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap pl-8">
          {[...NOMAD_CITIES, ...NOMAD_CITIES].map((c, i) => (
            <span key={i} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-silver/60">
              <span>{c.flag}</span> {c.city}
              <span className="text-ozone tabular">{c.count.toLocaleString()}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3 lg:grid-cols-4">
        {top.map((c, i) => (
          <CityCard key={c.city} c={c} index={i} active={inView} />
        ))}
      </div>

      <div className="border-t border-slate2/60 px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// ambient · composable · real-time · {NOMAD_CITIES.length} hubs indexed</span>
      </div>
    </section>
  );
}