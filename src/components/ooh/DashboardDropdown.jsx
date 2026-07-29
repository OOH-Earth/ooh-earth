import { useState, useEffect } from "react";
import { LayoutDashboard, MapPin, Crosshair, Tv, Radio, ShieldCheck, Activity, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";

export default function DashboardDropdown() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [stats, setStats] = useState({ spots: 0, leads: 0, verified: 0, ops: 0 });

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.listAllLocations().catch(() => []),
      base44.entities.Operative.list("-created_date", 500).catch(() => []),
    ]).then(([locs, ops]) => {
      const live = (locs || []).filter((x) => x.status !== "rejected");
      setStats({
        spots: live.length,
        leads: live.filter((x) => !x.image_url && x.status !== "verified").length,
        verified: live.filter((x) => x.status === "verified").length,
        ops: (ops || []).length,
      });
    });
  }, [open]);

  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" });
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Bangkok" });

  const tiles = [
    { k: "Spots", v: stats.spots, Icon: MapPin, c: "rgb(var(--c-ozone))" },
    { k: "Leads", v: stats.leads, Icon: Crosshair, c: "#FF5C00" },
    { k: "Verified", v: stats.verified, Icon: ShieldCheck, c: "#39FF14" },
    { k: "Operatives", v: stats.ops, Icon: Radio, c: "#1F51FF" },
  ];
  const shortcuts = [
    { to: "/map", label: "Atlas", Icon: MapPin },
    { to: "/report", label: "Report", Icon: Crosshair },
    { to: "/channel", label: "Channel", Icon: Tv },
    { to: "/dashboard", label: "Console", Icon: LayoutDashboard },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Open dashboard"
          title="Dashboard"
          className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 border border-slate2 bg-void p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-dim">Dashboard</span>
          <Activity className="h-3 w-3 text-ozone animate-pulse" />
        </div>

        <div className="mt-2 border border-slate2 bg-card p-2.5">
          <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-dim">Asia/Bangkok</div>
          <div className="mt-1 font-mono text-xl font-bold tabular tracking-tight text-silver text-glow-ozone">{time}</div>
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">{date}</div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1">
          {tiles.map((t) => (
            <div key={t.k} className="border border-slate2 bg-card p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-dim">{t.k}</span>
                <t.Icon className="h-2.5 w-2.5" style={{ color: t.c }} />
              </div>
              <div className="mt-0.5 font-mono text-base font-bold tabular" style={{ color: t.c }}>{t.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1.5 border border-slate2 bg-card px-2 py-1.5">
          <Wind className="h-3 w-3 text-ozone/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-ozone animate-pulse" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">All nominal</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 border border-slate2 bg-card px-2 py-1.5 transition-colors hover:border-ozone hover:text-ozone"
            >
              <s.Icon className="h-3 w-3 text-ozone" />
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-silver">{s.label}</span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}