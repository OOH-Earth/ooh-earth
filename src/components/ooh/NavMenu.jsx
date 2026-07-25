import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  X, ChevronRight, ChevronDown, Compass,
  Home, Map as MapIcon, Megaphone, Scan, Tv, LayoutDashboard,
  Trash2, Coins, CreditCard, LayoutGrid, Info, Briefcase,
  BookOpen, Heart, Layers, LifeBuoy, Network, ShoppingBag,
} from "lucide-react";
import { BUS_STOP_AREAS } from "@/components/ooh/busStops";

const SITEMAP = [
  {
    group: "Command",
    items: [
      { to: "/", label: "Home" },
      { to: "/channel", label: "OOH·TV" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/fde", label: "FDE Portal" },
      { to: "/portfolio", label: "Atari Portfolio" },
    ],
  },
  {
    group: "Field Ops",
    items: [
      { to: "/map", label: "Maps" },
      { to: "/bus-stops", label: "Bus Stops" },
      { to: "/report", label: "Report" },
      { to: "/ar", label: "AR Lens" },
      { to: "/inhome", label: "In-Home" },
    ],
  },
  {
    group: "Bus Stops",
    cats: BUS_STOP_AREAS.map(({ area, stops }) => ({
      cat: area,
      items: stops.map((s) => ({ to: `/bus-stop/${s.id}`, label: s.name })),
    })),
  },
  {
    group: "Field Tools",
    items: [
      { to: "/scan", label: "TrueCost" },
      { to: "/trash", label: "Trash ID" },
      { to: "/zora", label: "Zora" },
      { to: "/field-id", label: "Field ID" },
      { to: "/card", label: "Union Card" },
      { to: "/kit", label: "UI Kit" },
    ],
  },
  {
    group: "Intel & Support",
    items: [
      { to: "/about", label: "About" },
      { to: "/careers", label: "Careers" },
      { to: "/guides", label: "Guides" },
      { to: "/campaign", label: "Fund" },
      { to: "/plans", label: "Plans" },
      { to: "/support", label: "Support" },
      { to: "/store", label: "Store" },
      { to: "/sitemap", label: "Sitemap" },
    ],
  },
];

const ICON = {
  Home, Maps: MapIcon, Report: Megaphone, "AR Lens": Scan, "In-Home": Tv,
  "OOH·TV": Tv, Dashboard: LayoutDashboard, TrueCost: Scan, "Trash ID": Trash2,
  Zora: Coins, "Field ID": CreditCard, "Union Card": CreditCard, "UI Kit": LayoutGrid,
  About: Info, Careers: Briefcase, Guides: BookOpen, Fund: Heart, Plans: Layers,
  Support: LifeBuoy, "Bus Stops": MapIcon, "FDE Portal": Compass, "Atari Portfolio": Coins, Sitemap: Network, Store: ShoppingBag,
};

const AREA_COUNT = BUS_STOP_AREAS.length;
const STOP_COUNT = BUS_STOP_AREAS.reduce((n, a) => n + a.stops.length, 0);

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const groupV = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

function BusStopsGroup({ variant, onClose }) {
  const [open, setOpen] = useState(false);
  const isSheet = variant === "sheet";
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-2 px-1 transition-colors hover:bg-slate2/30"
      >
        <span className={`flex items-center gap-2 ${isSheet ? "" : "border-b border-slate2/40 pb-1"}`}>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// Bus Stops</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">{AREA_COUNT} areas · {STOP_COUNT}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-dim/50 transition-transform duration-200 ${open ? "rotate-180 text-ozone" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={isSheet ? "space-y-3 pt-2" : "mb-2 space-y-2 pt-1"}>
              {BUS_STOP_AREAS.map(({ area, stops }) => (
                <div key={area}>
                  <div className="mb-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-dim/70">
                    <span className="text-dim/40">Field Ops</span>
                    <ChevronRight className="h-2.5 w-2.5 text-dim/30" />
                    <span className="text-dim/40">Bus Stops</span>
                    <ChevronRight className="h-2.5 w-2.5 text-dim/30" />
                    <span className="text-ozone/80">{area}</span>
                    <span className="ml-1 text-dim/40">· {stops.length}</span>
                  </div>
                  <div className={isSheet ? "grid grid-cols-2 gap-1" : "grid grid-cols-1 gap-0"}>
                    {stops.map((s) => (
                      <Link
                        key={s.id}
                        to={`/bus-stop/${s.id}`}
                        onClick={onClose}
                        className={
                          isSheet
                            ? "group truncate border border-slate2/40 px-2 py-1.5 font-display text-[11px] font-medium tracking-[-0.01em] text-silver/75 transition-colors hover:border-ozone/60 hover:bg-slate2/20 hover:text-ozone"
                            : "group flex items-center justify-between truncate border-b border-slate2/15 px-1 py-1.5 transition-colors hover:bg-slate2/30"
                        }
                      >
                        <span className="truncate font-display text-[12px] font-medium tracking-[-0.01em] text-silver/80 transition-colors group-hover:text-ozone">
                          {s.name}
                        </span>
                        {!isSheet && <ChevronRight className="h-3 w-3 shrink-0 text-dim/30 transition-colors group-hover:text-ozone" />}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileLauncher({ onClose, onTour }) {
  let n = 0;
  return (
    <motion.div
      key="mobile"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex flex-col bg-void md:hidden"
    >
      <div
        className="flex items-center justify-between border-b border-slate2/60 px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ozone">// Sitemap</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onTour?.(); onClose(); }}
            aria-label="Start tour"
            className="flex items-center gap-1.5 border border-slate2/60 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-darkgray transition-colors hover:border-ozone hover:text-ozone"
          >
            <Compass className="h-3.5 w-3.5" /> Tour
          </button>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center border border-slate2/60 text-dim transition-colors hover:border-flare hover:text-flare"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-10">
        <motion.div variants={list} initial="hidden" animate="show" exit="exit" className="space-y-5">
          {SITEMAP.map((g) => {
            if (g.cats) {
              return (
                <motion.div key={g.group} variants={groupV}>
                  <BusStopsGroup variant="sheet" onClose={onClose} />
                </motion.div>
              );
            }
            const items = g.items;
            return (
              <motion.div key={g.group} variants={groupV}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// {g.group}</span>
                  <span className="h-px flex-1 bg-slate2/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((l) => {
                    n += 1;
                    const Icon = ICON[l.label] || LayoutGrid;
                    return (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={onClose}
                        className="group flex flex-col gap-2 border border-slate2/50 bg-card p-3.5 transition-colors hover:border-ozone/60 hover:bg-slate2/20"
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="h-5 w-5 text-silver/70 transition-colors group-hover:text-ozone" />
                          <span className="font-mono text-[8px] tabular text-dim/40">{String(n).padStart(2, "0")}</span>
                        </div>
                        <span className="font-display text-sm font-semibold tracking-[-0.02em] text-silver/85 transition-colors group-hover:text-ozone">
                          {l.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

function PopoverLinks({ onClose }) {
  let n = 0;
  return (
    <motion.div variants={list} initial="hidden" animate="show" exit="exit" className="grid grid-cols-2 gap-x-5 gap-y-4 px-2 py-2">
      {SITEMAP.map((g) => (
        <motion.div key={g.group} variants={groupV}>
          {g.cats ? (
            <BusStopsGroup variant="popover" onClose={onClose} />
          ) : (
            <>
              <div className="mb-1 flex items-center gap-2 border-b border-slate2/40 pb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// {g.group}</span>
              </div>
              {g.items.map((l) => {
                n += 1;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={onClose}
                    className="group flex items-center justify-between border-b border-slate2/20 px-1 py-2 transition-colors hover:bg-slate2/30"
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[9px] tabular text-dim/50">{String(n).padStart(2, "0")}</span>
                      <span className="font-display text-[13px] font-semibold tracking-[-0.02em] text-silver/85 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ozone">
                        {l.label}
                      </span>
                    </span>
                    <span className="h-1 w-1 rounded-full bg-dim/40 transition-colors group-hover:bg-ozone" />
                  </Link>
                );
              })}
            </>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function NavMenu({ open, onClose, onTour }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
          />

          {/* Mobile · full-screen smart launcher */}
          <MobileLauncher onClose={onClose} onTour={onTour} />

          {/* Desktop · popover */}
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{ transformOrigin: "top right" }}
            className="fixed right-3 top-[60px] z-[100] hidden max-h-[calc(100vh-76px)] w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.6)] md:right-8 md:flex"
          >
            <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">// Sitemap</span>
              <button onClick={onClose} aria-label="Close menu" className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PopoverLinks onClose={onClose} />
            </div>
            <div className="border-t border-slate2/60 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// resistance</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}