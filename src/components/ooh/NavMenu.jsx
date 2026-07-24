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

const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const panel = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

export default function NavMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
          <motion.div
            key="panel"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[101] flex flex-col bg-void"
          >
            <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
              <span className="font-brand text-sm text-silver">
                ooh<span className="text-ozone">.</span>earth
              </span>
              <button onClick={onClose} aria-label="Close menu" className="group flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:text-flare">
                <span className="hidden sm:inline">Close</span>
                <span className="flex h-9 w-9 items-center justify-center border border-slate2 transition-colors group-hover:border-flare">
                  <X className="h-4 w-4" />
                </span>
              </button>
            </div>

            <motion.nav
              variants={list}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-1 flex-col justify-center overflow-y-auto px-5 md:px-8"
            >
              <ul className="mx-auto w-full max-w-3xl">
                {LINKS.map((l, i) => (
                  <motion.li key={l.to} variants={item} className="border-b border-slate2/40">
                    <Link
                      to={l.to}
                      onClick={onClose}
                      className="group flex items-baseline gap-4 py-3 md:py-4"
                    >
                      <span className="font-mono text-[9px] tabular text-dim/50">{String(i + 1).padStart(2, "0")}</span>
                      <span className="relative overflow-hidden">
                        <span className="block font-display text-3xl font-semibold tracking-[-0.02em] text-silver/85 transition-all duration-300 group-hover:translate-x-2 group-hover:text-ozone md:text-5xl">
                          {l.label}
                        </span>
                        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ozone transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>

            <div className="flex items-center justify-between px-5 py-4 md:px-8">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim">// Out Of Hell™ · resistance protocol</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-dim/60">Web7</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}