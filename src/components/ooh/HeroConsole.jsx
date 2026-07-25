import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Radio, ShieldCheck, Crosshair, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";

const relTime = (iso) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function useCountUp(target, dur = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) { setN(0); return; }
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return n;
}

function Stat({ label, value, Icon, color }) {
  const n = useCountUp(value);
  return (
    <div className="flex flex-col justify-between border border-slate2/60 bg-void/50 p-3 backdrop-blur-sm transition-colors hover:border-ozone/40">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">{label}</span>
        <Icon className="h-3 w-3" style={{ color }} />
      </div>
      <div className="mt-2 font-mono text-xl font-bold tabular leading-none text-glow-ozone" style={{ color }}>
        {String(n).padStart(2, "0")}
      </div>
    </div>
  );
}

export default function HeroConsole({ onCommand }) {
  const [d, setD] = useState({ spots: 0, verified: 0, leads: 0, ops: 0, feed: [] });
  const [now, setNow] = useState(() => new Date());
  const [fi, setFi] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [locs, ops, leads] = await Promise.all([
          base44.entities.Location.list("-created_date", 500).catch(() => []),
          base44.entities.Operative.list("-created_date", 500).catch(() => []),
          base44.entities.LeadClaim.list("-created_date", 200).catch(() => []),
        ]);
        if (cancelled) return;
        const live = (locs || []).filter((x) => x.status !== "rejected");
        setD({
          spots: live.length,
          verified: live.filter((x) => x.status === "verified").length,
          leads: (leads || []).filter((x) => x.status === "pending").length,
          ops: (ops || []).length,
          feed: (locs || []).slice(0, 10),
        });
      } catch { /* offline */ }
    };
    load();
    const id = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!d.feed.length) return;
    const id = setInterval(() => setFi((p) => (p + 1) % d.feed.length), 2600);
    return () => clearInterval(id);
  }, [d.feed.length]);

  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" });
  const cur = d.feed[fi];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:col-span-6">
      <div className="col-span-2 flex items-center justify-between border border-ozone/40 bg-void/50 px-3 py-2 backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ozone" />
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-ozone">// field telemetry</span>
        </span>
        <span className="flex items-center gap-2 font-mono text-[9px] tabular text-silver/70">
          <Activity className="h-3 w-3 text-ozone" /> BKK {time}
        </span>
      </div>

      <Stat label="Spots" value={d.spots} Icon={MapPin} color="rgb(var(--c-ozone))" />
      <Stat label="Operatives" value={d.ops} Icon={Radio} color="#1F51FF" />
      <Stat label="Verified" value={d.verified} Icon={ShieldCheck} color="#39FF14" />
      <Stat label="Leads" value={d.leads} Icon={Crosshair} color="#FF5C00" />

      <div className="col-span-2 flex items-center justify-between border border-slate2/60 bg-void/50 px-3 py-2 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">latest log</div>
          <div className="truncate font-mono text-[11px] font-bold text-silver">
            {cur ? cur.title : "// awaiting field input"}
          </div>
        </div>
        <span className="ml-2 shrink-0 font-mono text-[8px] tabular text-ozone">
          {cur ? relTime(cur.created_date) : ""}
        </span>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-2 border border-slate2/60 bg-void/50 px-3 py-2 backdrop-blur-sm">
        <span className="font-mono text-[9px] leading-[1.3] text-silver/60">Union-made by veterans &amp; street artists.</span>
        <div className="flex gap-1.5">
          <button onClick={onCommand} className="border border-flare/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void">Command</button>
          <Link to="/campaign" className="border border-ozone/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void">Fund</Link>
        </div>
      </div>
    </div>
  );
}