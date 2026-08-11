import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Loader2, Sparkles, Telescope } from "lucide-react";

// --- Moon calculus (mirrors LunarMarketOverlay) ---
const SYNODIC = 29.530588853;
const EPOCH_NEW = new Date("2000-01-06T18:14:00Z").getTime();

function moonPhase(date) {
  const diff = (date.getTime() - EPOCH_NEW) / 86400000;
  return (((diff % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC; // 0 new · 0.5 full
}
function phaseLabel(p) {
  if (p < 0.03 || p > 0.97) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}
function illumination(p) {
  return Math.round((1 - Math.cos(p * 2 * Math.PI)) / 2 * 100);
}

// --- Cryptid "bets" signal flavour ---
const SIGNALS = [
  { match: ["conjunction", "align"], tag: "alignment · cryptids stacking longs", tone: "ozone" },
  { match: ["meteor", "shower"], tag: "cascade event · shorts loading", tone: "flare" },
  { match: ["full moon", "full"], tag: "peak volatility · bets open", tone: "ozone" },
  { match: ["new moon"], tag: "dark pool · accumulation", tone: "dim" },
  { match: ["opposition"], tag: "flare signal · momentum bet", tone: "flare" },
  { match: ["eclipse"], tag: "anomaly · max leverage", tone: "flare" },
  { match: ["super", "perigee"], tag: "anomaly · max leverage", tone: "ozone" },
  { match: ["iss", "satellite", "flyover", "pass"], tag: "transit · arbitrage window", tone: "ozone" },
  { match: ["planet"], tag: "drift signal · cryptids hedging", tone: "ozone" },
];
function cryptidSignal(type = "", title = "") {
  const hay = `${type} ${title}`.toLowerCase();
  const hit = SIGNALS.find((s) => s.match.some((m) => hay.includes(m)));
  return hit || { tag: "signal detected · cryptids watching", tone: "dim" };
}

const toneClass = (tone) =>
  tone === "ozone" ? "text-ozone border-ozone/50" : tone === "flare" ? "text-flare border-flare/50" : "text-dim border-slate2";

function fmtDate(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const today = new Date();
  const isToday = dt.toDateString() === today.toDateString();
  return isToday ? "Tonight" : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SkyIntel() {
  const today = new Date();
  const phase = moonPhase(today);
  const label = phaseLabel(phase);
  const illum = illumination(phase);
  const dateKey = today.toISOString().slice(0, 10);
  const cacheKey = `skyIntel_${dateKey}`;

  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(!localStorage.getItem(cacheKey));
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setEvents(JSON.parse(cached)); return; } catch { /* fall through */ }
    }
    let cancelled = false;
    base44.functions.invoke("cachedIntel", { key: "skyIntel" }).then((res) => {
      if (cancelled) return;
      const list = (res && res.data && res.data.events) || [];
      localStorage.setItem(cacheKey, JSON.stringify(list));
      setEvents(list);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dateKey]);

  const moonSignal = cryptidSignal(label.toLowerCase(), label);

  return (
    <section className="border-t border-slate2/40 px-5 py-14 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone animate-flicker">// sky intel — astro activity</span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-silver md:text-4xl">What the cryptids are watching tonight</h2>
          </div>
          <Telescope className="hidden h-7 w-7 text-ozone/70 md:block" />
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-[280px_1fr]">
          {/* Moon calculus */}
          <div className="flex flex-col gap-3 border border-slate2/60 bg-card p-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">moon calculus</span>
            <div className="flex items-center gap-4">
              <MoonGlyph phase={phase} />
              <div>
                <div className="font-display text-xl font-bold text-silver">{label}</div>
                <div className="font-mono text-[10px] tabular text-dim">{illum}% illuminated</div>
              </div>
            </div>
            <div className="mt-1 border border-slate2 px-2 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-darkgray">cryptid signal</span>
              <div className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${moonSignal.tone === "ozone" ? "text-ozone" : moonSignal.tone === "flare" ? "text-flare" : "text-dim"}`}>{moonSignal.tag}</div>
            </div>
            <p className="mt-1 font-mono text-[9px] leading-[1.5] uppercase tracking-[0.15em] text-dim">synodic 29.53d · phase drives action-intensity · full-moon windows marked ozone</p>
          </div>

          {/* Astro activity feed */}
          <div className="border border-slate2/60 bg-card">
            <div className="flex items-center gap-2 border-b border-slate2/60 px-4 py-2.5">
              <Bell className="h-3.5 w-3.5 text-ozone" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-darkgray">astro activity feed</span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{events?.length || 0} alerts · 7d</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto atlas-track">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10">
                  <Loader2 className="h-4 w-4 animate-spin text-ozone" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">Scanning ephemeris…</span>
                </div>
              ) : error || !events || !events.length ? (
                <div className="px-4 py-10 text-center">
                  <Sparkles className="mx-auto h-5 w-5 text-dim/50" />
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// clear skies — no notable events</span>
                </div>
              ) : (
                events.map((ev, i) => {
                  const sig = cryptidSignal(ev.type, ev.title);
                  return (
                    <div key={i} className="flex gap-3 border-b border-slate2/40 px-4 py-3 last:border-b-0">
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-[10px] font-bold tabular text-ozone">{fmtDate(ev.date)}</div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">{String(i + 1).padStart(2, "0")}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-bold tracking-[-0.01em] text-silver">{ev.title}</div>
                        <p className="mt-0.5 font-body text-xs leading-[1.5] text-darkgray">{ev.body}</p>
                        <span className={`mt-1.5 inline-block border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${toneClass(sig.tone)}`}>{sig.tag}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MoonGlyph({ phase }) {
  const r = 18;
  const offset = phase < 0.5 ? (1 - phase * 2) * r : (phase * 2 - 1) * r;
  return (
    <svg width={r * 2 + 4} height={r * 2 + 4} viewBox={`0 0 ${r * 2 + 4} ${r * 2 + 4}`} aria-hidden="true">
      <circle cx={r + 2} cy={r + 2} r={r} className="fill-silver/15" />
      <circle cx={r + 2 + (phase < 0.5 ? -offset : offset)} cy={r + 2} r={r} className="fill-silver" style={{ clipPath: `inset(0 0 0 50%)` }} transform={phase < 0.5 ? "" : "scale(-1,1) translate(-40,0)"} />
      <circle cx={r + 2} cy={r + 2} r={r} className="stroke-silver/40" strokeWidth="1" fill="none" />
    </svg>
  );
}
