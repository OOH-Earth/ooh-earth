import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Crosshair, Tv, LayoutDashboard, Radio, ShieldCheck, Activity, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CopyleftLogo from "@/components/ooh/CopyleftLogo";

export default function SmartDashboard({ open, onClose }) {
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
  const date = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

  const tiles = [
    { k: "Spots", v: stats.spots, Icon: MapPin, c: "#EDFF00" },
    { k: "Leads", v: stats.leads, Icon: Crosshair, c: "#FF5C00" },
    { k: "Verified", v: stats.verified, Icon: ShieldCheck, c: "#39FF14" },
    { k: "Members", v: stats.ops, Icon: Radio, c: "#1F51FF" },
  ];

  const shortcuts = [
    { to: "/map", label: "Atlas", Icon: MapPin },
    { to: "/report", label: "Report", Icon: Crosshair },
    { to: "/channel", label: "Channel", Icon: Tv },
    { to: "/dashboard", label: "Console", Icon: LayoutDashboard },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[61] flex w-[88vw] max-w-[360px] flex-col border-r border-slate2/60 bg-void/95"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <CopyleftLogo className="h-5 w-5 text-ozone" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-silver">Dashboard</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center border border-slate2 text-darkgray transition-colors hover:border-ozone hover:text-ozone"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="atlas-track flex-1 overflow-y-auto px-5 py-5">
              <div className="relative overflow-hidden border border-slate2/60 bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">Local · Asia/Bangkok</span>
                  <Activity className="h-3.5 w-3.5 text-ozone animate-pulse" />
                </div>
                <div className="mt-3 font-mono text-4xl font-bold tabular tracking-tight text-silver text-glow-ozone">{time}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">{date}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {tiles.map((t) => (
                  <div key={t.k} className="border border-slate2/60 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">{t.k}</span>
                      <t.Icon className="h-3 w-3" style={{ color: t.c }} />
                    </div>
                    <div className="mt-1.5 font-mono text-2xl font-bold tabular" style={{ color: t.c }}>{t.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 border border-slate2/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">Systems</span>
                  <Wind className="h-3.5 w-3.5 text-ozone/70" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ozone animate-pulse" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ozone">All systems nominal</span>
                </div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">network online · sync live</div>
              </div>

              <div className="mt-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">Scenes</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {shortcuts.map((s) => (
                    <Link
                      key={s.to}
                      to={s.to}
                      onClick={onClose}
                      className="flex items-center gap-2 border border-slate2/60 bg-card px-3 py-2.5 transition-colors hover:border-ozone hover:text-ozone"
                    >
                      <s.Icon className="h-3.5 w-3.5 text-ozone" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-silver">{s.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate2/60 px-5 py-3">
              <CopyleftLogo className="h-4 w-4 text-dim" />
              <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">open-source · union-made</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}