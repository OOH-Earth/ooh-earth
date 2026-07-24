import { BusFront, Building2, ShieldAlert, Tent } from "lucide-react";
import { BUS_STOPS, BUS_STOP_AREAS } from "@/components/ooh/busStops";

export default function ProgressInfographic() {
  const total = BUS_STOPS.length;
  const areas = BUS_STOP_AREAS.length;
  const pavement = BUS_STOPS.filter((b) => b.facing === "pavement").length;
  const road = total - pavement;
  const shelters = BUS_STOPS.filter((b) => b.shape === "shelter").length;
  const poles = total - shelters;
  const confirmed = 0;
  const pavePct = Math.round((pavement / total) * 100);
  const roadPct = 100 - pavePct;
  const circ = 2 * Math.PI * 40;
  const maxArea = Math.max(...BUS_STOP_AREAS.map((a) => a.stops.length));
  const topAreas = [...BUS_STOP_AREAS]
    .map((a) => ({ area: a.area, n: a.stops.length }))
    .sort((a, b) => b.n - a.n);

  const tiles = [
    { icon: BusFront, label: "Stops mapped", value: total, accent: "text-ozone" },
    { icon: Building2, label: "Areas covered", value: areas, accent: "text-ozone" },
    { icon: Tent, label: "Shelter units", value: shelters, accent: "text-silver" },
    { icon: ShieldAlert, label: "Keys confirmed", value: `${confirmed}/${total}`, accent: "text-flare" },
  ];

  return (
    <div className="border border-slate2/60 bg-void">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate2/40 md:grid-cols-4 md:divide-y-0">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col gap-1 p-4">
            <t.icon className={`h-4 w-4 ${t.accent}`} />
            <span className="font-display text-2xl font-bold tabular text-silver">{t.value}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 border-t border-slate2/60 p-5 md:grid-cols-3">
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Facing split</div>
          <div className="flex h-3 w-full overflow-hidden">
            <div style={{ width: `${pavePct}%`, backgroundColor: "#880E4F" }} />
            <div style={{ width: `${roadPct}%`, backgroundColor: "#FF5252" }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] tabular">
            <span style={{ color: "#C2185B" }}>Pavement {pavement} · {pavePct}%</span>
            <span style={{ color: "#FF5252" }}>Road {road} · {roadPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(241,241,241,0.08)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FF5C00" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ} transform="rotate(-90 50 50)" />
            <text x="50" y="55" textAnchor="middle" fontSize="15" className="fill-flare" style={{ fontVariantNumeric: "tabular-nums" }}>0%</text>
          </svg>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Field-check progress</div>
            <div className="mt-1 font-display text-lg font-bold text-flare">{confirmed}/{total}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">keys confirmed in field</div>
          </div>
        </div>

        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Unit type</div>
          <div className="flex h-3 w-full overflow-hidden">
            <div style={{ width: `${Math.round((shelters / total) * 100)}%`, backgroundColor: "#EDFF00" }} />
            <div style={{ width: `${Math.round((poles / total) * 100)}%`, backgroundColor: "rgba(241,241,241,0.18)" }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] tabular">
            <span className="text-ozone">Shelter {shelters}</span>
            <span className="text-darkgray">Pole/flag {poles}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate2/60 p-5">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Distribution by area</div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {topAreas.map((a) => (
            <div key={a.area} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray">{a.area}</span>
              <div className="h-2 flex-1 bg-slate2/30">
                <div className="h-full bg-ozone/70" style={{ width: `${(a.n / maxArea) * 100}%` }} />
              </div>
              <span className="w-6 text-right font-mono text-[9px] tabular text-dim">{a.n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}