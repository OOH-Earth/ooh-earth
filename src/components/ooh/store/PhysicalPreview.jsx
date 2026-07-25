import { motion } from "framer-motion";

export default function PhysicalPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-ozone"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-5 w-5 rounded-full bg-ozone/80 shadow-[0_0_18px_rgba(237,255,0,0.6)]" />
      </motion.div>
      <motion.div
        className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        animate={{ x: ["-100%", "400%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.25em] text-dim/60">// prototype · 50</div>
    </div>
  );
}