import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, MapPin, BadgeCheck, Users, Building2, DollarSign, Monitor } from "lucide-react";

// Live streaming "Field Pulse" strip for the orbital HUD — connects atlas,
// leaderboard points, operatives, funding and live crypto into one ticker.
export default function FieldStatsHud() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const out = [];
      try {
        const res = await base44.functions.invoke("fieldStats", {});
        const s = res.data || {};
        if (s.points != null) out.push({ icon: Zap, label: "RESISTANCE", value: `${Number(s.points).toLocaleString()} PTS`, accent: "text-ozone" });
        if (s.reports != null) out.push({ icon: MapPin, label: "LOCATIONS", value: s.reports });
        if (s.digital_busts != null) out.push({ icon: Monitor, label: "DIGITAL", value: s.digital_busts, accent: "text-ozone" });
        if (s.verified != null) out.push({ icon: BadgeCheck, label: "VERIFIED", value: s.verified, accent: "text-[#39FF14]" });
        if (s.operatives != null) out.push({ icon: Users, label: "OPERATIVES", value: s.operatives });
        if (s.cities != null) out.push({ icon: Building2, label: "CITIES", value: s.cities, accent: "text-flare" });
        if (s.raised != null) out.push({ icon: DollarSign, label: "FUNDED", value: `$${Number(s.raised).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, accent: "text-flare" });
      } catch (e) {
        /* fieldStats unavailable — crypto still streams */
      }

      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true");
        const j = await r.json();
        const coin = (id, sym, dp) => {
          const c = j[id];
          if (!c) return null;
          const chg = c.usd_24h_change || 0;
          return { icon: DollarSign, label: sym, value: `$${Number(c.usd).toLocaleString(undefined, { maximumFractionDigits: dp })}`, delta: `${Math.abs(chg).toFixed(1)}%`, up: chg >= 0 };
        };
        [coin("bitcoin", "BTC", 0), coin("ethereum", "ETH", 0), coin("solana", "SOL", 2)].forEach((c) => { if (c) out.push(c); });
      } catch (e) {
        /* crypto feed unreachable */
      }

      if (active) setItems(out);
    };
    load();
    const id = setInterval(load, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[950] border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-6px_20px_rgba(0,0,0,0.10)]">
      <div className="relative flex h-9 items-center overflow-hidden">
        <div className="relative z-30 flex h-full shrink-0 items-center gap-2 border-r border-border bg-background px-3">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-[#FF0033]" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#FF0033]">Live</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-ozone">Field Pulse</span>
        </div>
        {items.length ? (
          <div className="flex w-max animate-marquee items-center">
            <Row items={items} />
            <Row items={items} />
          </div>
        ) : (
          <span className="px-4 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// syncing field telemetry…</span>
        )}
      </div>
    </div>
  );
}

function Row({ items }) {
  return (
    <>
      {items.map((it, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1.5 px-4">
          <it.icon className="h-3 w-3 text-ozone" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray">{it.label}</span>
          <span className={`font-mono text-[10px] tabular ${it.accent || "text-silver"}`}>{it.value}</span>
          {it.delta && (
            <span className={`font-mono text-[9px] ${it.up ? "text-ozone" : "text-flare"}`}>
              {it.up ? "▲" : "▼"}{it.delta}
            </span>
          )}
          <span className="text-slate2">◆</span>
        </span>
      ))}
    </>
  );
}