import { useEffect, useRef, useState } from "react";

const STATIONS = [
  { name: "Bangkok", lat: 13.75, lng: 100.5 },
  { name: "Jakarta", lat: -6.21, lng: 106.85 },
  { name: "Manila", lat: 14.59, lng: 120.98 },
  { name: "Lagos", lat: 6.52, lng: 3.38 },
  { name: "Nairobi", lat: -1.29, lng: 36.82 },
  { name: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "Delhi", lat: 28.61, lng: 77.21 },
  { name: "Cairo", lat: 30.04, lng: 31.24 },
  { name: "Bogotá", lat: 4.71, lng: -74.07 },
];

const WHO_PM25 = 15; // 24-hour WHO 2021 guideline (µg/m³)

function pmBand(v) {
  if (v == null || Number.isNaN(v)) return { label: "NO DATA", text: "text-dim", bar: "bg-dim", w: 0 };
  if (v <= WHO_PM25) return { label: "GOOD", text: "text-[#39FF14]", bar: "bg-[#39FF14]", w: Math.min(v / WHO_PM25, 1) };
  if (v <= 35) return { label: "MODERATE", text: "text-ozone", bar: "bg-ozone", w: Math.min((v - WHO_PM25) / (35 - WHO_PM25), 1) };
  if (v <= 55) return { label: "UNHEALTHY", text: "text-flare", bar: "bg-flare", w: Math.min((v - 35) / 20, 1) };
  return { label: "HAZARD", text: "text-[#FF0033]", bar: "bg-[#FF0033]", w: 1 };
}

const fmt = (n, d = 2) => (Number(n) || 0).toFixed(d);

const SYNODIC = 29.530588853;
const NEW_MOON_JD = 2451550.1;

function moonPhase(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  let p = ((jd - NEW_MOON_JD) % SYNODIC) / SYNODIC;
  return p < 0 ? p + 1 : p;
}

