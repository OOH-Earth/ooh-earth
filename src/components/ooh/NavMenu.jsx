import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, ArrowUpRight } from "lucide-react";

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function NavMenu({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[101] flex h-full w-[min(380px,100vw)] flex-col border-l border-slate2 bg-void"
          >
            <div className="flex items-center justify-between border-b border-slate2/60 px-6 py-5">
              <span className="font-brand text-sm text-silver">
                ooh<span className="text-ozone">.</span>earth
              </span>
              <button onClick={onClose} aria-label="Close menu" className="text-dim transition-colors hover:text-flare">
                <X className="h-5 w-5" />
              </button>
            </div>

            <motion.nav
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-6 py-8"
            >
              {LINKS.map((l, i) => (
                <motion.div key={l.to} variants={item}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="group flex items-center justify-between py-2 font-display text-2xl font-semibold tracking-[-0.02em] text-silver/80 transition-colors hover:text-ozone"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[9px] tabular text-dim/60">{String(i + 1).padStart(2, "0")}</span>
                      {l.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            <div className="border-t border-slate2/60 px-6 py-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// Out Of Hell™ · resistance protocol</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}