import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const LINKS = [
  { to: "/#mandate", label: "Mandate" },
  { to: "/#atlas", label: "Atlas" },
  { to: "/map", label: "Maps" },
  { to: "/inhome", label: "In-Home" },
  { to: "/zora", label: "Zora" },
  { to: "/report", label: "Report" },
  { to: "/ar", label: "AR Lens" },
  { to: "/scan", label: "TrueCost" },
  { to: "/trash", label: "Trash ID" },
  { to: "/campaign", label: "Fund" },
  { to: "/about", label: "About" },
  { to: "/plans", label: "Plans" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/support", label: "Support" },
];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const item = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.15 } },
};

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
            key="catcher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99]"
          />
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{ transformOrigin: "top right" }}
            className="fixed right-3 top-[60px] z-[100] flex max-h-[calc(100vh-76px)] w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.6)] md:right-8"
          >
            <div className="flex items-center justify-between border-b border-slate2/60 px-5 py-4">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ozone">// Navigate</span>
              <button onClick={onClose} aria-label="Close menu" className="flex h-7 w-7 items-center justify-center text-dim transition-colors hover:text-flare">
                <X className="h-4 w-4" />
              </button>
            </div>

            <motion.nav
              variants={list}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex-1 overflow-y-auto px-2 py-2"
            >
              {LINKS.map((l, i) => (
                <motion.div key={l.to} variants={item}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="group flex items-center justify-between border-b border-slate2/30 px-3 py-2.5 transition-colors hover:bg-slate2/30"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[9px] tabular text-dim/50">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-display text-lg font-semibold tracking-[-0.02em] text-silver/85 transition-all duration-200 group-hover:translate-x-1 group-hover:text-ozone">
                        {l.label}
                      </span>
                    </span>
                    <span className="h-1 w-1 rounded-full bg-dim/40 transition-colors group-hover:bg-ozone" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="border-t border-slate2/60 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">// Out Of Hell™ · ✺ resistance</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}