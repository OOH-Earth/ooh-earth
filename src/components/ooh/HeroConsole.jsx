import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, ShieldCheck, Crosshair, Activity, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCommandCenter } from "@/lib/commandCenterContext";

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

function Sparkline({ data, colorClass }) {
  if (!data || data.length < 2) return null;
  const w = 100, h = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`h-7 w-full overflow-visible ${colorClass}`}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="spark-area" d={area} fill="url(#spark-fill)" />
      <path className="spark-line" d={line} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, Icon, colorClass, suffix, to }) {
  const n = useCountUp(value);
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden border border-border bg-card p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ozone/50 hover:shadow-[0_10px_28px_-10px_rgba(0,0,0,0.55)] active:scale-[0.98]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ozone/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <ArrowUpRight className="absolute right-2 top-2 h-3 w-3 translate-y-1 text-ozone opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
          <Icon className={`h-3 w-3 ${colorClass}`} />
          {label}
        </span>
      </div>
      <div className={`mt-2 font-mono text-xl font-bold tabular leading-none ${colorClass}`}>
        {String(n).padStart(2, "0")}{suffix}
      </div>
    </Link>
  );
}

export default function HeroConsole() {
  const { openCommand } = useCommandCenter();
  const [d, setD] = useState({ spots: 0, verified: 0, leads: 0, ops: 0, rate: 0, feed: [], series: [], delta: 0 });
  const [now, setNow] = useState(() => new Date());
  const [fi, setFi] = useState(0);
  const spotsCount = useCountUp(d.spots, 1300);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statsRes, locs, leads] = await Promise.all([
          base44.functions.invoke("fieldStats", {}).catch(() => null),
          base44.listAllLocations().catch(() => []),
          base44.entities.LeadClaim.list("-created_date", 200).catch(() => []),
        ]);
        if (cancelled) return;
        const stats = statsRes?.data ?? statsRes ?? {};
        const live = (locs || []).filter((x) => x.status !== "rejected");
        const verified = live.filter((x) => x.status === "verified").length;

        const days = 14;
        const series = new Array(days).fill(0);
        const nowMs = Date.now();
        live.forEach((x) => {
          if (!x.created_date) return;
          const dayAgo = Math.floor((nowMs - new Date(x.created_date).getTime()) / 86400000);
          if (dayAgo >= 0 && dayAgo < days) series[days - 1 - dayAgo]++;
        });
        const recent = series.slice(7).reduce((a, b) => a + b, 0);
        const prev = series.slice(0, 7).reduce((a, b) => a + b, 0);
        const delta = prev > 0 ? Math.round(((recent - prev) / prev) * 100) : (recent > 0 ? 100 : 0);

        // Prefer server-computed, RLS-immune aggregates (fieldStats) so the public
        // HUD shows real numbers; fall back to direct counts if the call is down.
        const spots = Number(stats.reports) || live.length;
        const ver = (stats.verified != null && Number.isFinite(Number(stats.verified))) ? Number(stats.verified) : verified;
        setD({
          spots,
          verified: ver,
          leads: Number.isFinite(Number(stats.leads)) ? Number(stats.leads) : (leads || []).filter((x) => x.status === "pending").length,
          ops: (Number(stats.operatives) || 0) + (Number(stats.ai_agents) || 0),
          rate: spots ? Math.round((ver / spots) * 100) : 0,
          feed: (locs || []).slice(0, 10),
          series,
          delta,
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
  const tickerItems = d.feed.length ? d.feed : [{ title: "// awaiting field input", created_date: null }];
  const cur = d.feed[fi];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:col-span-6">
      {/* Header rail */}
      <div className="col-span-2 flex items-center justify-between border border-border bg-card px-3 py-2 rounded-xl">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ozone opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ozone" />
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-ozone">// field telemetry</span>
        </span>
        <span className="flex items-center gap-2 font-mono text-[9px] tabular text-muted-foreground">
          <Activity className="h-3 w-3 text-ozone" /> BKK {time}
        </span>
      </div>

      {/* Featured bento — live spots + sparkline + delta */}
      <Link to="/map" className="group relative col-span-2 block overflow-hidden border border-ozone/40 bg-card p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ozone hover:shadow-[0_14px_36px_-12px_rgba(0,0,0,0.6)] active:scale-[0.99]">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ozone/20 blur-2xl transition-all duration-300 group-hover:bg-ozone/30" />
        <div className="pointer-events-none absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-flare/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-ozone">// live spots</span>
            <div className="mt-1 flex items-end font-mono text-4xl font-bold tabular leading-none text-foreground text-glow-ozone">
              {String(spotsCount).padStart(3, "0")}
              <span className="ml-1 animate-blink text-ozone">_</span>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-ozone/40 px-2 py-0.5 font-mono text-[9px] tabular text-ozone">
            {d.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {d.delta >= 0 ? "+" : ""}{d.delta}%
          </span>
        </div>
        <div className="relative mt-3">
          <Sparkline key={d.series.join("-")} data={d.series} colorClass="text-ozone" />
        </div>
      </Link>

      <Stat label="Operatives" value={d.ops} Icon={Radio} colorClass="text-brand-blue" to="/map" />
      <Stat label="Verified" value={d.verified} Icon={ShieldCheck} colorClass="text-brand-green" to="/map" />
      <Stat label="Leads" value={d.leads} Icon={Crosshair} colorClass="text-flare" to="/campaign" />
      <Stat label="Verify rate" value={d.rate} Icon={ShieldCheck} colorClass="text-ozone" suffix="%" to="/map" />

      {/* Streaming ticker */}
      <div className="col-span-2 flex items-center gap-2 overflow-hidden border border-border bg-card px-3 py-2 rounded-xl">
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-ozone">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ozone" /> live feed
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee gap-6 whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((f, i) => (
              <span key={i} className="font-mono text-[9px] text-muted-foreground">
                <span className="text-ozone">›</span> {f.title}
                {f.created_date && <span className="ml-1 text-dim">{relTime(f.created_date)}</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Latest log highlight */}
      <Link to="/map" className="group col-span-2 flex items-center justify-between gap-2 border border-border bg-card px-3 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-ozone/50 active:scale-[0.99]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="h-6 w-0.5 shrink-0 bg-ozone transition-all duration-200 group-hover:h-7" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-muted-foreground">latest log</div>
            <div className="truncate font-mono text-[11px] font-bold text-foreground">
              {cur ? cur.title : "// awaiting field input"}
            </div>
          </div>
        </div>
        <span className="ml-2 shrink-0 font-mono text-[8px] tabular text-ozone">
          {cur ? relTime(cur.created_date) : ""}
        </span>
      </Link>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-between gap-2 border border-border bg-card px-3 py-2 rounded-xl">
        <span className="font-mono text-[9px] leading-[1.3] text-muted-foreground">Union-made by veterans &amp; street artists.</span>
        <div className="flex gap-1.5">
          <button onClick={openCommand} className="border border-flare/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flare transition-colors hover:bg-flare hover:text-void active:scale-[0.97]">Command</button>
          <Link to="/campaign" className="border border-ozone/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void active:scale-[0.97]">Fund</Link>
        </div>
      </div>
    </div>
  );
}