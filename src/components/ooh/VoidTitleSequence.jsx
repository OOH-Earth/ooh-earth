import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import { OOH_FUTURES } from "@/components/ooh/map/futures";

const DUR = { strobe: 750, title: 2600, future: 2100 };
const GLOWS = ["237,255,0", "0,234,255", "255,26,198", "57,255,20", "255,92,0"];

const chroma = (glow = "237,255,0") => ({
  color: "#fff",
  textShadow: `-2px 0 #FF1AC6, 2px 0 #00EAFF, 0 0 14px rgba(${glow},0.7), 0 0 40px rgba(${glow},0.25)`,
});

const SEQ = [
  { kind: "strobe" },
  { kind: "title", big: "OOH", sub: "OUT OF HELL™", tag: "VOID SEQUENCE · FUTURES 2026–2028", glow: "237,255,0" },
  ...OOH_FUTURES.map((f, i) => ({ kind: "future", ...f, idx: i, glow: GLOWS[i % GLOWS.length] })),
  { kind: "title", big: "OOH.EARTH", sub: "ENTER THE VOID", tag: "RESISTANCE BROADCASTING FROM THE FUTURE", glow: "255,26,198" },
];

function KaleidoTitle({ text, glow }) {
  return (
    <div className="relative">
      {["scaleX(-1)", "scale(1.08)", "scaleY(-1)"].map((tr, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-brand text-5xl font-black uppercase tracking-tight md:text-8xl"
          style={{ ...chroma(glow), transform: tr, opacity: 0.15 - i * 0.035, filter: "blur(4px)" }}
        >
          {text}
        </span>
      ))}
      <span className="relative block font-brand text-5xl font-black uppercase tracking-tight md:text-8xl" style={chroma(glow)}>
        {text}
      </span>
    </div>
  );
}

function Card({ item }) {
  if (item.kind === "strobe") {
    return (
      <div className="flex items-center justify-center">
        <span className="font-brand text-6xl font-black text-white/70 md:text-9xl" style={{ textShadow: "0 0 24px rgba(255,255,255,0.5)" }}>
          OOH
        </span>
      </div>
    );
  }
  if (item.kind === "title") {
    return (
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        {item.tag && (
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/50 md:text-xs" style={{ textShadow: `0 0 10px rgba(${item.glow},0.5)` }}>
            {item.tag}
          </span>
        )}
        <KaleidoTitle text={item.big} glow={item.glow} />
        {item.sub && (
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/75 md:text-sm" style={{ textShadow: "0 0 12px rgba(0,234,255,0.5)" }}>
            {item.sub}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40 md:text-[10px]">
        VOID UNIT · {String(item.idx + 1).padStart(2, "0")} / {OOH_FUTURES.length}
      </span>
      <KaleidoTitle text={item.city.toUpperCase()} glow={item.glow} />
      <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/80 md:text-xs" style={{ textShadow: `0 0 10px rgba(${item.glow},0.5)` }}>
        {item.phase} · {item.country.toUpperCase()}
      </span>
      <span className="max-w-md font-mono text-[9px] uppercase tracking-[0.2em] text-white/45 md:text-[11px]">{item.pillar}</span>
    </div>
  );
}

const variants = {
  initial: { opacity: 0, scale: 1.5, filter: "blur(20px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.7, filter: "blur(14px)" },
};

export default function VoidTitleSequence({ open, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    if (step >= SEQ.length) return;
    const dur = DUR[SEQ[step].kind] || 2000;
    const t = setTimeout(() => setStep((s) => s + 1), dur);
    return () => clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const item = SEQ[Math.min(step, SEQ.length - 1)];
  const progress = Math.min(step / (SEQ.length - 1), 1);

  return (
    <div className="fixed inset-0 z-[200] bg-black" role="dialog" aria-modal="true" aria-label="Enter the Void title sequence">
      <div className="pointer-events-none absolute inset-0 z-10 crt-scanlines opacity-40" />
      <div className="pointer-events-none absolute inset-0 z-10 grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-0 z-10" style={{ boxShadow: "inset 0 0 240px 80px rgba(0,0,0,0.9)" }} />

      <AnimatePresence>
        <motion.div
          key={`flash-${step}`}
          className="pointer-events-none absolute inset-0 z-20 bg-white"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Card item={item} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 py-4 md:px-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="h-px w-24 overflow-hidden bg-white/15 md:w-64">
          <motion.div className="h-full bg-ozone" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStep(0)}
            aria-label="Replay sequence"
            className="flex h-8 items-center gap-1.5 border border-slate2 bg-void/80 px-3 font-mono text-[9px] uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
          >
            <RotateCcw className="h-3 w-3" /> Replay
          </button>
          <button
            onClick={onClose}
            aria-label="Exit sequence"
            className="flex h-8 items-center gap-1.5 border border-slate2 bg-void/80 px-3 font-mono text-[9px] uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-flare hover:text-flare"
          >
            <X className="h-3 w-3" /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}