function phaseName(p) {
  if (p < 0.03 || p > 0.97) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

function MoonGlyph({ phase, r = 11 }) {
  const c = Math.cos(2 * Math.PI * phase);
  const rx = Math.max(0.01, r * Math.abs(c));
  const waxing = phase < 0.5;
  const sweep1 = waxing ? 1 : 0;
  const sweep2 = c >= 0 ? sweep1 : 1 - sweep1;
  const d = `M 0,${-r} A ${r},${r} 0 1 ${sweep1} 0,${r} A ${rx},${r} 0 1 ${sweep2} 0,${-r} Z`;
  return (
    <svg viewBox="-14 -14 28 28" className="h-7 w-7 shrink-0">
      <circle r={r} fill="#0a0a0a" stroke="rgba(241,241,241,0.18)" strokeWidth="0.5" />
      <path d={d} fill="#EDFF00" style={{ filter: "drop-shadow(0 0 3px rgba(237,255,0,0.4))" }} />
    </svg>
  );
}

export default function GlobeHud({ map }) {
  const [pm, setPm] = useState(null);
  const [clock, setClock] = useState("");
  const [elapsed, setElapsed] = useState("00:00:00");
  const [tel, setTel] = useState({ lng: 100.55, lat: 13.746, bearing: 0, pitch: 0, zoom: 1.6, span: 0 });
  const startRef = useRef(Date.now());
  const [showAir, setShowAir] = useState(true);
  const [moon, setMoon] = useState({ phase: 0, name: "—", illum: 0 });

  // PM2.5 — Open-Meteo Air Quality (free, no key)
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const lat = STATIONS.map((s) => s.lat).join(",");
        const lng = STATIONS.map((s) => s.lng).join(",");
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm2_5`;
        const res = await fetch(url);
        const j = await res.json();
        const arr = (j && j.current && j.current.pm2_5) || [];
        const vals = Array.isArray(arr) ? arr : [arr];
        if (active) setPm(STATIONS.map((s, i) => ({ name: s.name, v: vals[i] ?? null })));
      } catch (e) {
        if (active) setPm(STATIONS.map((s) => ({ name: s.name, v: null })));
      }
    };
    load();
    const t = setInterval(load, 600000);
    return () => { active = false; clearInterval(t); };
  }, []);

  // UTC clock + mission elapsed
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toISOString().slice(11, 19));
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(
        `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
      );
      const phase = moonPhase(d);
      setMoon({ phase, name: phaseName(phase), illum: (1 - Math.cos(2 * Math.PI * phase)) / 2 });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // live map telemetry
  useEffect(() => {
    if (!map) return;
    const read = () => {
      const c = map.getCenter();
      setTel({
        lng: c.lng,
        lat: c.lat,
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        zoom: map.getZoom(),
        span: (40075 * Math.cos((c.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom()),
      });
    };
    read();
    const t = setInterval(read, 250);
    return () => clearInterval(t);
  }, [map]);

  const overWHO = pm ? pm.filter((p) => p.v != null && p.v > WHO_PM25).length : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-[900] select-none font-mono text-[10px] uppercase tracking-[0.18em] text-silver/70">
      {/* viewfinder corner brackets */}
      <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-ozone/60" />
      <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-ozone/60" />
      <span className="absolute bottom-2 left-2 h-3 w-3 border-l border-b border-ozone/60" />
      <span className="absolute bottom-2 right-2 h-3 w-3 border-r border-b border-ozone/60" />

      {/* TL: mission header + clock */}
      <div className="absolute left-3 top-16 max-w-[230px]">
        <div className="flex items-center gap-1.5 text-ozone">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-flare" />
          <span className="text-glow-ozone">OOH · ORBITAL TELEMETRY</span>
        </div>
        <div className="mt-1 text-dim">UTC {clock || "--:--:--"} · T+{elapsed}</div>
        <div className="mt-0.5 text-dim">SIG ▮▮▮▯ · DATALINK OPEN</div>
        <div className="mt-2 flex items-center gap-2 border-t border-slate2/40 pt-2">
          <MoonGlyph phase={moon.phase} />
          <div>
            <div className="text-ozone">{moon.name}</div>
            <div className="text-dim">{(moon.illum * 100).toFixed(0)}% lit · stage {(moon.phase * 100).toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* TC: telemetry strip */}
      <div data-tour="hud-tel" className="absolute left-1/2 top-3 -translate-x-1/2">
        <div className="flex gap-4 border border-slate2/70 bg-void/70 px-3 py-1.5 backdrop-blur-md">
          <span className="text-dim">CENTER <span className="text-silver">{fmt(tel.lng)},{fmt(tel.lat)}</span></span>
          <span className="text-dim">BRG <span className="text-ozone">{fmt(tel.bearing, 0)}°</span></span>
          <span className="text-dim">PITCH <span className="text-ozone">{fmt(tel.pitch, 0)}°</span></span>
          <span className="text-dim">ZOOM <span className="text-ozone">{fmt(tel.zoom, 1)}</span></span>
          <span className="text-dim">SPAN <span className="text-flare">{fmt(tel.span, 0)} km</span></span>
        </div>
      </div>

      {/* TR: PM2.5 air commons panel */}
      {showAir ? (
        <div data-tour="hud-pm25" className="pointer-events-auto absolute right-3 top-16 w-[230px]">
          <div className="border border-slate2/70 bg-void/70 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate2/60 px-3 py-1.5">
              <span className="text-ozone">AIR COMMONS · PM2.5</span>
              <div className="flex items-center gap-2">
                <span className="text-dim">{pm ? pm.length : 0} STN</span>
                <button onClick={() => setShowAir(false)} aria-label="Hide Air Commons" className="text-dim transition-colors hover:text-flare">✕</button>
              </div>
            </div>
            <div className="px-3 py-1.5">
              <div className="flex justify-between text-[9px] text-dim">
                <span>WHO 24H ≤ {WHO_PM25} µg/m³</span>
                <span className="text-flare">{overWHO} OVER</span>
              </div>
            </div>
            <div className="max-h-[210px] overflow-y-auto px-3 pb-2">
              {pm === null ? (
                <div className="py-2 text-dim">// acquiring air data…</div>
              ) : (
                pm.map((p, i) => {
                  const b = pmBand(p.v);
                  return (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                      <span className="w-16 truncate text-[9px] text-silver/80">{p.name}</span>
                      <span className={`w-9 text-right ${b.text}`}>{p.v != null ? p.v.toFixed(0) : "--"}</span>
                      <span className="h-1 flex-1 bg-slate2/50">
                        <span className={`block h-full ${b.bar}`} style={{ width: `${b.w * 100}%` }} />
                      </span>
                      <span className={`w-[56px] text-right text-[8px] ${b.text}`}>{b.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAir(true)} className="pointer-events-auto absolute right-3 top-16 border border-slate2/70 bg-void/70 px-2.5 py-1.5 text-ozone backdrop-blur-md transition-colors hover:border-ozone">
          AIR
        </button>
      )}
    </div>
  );
}