import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, MapPin, BadgeCheck, Users, Building2, DollarSign, Monitor, Flag, Globe2 } from "lucide-react";
import { MOVEMENT, PLATFORM_STATUS, MOVEMENT_NOTE, fmtK } from "@/components/ooh/movementEstimate";

// Live streaming "Field Pulse" strip for the orbital HUD. Two clearly-separated
// layers: (1) a MOVEMENT-WIDE ESTIMATE of global subvertising since 2012 (tagged
// "EST", never presented as ours) and (2) OOH Earth's own LIVE platform numbers
// from the audited fieldStats function — kept honest, with a founding-stage status
// chip so our day-one scale is never mistaken for the movement's. Plus live markets.
export default function FieldStatsHud() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const out = [];

      // — Movement-wide estimate (since 2012) — clearly tagged EST, not OOH Earth's —
      out.push({ divider: true, tone: "flare", label: `MOVEMENT · EST · SINCE ${MOVEMENT.since}`, title: MOVEMENT_NOTE });
      out.push({ icon: Users, label: "SUBVERTISERS", value: `~${fmtK(MOVEMENT.subvertisers)}+`, est: true });
      out.push({ icon: Zap, label: "INTERVENTIONS", value: `~${fmtK(MOVEMENT.interventions)}+`, est: true });
      out.push({ icon: Flag, label: "COLLECTIVES", value: `${MOVEMENT.collectives}+`, est: true });
      out.push({ icon: Globe2, label: "COUNTRIES", value: `${MOVEMENT.countries}+`, est: true });
      out.push({ icon: BadgeCheck, label: "YEARS ACTIVE", value: `${MOVEMENT.years} YRS`, est: true });

      // — OOH Earth platform (live, audited, honest) —
      out.push({ divider: true, tone: "ozone", label: "OOH EARTH · LIVE PLATFORM" });
      try {
        const res = await base44.functions.invoke("fieldStats", {});
        const s = res.data || {};
        if (s.points != null) out.push({ icon: Zap, label: "RESISTANCE", value: `${Number(s.points).toLocaleString()} PTS`, accent: "text-ozone" });
        if (s.reports != null) out.push({ icon: MapPin, label: "LOCATIONS", value: s.reports });
        if (s.digital_busts != null) out.push({ icon: Monitor, label: "DIGITAL", value: s.digital_busts, accent: "text-ozone" });
        if (s.verified != null) out.push({ icon: BadgeCheck, label: "VERIFIED", value: s.verified, accent: "text-[#39FF14]" });
        if (s.operatives != null) out.push({ icon: Users, label: "MEMBERS", value: s.operatives });
        if (s.cities != null) out.push({ icon: Building2, label: "CITIES", value: s.cities, accent: "text-flare" });
      } catch (e) {
        out.push({ icon: MapPin, label: "PLATFORM", value: "SYNCING…" });
      }
      // Founding-stage status — makes the early-access, seeking-backers reality explicit.
      out.push({ divider: true, tone: "ozone", pulse: true, label: PLATFORM_STATUS });

      // — Live markets —
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
      {items.map((it, i) =>
        it.divider ? (
          <span key={i} title={it.title} className="flex shrink-0 items-center gap-1.5 border-l border-r border-slate2/40 bg-background/60 px-3">
            <span className={`h-1.5 w-1.5 rounded-full ${it.tone === "flare" ? "bg-flare" : "bg-ozone"} ${it.pulse ? "animate-blink" : ""}`} />
            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.25em] ${it.tone === "flare" ? "text-flare" : "text-ozone"}`}>{it.label}</span>
          </span>
        ) : (
          <span key={i} className="flex shrink-0 items-center gap-1.5 px-4">
            <it.icon className={`h-3 w-3 ${it.est ? "text-flare" : "text-ozone"}`} />
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray">{it.label}</span>
            <span className={`font-mono text-[10px] tabular ${it.accent || (it.est ? "text-flare" : "text-silver")}`}>{it.value}</span>
            {it.est && (
              <span className="border border-flare/40 px-1 font-mono text-[8px] uppercase leading-tight tracking-[0.15em] text-flare/80">est</span>
            )}
            {it.delta && (
              <span className={`font-mono text-[9px] ${it.up ? "text-ozone" : "text-flare"}`}>
                {it.up ? "▲" : "▼"}{it.delta}
              </span>
            )}
            <span className="text-slate2">◆</span>
          </span>
        )
      )}
    </>
  );
}
