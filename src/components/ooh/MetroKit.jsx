import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Flame, Check, ArrowRight, Building2, Cctv, Zap, MapPin } from "lucide-react";

// Metro UI Kit — clean, solid, bordered cards with soft shadows.
// Pulls live telemetry from the fieldStats function with static fallback.
const STACK_IMG = "https://base44.app/api/apps/6a62213cff3ccbca88c04ff5/files/mp/public/6a62213cff3ccbca88c04ff5/0c368a455_1777667192-01-4t5x.webp";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const DONE = [true, true, true, true, false, true, false];

const CITY_ROWS = [
  { t: "11:30 AM", s: "Corporate owner identified — JCDecaux", m: "30 min", on: true },
  { t: "05:00 PM", s: "Planning objection filed — Camden Council", m: "10 min", on: true },
  { t: "10:00 PM", s: "Subvertising action documented — São Paulo", m: "5 min", on: false },
  { t: "07:30 AM", s: "Morning sweep — new spot logged", m: "15 min", on: false },
];

const PILLS = [
  { Icon: Building2, t: "Public Space Privatization" },
  { Icon: Cctv, t: "Surveillance Infrastructure" },
  { Icon: Zap, t: "Energy Waste" },
];

function Ring({ pct, label, color }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 120); return () => clearTimeout(t); }, []);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 64 64" className="h-16 w-16">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-primary-foreground/15" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={go ? off : c} transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text x="32" y="37" textAnchor="middle" className="fill-primary-foreground text-[11px] font-bold" style={{ fontFamily: "inherit" }}>{pct}%</text>
      </svg>
      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-primary-foreground/60">{label}</span>
    </div>
  );
}

export default function MetroKit() {
  const [s, setS] = useState({ reports: 0, verified: 0, raised: 0 });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("fieldStats", {});
        const d = res.data || {};
        if (active) setS({ reports: d.reports || 0, verified: d.verified || 0, raised: d.raised || 0 });
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const billboardsPct = Math.min(100, Math.round((s.reports / 200) * 100) || 15);
  const actionsPct = s.reports ? Math.min(100, Math.round((s.verified / s.reports) * 100)) : 100;
  const fundedPct = Math.min(100, Math.round((s.raised / 50000) * 100) || 71);

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-24">
        <div className="mb-10 max-w-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">// metro field kit</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-4xl">
            Community tools that power coordinated action.
          </h2>
          <p className="mt-3 font-display text-sm leading-relaxed text-muted-foreground">
            OOH Street Maps connects mappers with local activists, surfaces patterns in corporate advertising,
            and alerts communities to new threats — from planning applications to illegal installations.
          </p>
        </div>

        <div className="grid gap-4 [&>article]:min-w-0 md:grid-cols-2 md:gap-5">
          {/* 1 · Offense Categories — light card */}
          <article className="group flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ozone/50 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.65)] active:scale-[0.99]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-foreground">9 Offense Categories</h3>
                <p className="mt-1 font-display text-[13px] leading-relaxed text-muted-foreground">
                  Every ad tells a story the advertiser doesn't want you to read — from psychological manipulation to cultural erasure.
                </p>
              </div>
              <span className="font-mono text-[10px] tabular text-muted-foreground/60">09</span>
            </div>

            <div className="rounded-lg border border-border bg-foreground/5 p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-flare" />
                <span className="font-display text-sm font-bold text-foreground">28 Day Streak Active</span>
              </div>
              <p className="mt-1 font-display text-[12px] text-muted-foreground">Build honest streaks that reflect real commitment.</p>
              <div className="mt-3 flex items-center justify-between">
                {WEEK.map((d, i) => (
                  <div key={i} className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-mono text-[9px] font-bold text-muted-foreground">
                    {d}
                    {DONE[i] && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#39FF14] text-void">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              {PILLS.map((p) => (
                <span key={p.t} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <p.Icon className="h-3 w-3 text-ozone" /> {p.t}
                </span>
              ))}
            </div>
          </article>

          {/* 2 · Global Offense Map — inverted card */}
          <article className="group metro-invert flex flex-col gap-5 rounded-xl border border-border bg-primary p-6 text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ozone/40 hover:shadow-[0_18px_44px_-18px_rgba(237,255,0,0.22)] active:scale-[0.99]">
            <div>
              <h3 className="font-display text-lg font-bold tracking-[-0.01em]">Global Offense Map</h3>
              <p className="mt-1 font-display text-[13px] leading-relaxed text-primary-foreground/60">
                A simple view that shows only the field actions active right now across documented cities.
              </p>
            </div>

            <div className="metro-sub rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-4">
              <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/70">City Dashboard</span>
                <span className="font-mono text-[10px] tabular text-primary-foreground/80">{billboardsPct}% Completion</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {CITY_ROWS.map((r, i) => (
                  <div key={i} className="metro-row flex items-center gap-3 rounded-md bg-primary-foreground/5 px-2.5 py-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.on ? "bg-[#39FF14]" : "bg-primary-foreground/30"}`} />
                    <span className="font-mono text-[9px] tabular text-primary-foreground/50">{r.t}</span>
                    <span className="min-w-0 flex-1 truncate font-display text-[12px] font-medium">{r.s}</span>
                    <span className="font-mono text-[8px] text-primary-foreground/40">{r.m}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/map" className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-sm font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/90 transition-colors hover:text-primary-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
              Open atlas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>

          {/* 3 · Community Action Stacks — image card */}
          <article className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-xl border border-border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ozone/50 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.65)] active:scale-[0.99]">
            <Image src={STACK_IMG} alt="Documented street-art response over a corporate billboard" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]" fittingType="fill" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20" />
            <div className="relative">
              <h3 className="font-display text-lg font-bold tracking-[-0.01em] text-white">Community Action Stacks</h3>
              <p className="mt-1 max-w-xs font-display text-[13px] leading-relaxed text-white/70">
                Group field actions into simple blocks so your day feels organized instead of scattered.
              </p>
            </div>
            <Link
              to="/report"
              className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] !text-black !no-underline transition-colors hover:bg-ozone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozone focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Start documenting now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>

          {/* 4 · City Impact Reports — inverted card with rings */}
          <article className="group metro-invert flex flex-col gap-5 rounded-xl border border-border bg-primary p-6 text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ozone/40 hover:shadow-[0_18px_44px_-18px_rgba(237,255,0,0.22)] active:scale-[0.99]">
            <div>
              <h3 className="font-display text-lg font-bold tracking-[-0.01em]">City Impact Reports</h3>
              <p className="mt-1 font-display text-[13px] leading-relaxed text-primary-foreground/60">
                A clear summary of the month — what improved, what still needs adjusting.
              </p>
            </div>

            <div className="metro-sub rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-5">
              <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/70">Your city this month</div>
              <div className="flex items-center justify-around">
                <Ring pct={billboardsPct} label="Billboards" color="#FF8A00" />
                <Ring pct={actionsPct} label="Actions" color="#8A2BE2" />
                <Ring pct={fundedPct} label="Funded" color="#39FF14" />
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground/50">
              <MapPin className="h-3 w-3 text-primary-foreground/70" /> Live telemetry · updates hourly
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}