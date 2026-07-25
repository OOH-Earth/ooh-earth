import { motion } from "framer-motion";

export default function NftDropPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <motion.div
        className="relative h-16 w-16"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rotate-45 border-2 border-ozone" />
        <div className="absolute inset-2 border border-flare/60" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ozone animate-pulse shadow-[0_0_16px_rgba(237,255,0,0.7)]" />
      </motion.div>
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-ozone/20 to-transparent"
        animate={{ x: ["-100%", "300%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.25em] text-flare">// drop · 101</div>
    </div>
  );
}