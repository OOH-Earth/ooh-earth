import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MousePointerClick, Tag, Activity } from "lucide-react";
import Pin, { formatCompact } from "./Pin";
import SpecsBar from "./SpecsBar";
import StatusTag, { STATUS_TAGS } from "./StatusTag";
import SpotDetailPanel from "./SpotDetailPanel";

const PIN_TYPES = [
  { type: "billboard", label: "Billboard", base: 480000, delta: 6.2, metric: "Impressions / wk" },
  { type: "digital", label: "Digital", base: 12400, delta: 12.4, metric: "Loops / day" },
  { type: "painted", label: "Painted", base: 38, delta: 0.4, metric: "Days live" },
  { type: "projection", label: "Projection", base: 6.5, delta: -2.1, metric: "Hours / night" },
  { type: "sticker", label: "Sticker", base: 142, delta: 3.8, metric: "Tags logged" },
  { type: "mural", label: "Mural", base: 24, delta: 0, metric: "Surface m²" },
  { type: "transit", label: "Transit", base: 8900, delta: 1.7, metric: "Riders / day" },
  { type: "other", label: "Field", base: 7, delta: 1.0, metric: "Reports" },
];

const BRANDS = [
  { id: "shell", name: "Shell", color: "#FBCE07", text: "#000", reach: 320000 },
  { id: "mcd", name: "McD", color: "#FFC72C", text: "#000", reach: 540000 },
  { id: "nike", name: "Nike", color: "#000000", text: "#fff", reach: 760000 },
  { id: "coke", name: "Coke", color: "#F40009", text: "#fff", reach: 880000 },
  { id: "hsbc", name: "HSBC", color: "#DB0011", text: "#fff", reach: 96000 },
];

const DEMO_COUNTS = { billboard: 17, transit: 18, digital: 3, other: 2, sticker: 8 };
const DEMO_TOTAL = Object.values(DEMO_COUNTS).reduce((a, b) => a + b, 0);

function useStream(base, delta) {
  const [v, setV] = useState(base);
  useEffect(() => {
    setV(base);
    const id = setInterval(() => {
      setV((prev) => Math.max(0, prev + Math.round(base * (delta / 100) * (0.4 + Math.random() * 0.9))));
    }, 1500);
    return () => clearInterval(id);
  }, [base, delta]);
  return { value: v, delta, label: "live" };
}

const STATES = [
  { key: "default", label: "Default", selected: false, hovered: false },
  { key: "hover", label: "Rollover", selected: false, hovered: true },
  { key: "selected", label: "Active", selected: true, hovered: false },
];

export default function PinLab() {
  const [active, setActive] = useState(PIN_TYPES[0]);
  const [verified, setVerified] = useState(false);
  const stream = useStream(active.base, active.delta);

  return (
    <div className="space-y-3">
      {/* Stage + telemetry */}
      <div className="relative grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className="relative grid place-items-center overflow-hidden border border-slate2/60 bg-void grid-bg" style={{ minHeight: 280 }}>
          <motion.div
            className="pointer-events-none absolute h-56 w-56 rounded-full"
            style={{ background: "conic-gradient(from 0deg, rgba(237,255,0,0.10), transparent 60%)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <Pin
            type={active.type}
            status={verified ? "verified" : "pending"}
            size={76}
            selected
            stream={stream}
            brands={BRANDS}
          />
          <span className="absolute left-3 top-3 font-mono text-[8px] uppercase tracking-[0.3em] text-dim/70">// stage · active pin · rollover reveals brand orbit</span>
          <button
            onClick={() => setVerified((v) => !v)}
            className="absolute bottom-3 left-3 border border-slate2/60 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            status: {verified ? "verified" : "pending"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="border border-slate2/60 bg-card p-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">{active.label} · spot</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-silver">{formatCompact(stream.value)}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{active.metric}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-darkgray">
              <Activity className="h-3 w-3 text-ozone" /> stream · 1.5s tick
            </div>
            <div className="mt-4">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-dim"><Tag className="h-3 w-3" /> tagged brands</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BRANDS.map((b) => (
                  <span key={b.id} className="flex items-center gap-1 border border-slate2/60 px-1.5 py-1 font-mono text-[8px] text-silver/80">
                    <span className="h-2.5 w-2.5 rounded-full border border-white/15" style={{ background: b.color }} />
                    {b.name}
                    <sup className="text-ozone">{formatCompact(b.reach)}</sup>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <SpecsBar counts={DEMO_COUNTS} total={DEMO_TOTAL} />
        </div>
      </div>

      {/* Status-tag pill system */}
      <div className="border border-slate2/60 bg-card p-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// status tags · pill system</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.keys(STATUS_TAGS).map((t) => (
            <StatusTag key={t} tag={t} />
          ))}
        </div>
      </div>

      {/* Gallery — all pin variants */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PIN_TYPES.map((p) => {
          const isActive = p.type === active.type;
          return (
            <button
              key={p.type}
              onClick={() => setActive(p)}
              className={`group flex flex-col items-center gap-1 border p-2 transition-colors ${isActive ? "border-ozone bg-ozone/5" : "border-slate2/60 hover:border-slate2"}`}
            >
              <Pin type={p.type} size={36} hovered={isActive} />
              <span className={`font-mono text-[8px] uppercase tracking-[0.15em] ${isActive ? "text-ozone" : "text-dim"}`}>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interaction states */}
      <div className="grid grid-cols-3 gap-2">
        {STATES.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-2 border border-slate2/60 bg-void p-3 grid-bg">
            <Pin type={active.type} size={44} selected={s.selected} hovered={s.hovered} brands={s.hovered || s.selected ? BRANDS : []} />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Location detail panel — "Run Duck Cover" */}
      <div>
        <div className="mb-2 flex items-center gap-2 border-b border-slate2/40 pb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// location detail · "Run Duck Cover"</span>
        </div>
        <SpotDetailPanel />
      </div>

      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">
        <MousePointerClick className="h-3 w-3 text-ozone" /> click a variant to load it into the stage · hover reveals tagged brands + superscript reach
      </p>
    </div>
  );
}