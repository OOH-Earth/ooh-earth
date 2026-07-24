import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const SITEMAP = [
  {
    group: "Command",
    items: [
      { to: "/", label: "Home" },
      { to: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    group: "Field Ops",
    items: [
      { to: "/map", label: "Maps" },
      { to: "/report", label: "Report" },
      { to: "/ar", label: "AR Lens" },
      { to: "/inhome", label: "In-Home" },
    ],
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
      { to: "/guides", label: "Guides" },
      { to: "/campaign", label: "Fund" },
      { to: "/plans", label: "Plans" },
      { to: "/support", label: "Support" },
    ],
  },
];

const ROUTE_COUNT = SITEMAP.reduce((n, g) => n + g.items.length, 0);

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const groupV = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

function SheetLinks({ onClose }) {
  let n = 0;
  return (
    <motion.div variants={list} initial="hidden" animate="show" exit="exit" className="space-y-4">
      {SITEMAP.map((g) => (
        <motion.div key={g.group} variants={groupV}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// {g.group}</span>
            <span className="h-px flex-1 bg-slate2/40" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {g.items.map((l) => {
              n += 1;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={onClose}
                  className="group flex flex-col gap-1 border border-slate2/50 px-3 py-3 transition-colors hover:border-ozone/60 hover:bg-slate2/20"
                >
                  <span className="font-mono text-[9px] tabular text-dim/50">{String(n).padStart(2, "0")}</span>
                  <span className="font-display text-sm font-semibold tracking-[-0.02em] text-silver/85 transition-colors group-hover:text-ozone">
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PopoverLinks({ onClose }) {
  let n = 0;
  return (
    <motion.div variants={list} initial="hidden" animate="show" exit="exit" className="grid grid-cols-2 gap-x-5 gap-y-4 px-2 py-2">
      {SITEMAP.map((g) => (
        <motion.div key={g.group} variants={groupV}>
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
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function NavMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
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

          {/* Mobile · native bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[88vh] flex-col rounded-t-2xl border-t border-slate2 bg-void md:hidden"
          >
            <div className="flex justify-center pt-2.5">
              <span className="h-1 w-10 rounded-full bg-slate2" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">// Sitemap · {ROUTE_COUNT} routes</span>
              <button onClick={onClose} aria-label="Close menu" className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-5">
              <SheetLinks onClose={onClose} />
            </div>
            <div className="border-t border-slate2/60 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// Out Of Hell™ · ✺ resistance</span>
            </div>
          </motion.div>

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
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">// Sitemap · {ROUTE_COUNT} routes</span>
              <button onClick={onClose} aria-label="Close menu" className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PopoverLinks onClose={onClose} />
            </div>
            <div className="border-t border-slate2/60 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// Out Of Hell™ · ✺ resistance</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}