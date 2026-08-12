import { motion } from 'framer-motion';

export default function GlobePreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-void">
      <div className="absolute inset-0 grid-bg" />
      <motion.div
        className="relative h-24 w-24"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(241,241,241,0.16)"
            strokeWidth="0.8"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="14"
            fill="none"
            stroke="rgba(237,255,0,0.35)"
            strokeWidth="0.7"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="28"
            fill="none"
            stroke="rgba(241,241,241,0.12)"
            strokeWidth="0.6"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="14"
            ry="38"
            fill="none"
            stroke="rgba(241,241,241,0.12)"
            strokeWidth="0.6"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="28"
            ry="38"
            fill="none"
            stroke="rgba(241,241,241,0.12)"
            strokeWidth="0.6"
          />
          <line x1="12" y1="50" x2="88" y2="50" stroke="rgba(237,255,0,0.22)" strokeWidth="0.6" />
        </svg>
        <span className="absolute left-[58%] top-[28%] h-1.5 w-1.5 rounded-full bg-ozone shadow-[0_0_6px_rgba(237,255,0,0.8)]" />
        <span className="absolute left-[28%] top-[56%] h-1.5 w-1.5 rounded-full bg-flare shadow-[0_0_6px_rgba(255,92,0,0.8)]" />
        <span className="absolute left-[68%] top-[64%] h-1 w-1 rounded-full bg-[#39FF14]" />
      </motion.div>
      <div className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.25em] text-dim/60">
        // field globe
      </div>
    </div>
  );
}
