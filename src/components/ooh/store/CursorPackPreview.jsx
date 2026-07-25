import { motion } from "framer-motion";

export default function CursorPackPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-3 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 bg-slate2/40" style={{ width: `${55 + i * 10}%` }} />
        ))}
      </div>
      <motion.div
        className="absolute h-5 w-5 border border-ozone"
        animate={{ x: [8, 110, 50, 8], y: [8, 28, 64, 8] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        style={{ left: 0, top: 0 }}
      >
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-ozone" />
        <div className="absolute -left-2 top-1/2 h-px w-2 -translate-y-1/2 bg-ozone" />
        <div className="absolute -right-2 top-1/2 h-px w-2 -translate-y-1/2 bg-ozone" />
        <div className="absolute left-1/2 -top-2 h-2 w-px -translate-x-1/2 bg-ozone" />
        <div className="absolute left-1/2 -bottom-2 h-2 w-px -translate-x-1/2 bg-ozone" />
      </motion.div>
      <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.25em] text-dim/60">// cursor pack</div>
    </div>
  );
}